"""
Phase 6 — verify the exported ONNX model agrees with the PyTorch model.

Feeds the SAME preprocessed input (produced by preprocess_reference.py, so it also exercises the
serving-side preprocessing contract) to both the PyTorch model and the ONNX Runtime session, and
checks that:
  * the predicted class (argmax) matches for every sample, and
  * the softmax probabilities agree within a numerical tolerance.

Inputs: up to N images from the test/val split if present; otherwise a deterministic fixture image.
Exits non-zero if they disagree.
"""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import config as C  # noqa: E402
from inspect_dataset import _detect_splits  # noqa: E402
from preprocess_reference import preprocess_path, _deterministic_test_image, preprocess_path_from_pil  # noqa: E402

ATOL = 1e-3


def _sample_inputs(n: int = 8) -> np.ndarray:
    exts = C.image_extensions()
    imgs: list[np.ndarray] = []
    for base in (C.PROCESSED_DIR, C.RAW_DIR):
        splits = _detect_splits(base) if base.is_dir() else {}
        d = splits.get("test") or splits.get("val") or splits.get("all")
        if not d:
            continue
        for p in sorted(d.rglob("*")):
            if p.is_file() and p.suffix.lower() in exts:
                imgs.append(preprocess_path(p))
                if len(imgs) >= n:
                    break
        if imgs:
            break
    if not imgs:
        print("(no dataset images found — using a deterministic fixture image for parity)")
        imgs = [preprocess_path_from_pil(_deterministic_test_image(300))]
    return np.concatenate(imgs, axis=0).astype(np.float32)


def _softmax(x: np.ndarray) -> np.ndarray:
    e = np.exp(x - x.max(axis=1, keepdims=True))
    return e / e.sum(axis=1, keepdims=True)


def main() -> int:
    import torch
    import onnxruntime as ort
    from train import build_model

    if not C.BEST_CHECKPOINT.exists() or not C.ONNX_PATH.exists():
        print(f"✗ STOP: need both {C.BEST_CHECKPOINT.name} and {C.ONNX_PATH.name}. "
              f"Run train.py + export_onnx.py first.")
        return 1

    x = _sample_inputs()
    print(f"parity inputs: {x.shape}")

    ckpt = torch.load(C.BEST_CHECKPOINT, map_location="cpu")
    model = build_model(); model.load_state_dict(ckpt["model_state"]); model.eval()
    with torch.no_grad():
        torch_logits = model(torch.from_numpy(x)).numpy()
    torch_probs = _softmax(torch_logits)

    sess = ort.InferenceSession(str(C.ONNX_PATH), providers=["CPUExecutionProvider"])
    in_name = sess.get_inputs()[0].name
    onnx_logits = sess.run(None, {in_name: x})[0]
    onnx_probs = _softmax(onnx_logits)

    max_diff = float(np.abs(torch_probs - onnx_probs).max())
    torch_cls = torch_probs.argmax(axis=1)
    onnx_cls = onnx_probs.argmax(axis=1)
    classes_match = bool(np.array_equal(torch_cls, onnx_cls))

    print(f"max |Δ softmax| = {max_diff:.6e}  (tolerance {ATOL})")
    print(f"argmax classes match: {classes_match}")
    for i in range(min(len(x), 5)):
        print(f"  sample {i}: torch={C.CLASS_NAMES[torch_cls[i]]}  onnx={C.CLASS_NAMES[onnx_cls[i]]}")

    ok = classes_match and max_diff < ATOL
    print("✓ PyTorch and ONNX agree." if ok else "✗ MISMATCH between PyTorch and ONNX.")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
