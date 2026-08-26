"""
Test script for the PlantVillage MobileNet ONNX model.

Usage:
    python ml/scripts/test_pretrained_model.py <IMAGE_PATH>

The IMAGE_PATH may be absolute or relative to the project root.
"""

import argparse
import json
import sys
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image

# ---------------------------------------------------------------------------
# Constants – paths are relative to the project root
# ---------------------------------------------------------------------------
PROJECT_ROOT = Path(__file__).resolve().parents[2]

MODEL_DIR = PROJECT_ROOT / "ml" / "models" / "plantvillage_mobilenet"
MODEL_PATH = MODEL_DIR / "model.onnx"
CLASS_NAMES_PATH = MODEL_DIR / "class_names.json"

EXPECTED_NUM_CLASSES = 15

# ImageNet normalisation statistics
IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
IMAGENET_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)

# Potato class names as they appear in class_names.json
POTATO_EARLY_BLIGHT = "Potato___Early_blight"
POTATO_LATE_BLIGHT = "Potato___Late_blight"
POTATO_HEALTHY = "Potato___healthy"
POTATO_CLASSES = {POTATO_EARLY_BLIGHT, POTATO_LATE_BLIGHT, POTATO_HEALTHY}

POTATO_CONDITION_MAP = {
    POTATO_EARLY_BLIGHT: "Early blight",
    POTATO_LATE_BLIGHT: "Late blight",
    POTATO_HEALTHY: "Healthy",
}


# ---------------------------------------------------------------------------
# Preprocessing
# ---------------------------------------------------------------------------

def preprocess_image(image_path: Path) -> np.ndarray:
    """Load an image, resize/center-crop to 224×224, normalise, and return
    a float32 array with shape [1, 3, 224, 224] (NCHW)."""
    image = Image.open(image_path).convert("RGB")

    # Resize shortest side to 256 then center-crop to 224  (standard torchvision)
    w, h = image.size
    scale = 256 / min(w, h)
    new_w = int(round(w * scale))
    new_h = int(round(h * scale))
    image = image.resize((new_w, new_h), Image.BILINEAR)

    # Center crop
    left = (new_w - 224) // 2
    top = (new_h - 224) // 2
    image = image.crop((left, top, left + 224, top + 224))

    array = np.array(image, dtype=np.float32) / 255.0         # HWC, [0,1]
    array = (array - IMAGENET_MEAN) / IMAGENET_STD             # normalise
    array = np.transpose(array, (2, 0, 1))                     # HWC -> CHW
    array = np.expand_dims(array, axis=0)                      # CHW -> NCHW
    return array


# ---------------------------------------------------------------------------
# Softmax helper
# ---------------------------------------------------------------------------

def softmax(logits: np.ndarray) -> np.ndarray:
    """Numerically stable softmax over a 1-D array."""
    shifted = logits - np.max(logits)
    exp_vals = np.exp(shifted)
    return exp_vals / exp_vals.sum()


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run inference with the PlantVillage MobileNet ONNX model.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "image_path",
        type=str,
        help="Path to the input image (absolute, or relative to project root).",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    # ------------------------------------------------------------------
    # 1. Resolve image path
    # ------------------------------------------------------------------
    raw_path = Path(args.image_path)
    image_path = raw_path if raw_path.is_absolute() else PROJECT_ROOT / raw_path

    if not image_path.exists():
        print(f"ERROR: image not found: {image_path}", file=sys.stderr)
        sys.exit(1)

    # ------------------------------------------------------------------
    # 2. Verify model files exist
    # ------------------------------------------------------------------
    if not MODEL_PATH.exists():
        print(f"ERROR: model not found: {MODEL_PATH}", file=sys.stderr)
        sys.exit(1)

    data_file = MODEL_DIR / "model.onnx.data"
    if not data_file.exists():
        print(f"ERROR: model data file not found: {data_file}", file=sys.stderr)
        sys.exit(1)

    if not CLASS_NAMES_PATH.exists():
        print(f"ERROR: class names not found: {CLASS_NAMES_PATH}", file=sys.stderr)
        sys.exit(1)

    # ------------------------------------------------------------------
    # 3. Load class names and validate
    # ------------------------------------------------------------------
    with open(CLASS_NAMES_PATH, "r", encoding="utf-8") as f:
        class_names: list[str] = json.load(f)

    if len(class_names) != EXPECTED_NUM_CLASSES:
        print(
            f"ERROR: expected {EXPECTED_NUM_CLASSES} class names, "
            f"got {len(class_names)}.",
            file=sys.stderr,
        )
        sys.exit(1)

    # ------------------------------------------------------------------
    # 4. Load ONNX model
    # ------------------------------------------------------------------
    session = ort.InferenceSession(
        str(MODEL_PATH),
        providers=["CPUExecutionProvider"],
    )

    input_info = session.get_inputs()[0]
    output_info = session.get_outputs()[0]

    # ------------------------------------------------------------------
    # 5. Validate model output dimension
    # ------------------------------------------------------------------
    output_shape = output_info.shape  # e.g. ['batch', 15]
    if len(output_shape) >= 2:
        dim = output_shape[-1]
        if isinstance(dim, int) and dim != EXPECTED_NUM_CLASSES:
            print(
                f"ERROR: model output dimension is {dim}, "
                f"expected {EXPECTED_NUM_CLASSES}.",
                file=sys.stderr,
            )
            sys.exit(1)

    # ------------------------------------------------------------------
    # 6. Print model / image info
    # ------------------------------------------------------------------
    print("=" * 60)
    print("MODEL INFO")
    print("=" * 60)
    print(f"Model      : {MODEL_PATH}")
    print(f"Input name : {input_info.name}")
    print(f"Input shape: {input_info.shape}")
    print(f"Input type : {input_info.type}")
    print(f"Output name: {output_info.name}")
    print(f"Output shape (declared): {output_info.shape}")
    print(f"Classes    : {len(class_names)}")
    print()
    print("IMAGE")
    print("-" * 60)
    print(f"Path       : {image_path}")

    # ------------------------------------------------------------------
    # 7. Preprocess
    # ------------------------------------------------------------------
    tensor = preprocess_image(image_path)
    print(f"Tensor shape: {tensor.shape}  dtype: {tensor.dtype}")

    # ------------------------------------------------------------------
    # 8. Run inference
    # ------------------------------------------------------------------
    outputs = session.run(None, {input_info.name: tensor})

    # outputs[0] shape is [1, 15]
    logits = np.asarray(outputs[0])      # ensure numpy array
    logits = logits[0]                   # squeeze batch dimension -> [15,]

    # Validate runtime output dimension
    if logits.shape[0] != EXPECTED_NUM_CLASSES:
        print(
            f"ERROR: runtime output has {logits.shape[0]} values, "
            f"expected {EXPECTED_NUM_CLASSES}.",
            file=sys.stderr,
        )
        sys.exit(1)

    # ------------------------------------------------------------------
    # 9. Compute probabilities
    # ------------------------------------------------------------------
    probabilities = softmax(logits)

    prediction_index = int(np.argmax(probabilities))
    predicted_class = class_names[prediction_index]
    confidence = float(probabilities[prediction_index])

    # ------------------------------------------------------------------
    # 10. Print results
    # ------------------------------------------------------------------
    print()
    print("=" * 60)
    print("PREDICTION")
    print("=" * 60)
    print(f"Predicted class : {predicted_class}")
    print(f"Confidence      : {confidence:.4%}")

    print()
    print("TOP-5 PREDICTIONS")
    print("-" * 60)
    top5_indices = np.argsort(probabilities)[::-1][:5]
    for rank, idx in enumerate(top5_indices, start=1):
        marker = " <-- top" if rank == 1 else ""
        print(f"  {rank}. {class_names[idx]:<45s} {probabilities[idx]:.4%}{marker}")

    # ------------------------------------------------------------------
    # 11. Potato-specific section
    # ------------------------------------------------------------------
    print()
    print("=" * 60)
    print("POTATO RESULT")
    print("=" * 60)

    if predicted_class in POTATO_CLASSES:
        condition = POTATO_CONDITION_MAP[predicted_class]
        print(f"Crop       : Potato")
        print(f"Condition  : {condition}")
        print(f"Confidence : {confidence:.4%}")
    else:
        print(f"Crop       : Not classified as potato")
        print(f"Top model prediction: {predicted_class}")

    # Show all three potato class probabilities regardless
    print()
    print("Potato class probabilities:")
    for cls in [POTATO_EARLY_BLIGHT, POTATO_LATE_BLIGHT, POTATO_HEALTHY]:
        if cls in class_names:
            idx = class_names.index(cls)
            print(f"  {cls:<35s} {probabilities[idx]:.4%}")


if __name__ == "__main__":
    main()
