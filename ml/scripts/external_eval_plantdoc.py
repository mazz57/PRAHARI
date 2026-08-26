"""
Phase 5 (optional) — external generalization test on PlantDoc potato images.

PlantDoc is a SEPARATE, real-world (not lab) dataset. This script uses it ONLY as an external test
of how the model generalizes — it is NEVER mixed into training. It runs inference with the exported
ONNX model (so it needs neither torch nor the .pth), using the same preprocessing as the server.

Reliable label mapping is required. PlantDoc's potato folders are typically:
    "Potato leaf early blight"  -> early_blight
    "Potato leaf late blight"   -> late_blight
    "Potato leaf"               -> AMBIGUOUS (not clearly "healthy") -> NOT mapped
If a class cannot be mapped confidently, it is skipped and the reason is reported. If fewer than two
classes can be mapped, the whole phase is skipped (with an explanation) rather than reporting a
misleading number.

Usage:
    python ml/scripts/external_eval_plantdoc.py --plantdoc-dir /path/to/plantdoc
"""
from __future__ import annotations

import argparse
import sys
from collections import defaultdict
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import config as C  # noqa: E402
from preprocess_reference import preprocess_path  # noqa: E402

# Confident aliases only. "Potato leaf" (bare) is intentionally absent — it is not reliably "healthy".
PLANTDOC_ALIASES = {
    "potato leaf early blight": "early_blight",
    "potato_leaf_early_blight": "early_blight",
    "potato leaf late blight": "late_blight",
    "potato_leaf_late_blight": "late_blight",
}


def _map_folder(name: str) -> str | None:
    return PLANTDOC_ALIASES.get(name.strip().lower())


def _softmax(x: np.ndarray) -> np.ndarray:
    e = np.exp(x - x.max(axis=1, keepdims=True))
    return e / e.sum(axis=1, keepdims=True)


def main() -> int:
    ap = argparse.ArgumentParser(description="Phase 5 — optional PlantDoc external generalization test.")
    ap.add_argument("--plantdoc-dir", required=True, help="dir containing PlantDoc potato class folders")
    args = ap.parse_args()
    pd_dir = Path(args.plantdoc_dir).expanduser().resolve()

    if not C.ONNX_PATH.exists():
        print(f"✗ STOP: {C.ONNX_PATH.name} not found. Export the model first (export_onnx.py).")
        return 1
    if not pd_dir.is_dir():
        print(f"✗ STOP: PlantDoc dir not found: {pd_dir}")
        return 1

    # discover + map folders
    mapped: dict[str, Path] = {}
    unmapped: list[str] = []
    for p in sorted(pd_dir.iterdir()):
        if not p.is_dir():
            continue
        cc = _map_folder(p.name)
        if cc:
            mapped[cc] = p
        elif "potato" in p.name.lower():
            unmapped.append(p.name)

    if unmapped:
        print(f"ℹ Skipping unmapped potato folder(s) (label not reliably mappable): {unmapped}")
    if len(mapped) < 2:
        print("↷ SKIPPING Phase 5: fewer than two PlantDoc potato classes could be mapped reliably.")
        print(f"   Mapped: {list(mapped)}. Reporting a number here would be misleading.")
        return 0

    import onnxruntime as ort
    sess = ort.InferenceSession(str(C.ONNX_PATH), providers=["CPUExecutionProvider"])
    in_name = sess.get_inputs()[0].name
    exts = C.image_extensions()

    per_class_total: dict[str, int] = defaultdict(int)
    per_class_correct: dict[str, int] = defaultdict(int)
    n = 0
    for cc, folder in mapped.items():
        true_idx = C.CLASS_NAMES.index(cc)
        for img in sorted(folder.rglob("*")):
            if not img.is_file() or img.suffix.lower() not in exts:
                continue
            try:
                x = preprocess_path(img)
            except Exception:  # noqa: BLE001
                continue
            probs = _softmax(sess.run(None, {in_name: x})[0])[0]
            pred = int(probs.argmax())
            per_class_total[cc] += 1
            per_class_correct[cc] += int(pred == true_idx)
            n += 1

    if n == 0:
        print("↷ SKIPPING Phase 5: no readable PlantDoc images in the mapped folders.")
        return 0

    print(f"\n===== EXTERNAL (PlantDoc) — {n} images, mapped classes {list(mapped)} =====")
    print("(Expect LOWER numbers than the in-distribution test — this is real-world generalization.)")
    total_correct = 0
    for cc in mapped:
        t, c = per_class_total[cc], per_class_correct[cc]
        total_correct += c
        rec = c / t if t else 0.0
        print(f"  {cc:<13} recall = {rec:.4f}  ({c}/{t})")
    print(f"  overall accuracy (mapped classes only) = {total_correct / n:.4f}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
