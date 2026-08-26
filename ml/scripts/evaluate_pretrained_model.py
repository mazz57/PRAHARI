"""
Evaluate the pretrained PlantVillage MobileNet ONNX model against the
existing test set at ml/data/processed/test/.

Usage:
    python ml/scripts/evaluate_pretrained_model.py

Outputs
-------
- Console report with overall and per-class metrics, confusion matrix,
  confidence statistics, and non-potato prediction counts.
- ml/models/plantvillage_mobilenet/evaluation.json  (machine-readable)
"""

import json
import sys
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    precision_recall_fscore_support,
)

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
PROJECT_ROOT = Path(__file__).resolve().parents[2]

MODEL_DIR    = PROJECT_ROOT / "ml" / "models" / "plantvillage_mobilenet"
MODEL_PATH   = MODEL_DIR / "model.onnx"
CLASS_NAMES_PATH = MODEL_DIR / "class_names.json"
EVAL_JSON_PATH   = MODEL_DIR / "evaluation.json"

TEST_ROOT = PROJECT_ROOT / "ml" / "data" / "processed" / "test"

# Map from test-set directory name → exact class name in class_names.json
DIR_TO_CLASS = {
    "healthy":      "Potato___healthy",
    "early_blight": "Potato___Early_blight",
    "late_blight":  "Potato___Late_blight",
}

# ImageNet normalisation
IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
IMAGENET_STD  = np.array([0.229, 0.224, 0.225], dtype=np.float32)

# Confidence thresholds
CONF_LOW1 = 0.60
CONF_LOW2 = 0.80


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def softmax(logits: np.ndarray) -> np.ndarray:
    """Numerically stable softmax over a 1-D array."""
    shifted = logits - np.max(logits)
    exp_vals = np.exp(shifted)
    return exp_vals / exp_vals.sum()


def preprocess(image_path: Path) -> np.ndarray:
    """Standard torchvision val transform: resize-256, center-crop-224, normalise."""
    img = Image.open(image_path).convert("RGB")
    w, h = img.size
    scale = 256 / min(w, h)
    nw, nh = int(round(w * scale)), int(round(h * scale))
    img = img.resize((nw, nh), Image.BILINEAR)
    left, top = (nw - 224) // 2, (nh - 224) // 2
    img = img.crop((left, top, left + 224, top + 224))
    arr = np.array(img, dtype=np.float32) / 255.0
    arr = (arr - IMAGENET_MEAN) / IMAGENET_STD
    arr = np.transpose(arr, (2, 0, 1))          # HWC -> CHW
    return np.expand_dims(arr, axis=0)           # -> NCHW


def collect_images(test_root: Path, dir_to_class: dict) -> list[dict]:
    """Return a list of {path, gt_class} dicts, sorted for reproducibility."""
    records = []
    for dir_name, class_name in sorted(dir_to_class.items()):
        folder = test_root / dir_name
        if not folder.is_dir():
            print(f"ERROR: test folder not found: {folder}", file=sys.stderr)
            sys.exit(1)
        images = sorted(
            p for p in folder.iterdir()
            if p.suffix.lower() in {".jpg", ".jpeg", ".png"}
        )
        for img_path in images:
            records.append({"path": img_path, "gt_class": class_name})
    return records


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    # ------------------------------------------------------------------
    # 1. Sanity-check required files
    # ------------------------------------------------------------------
    for p in (MODEL_PATH, MODEL_DIR / "model.onnx.data", CLASS_NAMES_PATH):
        if not p.exists():
            print(f"ERROR: required file not found: {p}", file=sys.stderr)
            sys.exit(1)

    # ------------------------------------------------------------------
    # 2. Load class names
    # ------------------------------------------------------------------
    with open(CLASS_NAMES_PATH, "r", encoding="utf-8") as f:
        class_names: list[str] = json.load(f)

    if len(class_names) != 15:
        print(f"ERROR: expected 15 class names, got {len(class_names)}", file=sys.stderr)
        sys.exit(1)

    # Build index lookup
    class_to_idx: dict[str, int] = {name: i for i, name in enumerate(class_names)}

    # Verify all expected potato classes are present
    for cls in DIR_TO_CLASS.values():
        if cls not in class_to_idx:
            print(f"ERROR: class '{cls}' not found in class_names.json", file=sys.stderr)
            sys.exit(1)

    # The three potato-class names we care about (ordered for display)
    potato_classes = [
        "Potato___healthy",
        "Potato___Early_blight",
        "Potato___Late_blight",
    ]
    potato_class_set = set(potato_classes)

    # ------------------------------------------------------------------
    # 3. Load ONNX session
    # ------------------------------------------------------------------
    session = ort.InferenceSession(
        str(MODEL_PATH),
        providers=["CPUExecutionProvider"],
    )
    input_name = session.get_inputs()[0].name

    # ------------------------------------------------------------------
    # 4. Collect test images
    # ------------------------------------------------------------------
    records = collect_images(TEST_ROOT, DIR_TO_CLASS)
    total = len(records)

    print(f"Found {total} test images across {len(DIR_TO_CLASS)} classes.")
    for dir_name, cls in sorted(DIR_TO_CLASS.items()):
        n = sum(1 for r in records if r["gt_class"] == cls)
        print(f"  {cls:<35s} : {n} images  (dir: {dir_name}/)")
    print()

    # ------------------------------------------------------------------
    # 5. Run inference on every image
    # ------------------------------------------------------------------
    y_true: list[str] = []
    y_pred: list[str] = []
    confidences: list[float] = []
    non_potato_count = 0

    for i, rec in enumerate(records, start=1):
        if i % 50 == 0 or i == total:
            print(f"  [{i:>4d}/{total}]  processing...", flush=True)

        tensor = preprocess(rec["path"])
        outputs = session.run(None, {input_name: tensor})
        logits = np.asarray(outputs[0])[0]          # [15]

        if logits.shape[0] != 15:
            print(
                f"ERROR: unexpected output size {logits.shape[0]} for {rec['path']}",
                file=sys.stderr,
            )
            sys.exit(1)

        probs = softmax(logits)
        pred_idx = int(np.argmax(probs))
        pred_class = class_names[pred_idx]
        conf = float(probs[pred_idx])

        y_true.append(rec["gt_class"])
        y_pred.append(pred_class)
        confidences.append(conf)

        if pred_class not in potato_class_set:
            non_potato_count += 1

    print()

    # ------------------------------------------------------------------
    # 6. Compute metrics (sklearn uses string labels directly)
    # ------------------------------------------------------------------
    labels = potato_classes          # defines order for per-class metrics
    label_short = ["Healthy", "Early Blight", "Late Blight"]

    accuracy = accuracy_score(y_true, y_pred)
    correct   = sum(1 for t, p in zip(y_true, y_pred) if t == p)
    incorrect = total - correct

    precision_arr, recall_arr, f1_arr, support_arr = precision_recall_fscore_support(
        y_true, y_pred,
        labels=labels,
        zero_division=0,
    )
    macro_precision, macro_recall, macro_f1, _ = precision_recall_fscore_support(
        y_true, y_pred,
        labels=labels,
        average="macro",
        zero_division=0,
    )

    cm = confusion_matrix(y_true, y_pred, labels=labels)

    # Confidence statistics
    confs = np.array(confidences)
    low60_count = int(np.sum(confs < CONF_LOW1))
    low80_count = int(np.sum(confs < CONF_LOW2))
    potato_pred_count = total - non_potato_count

    # ------------------------------------------------------------------
    # 7. Print report
    # ------------------------------------------------------------------
    SEP = "=" * 64

    print(SEP)
    print("EVALUATION RESULTS — PlantVillage MobileNet ONNX")
    print(SEP)
    print(f"Model         : {MODEL_PATH}")
    print(f"Test set      : {TEST_ROOT}")
    print()
    print("OVERALL")
    print("-" * 40)
    print(f"Total images     : {total}")
    print(f"Correct          : {correct}")
    print(f"Incorrect        : {incorrect}")
    print(f"Overall accuracy : {accuracy:.4%}")
    print(f"Macro precision  : {macro_precision:.4%}")
    print(f"Macro recall     : {macro_recall:.4%}")
    print(f"Macro F1         : {macro_f1:.4%}")
    print()

    print("PER-CLASS RESULTS")
    print("-" * 40)
    for i, (short, cls) in enumerate(zip(label_short, labels)):
        print(f"{short}  ({cls})")
        print(f"  Precision : {precision_arr[i]:.4%}")
        print(f"  Recall    : {recall_arr[i]:.4%}")
        print(f"  F1        : {f1_arr[i]:.4%}")
        print(f"  Support   : {int(support_arr[i])}")
        print()

    print("CONFUSION MATRIX")
    print("-" * 40)
    col_w = 14
    header_labels = ["Pred Healthy", "Pred Early", "Pred Late"]
    print(" " * 18 + "".join(f"{h:<{col_w}}" for h in header_labels))
    row_labels = ["Actual Healthy", "Actual Early  ", "Actual Late   "]
    for row_label, row in zip(row_labels, cm):
        counts = "".join(f"{int(v):<{col_w}}" for v in row)
        print(f"{row_label}  {counts}")
    print()

    print("CONFIDENCE STATISTICS")
    print("-" * 40)
    print(f"Mean confidence          : {confs.mean():.4%}")
    print(f"Min  confidence          : {confs.min():.4%}")
    print(f"Max  confidence          : {confs.max():.4%}")
    print(f"Predictions < 60% conf   : {low60_count}  ({low60_count/total:.2%})")
    print(f"Predictions < 80% conf   : {low80_count}  ({low80_count/total:.2%})")
    print()

    print("PREDICTION DISTRIBUTION")
    print("-" * 40)
    print(f"Potato predictions       : {potato_pred_count}  ({potato_pred_count/total:.2%})")
    print(f"Non-potato predictions   : {non_potato_count}  ({non_potato_count/total:.2%})")
    if non_potato_count > 0:
        from collections import Counter
        non_potato_preds = [p for p in y_pred if p not in potato_class_set]
        print("  Non-potato breakdown:")
        for cls, cnt in Counter(non_potato_preds).most_common():
            print(f"    {cls:<45s}: {cnt}")
    print()
    print(SEP)

    # ------------------------------------------------------------------
    # 8. Save evaluation.json
    # ------------------------------------------------------------------
    per_class_metrics = {}
    for i, cls in enumerate(labels):
        per_class_metrics[cls] = {
            "precision": round(float(precision_arr[i]), 6),
            "recall":    round(float(recall_arr[i]), 6),
            "f1":        round(float(f1_arr[i]), 6),
            "support":   int(support_arr[i]),
        }

    eval_data = {
        "model_name": "plantvillage_mobilenet",
        "model_path": str(MODEL_PATH),
        "test_set":   str(TEST_ROOT),
        "test_image_count": total,
        "correct": correct,
        "incorrect": incorrect,
        "accuracy": round(float(accuracy), 6),
        "macro_precision": round(float(macro_precision), 6),
        "macro_recall":    round(float(macro_recall), 6),
        "macro_f1":        round(float(macro_f1), 6),
        "per_class": per_class_metrics,
        "confusion_matrix": {
            "labels": labels,
            "matrix": cm.tolist(),
        },
        "confidence_stats": {
            "mean":       round(float(confs.mean()), 6),
            "min":        round(float(confs.min()), 6),
            "max":        round(float(confs.max()), 6),
            "below_60pct": low60_count,
            "below_80pct": low80_count,
        },
        "prediction_distribution": {
            "potato_predictions":     potato_pred_count,
            "non_potato_predictions": non_potato_count,
        },
    }

    EVAL_JSON_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(EVAL_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(eval_data, f, indent=2)

    print(f"Evaluation results saved → {EVAL_JSON_PATH}")


if __name__ == "__main__":
    main()
