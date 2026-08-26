"""
Canonical preprocessing for the potato-leaf classifier.

This is the SINGLE, authoritative definition of how a raw image becomes the model's input tensor.
It is deliberately torch-free (only Pillow + NumPy) so that:
  * it runs anywhere, including CI without torch, and
  * it is trivial to replicate exactly in the TypeScript server (lib/diagnosis/preprocess.ts).

Contract (must match the TS server byte-for-byte in intent):
  1. decode image, convert to RGB (drop alpha)
  2. resize to 224x224 with BILINEAR resampling
  3. scale pixels to [0, 1]  (divide by 255)
  4. normalise per channel with ImageNet mean/std
  5. layout as float32 NCHW: (1, 3, 224, 224)

train.py and evaluate.py use a torchvision transform that is defined to match this exactly for
val/test/inference (see build_eval_transform in train.py); test_pipeline.py asserts they agree when
torch is present. Training-time augmentation is separate and applies ONLY to the train split.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import config as C  # noqa: E402

_MEAN = np.array(C.IMAGENET_MEAN, dtype=np.float32).reshape(3, 1, 1)
_STD = np.array(C.IMAGENET_STD, dtype=np.float32).reshape(3, 1, 1)


def preprocess_pil(img: Image.Image) -> np.ndarray:
    """PIL image -> normalised CHW float32 array of shape (3, 224, 224)."""
    img = img.convert("RGB").resize((C.IMAGE_SIZE, C.IMAGE_SIZE), Image.BILINEAR)
    arr = np.asarray(img, dtype=np.float32) / 255.0            # HWC in [0,1]
    arr = np.transpose(arr, (2, 0, 1))                         # CHW
    arr = (arr - _MEAN) / _STD                                 # normalise per channel
    return np.ascontiguousarray(arr, dtype=np.float32)


def preprocess_path(path: str | Path) -> np.ndarray:
    """Image path -> batched NCHW float32 array of shape (1, 3, 224, 224)."""
    with Image.open(path) as img:
        chw = preprocess_pil(img)
    return chw[np.newaxis, ...]  # add batch dim


def _deterministic_test_image(size: int = 320) -> Image.Image:
    """A fixed synthetic gradient image — used ONLY as a preprocessing unit-test fixture.
    (Not training data and not a prediction; it just exercises the transform deterministically.)"""
    ys = np.linspace(0, 255, size, dtype=np.float32)[:, None]
    xs = np.linspace(0, 255, size, dtype=np.float32)[None, :]
    r = np.broadcast_to(xs, (size, size))
    g = np.broadcast_to(ys, (size, size))
    b = (xs + ys) / 2.0
    rgb = np.stack([r, g, b], axis=-1).clip(0, 255).astype(np.uint8)
    return Image.fromarray(rgb, "RGB")


def _self_test() -> int:
    t = preprocess_path_from_pil(_deterministic_test_image())
    ok = True
    # shape + dtype
    if t.shape != (1, 3, C.IMAGE_SIZE, C.IMAGE_SIZE):
        print(f"FAIL shape: {t.shape}"); ok = False
    if t.dtype != np.float32:
        print(f"FAIL dtype: {t.dtype}"); ok = False
    # determinism: re-run must be byte-identical
    t2 = preprocess_path_from_pil(_deterministic_test_image())
    if not np.array_equal(t, t2):
        print("FAIL determinism: two runs differ"); ok = False
    # sanity on normalised range (roughly ImageNet-normalised, so ~[-2.7, 2.8])
    print(f"  shape={t.shape} dtype={t.dtype}")
    print(f"  min={t.min():.4f} max={t.max():.4f} mean={t.mean():.4f}")
    for ci, cn in enumerate("RGB"):
        print(f"  channel {cn}: mean={t[0, ci].mean():.4f} std={t[0, ci].std():.4f}")
    if not (-3.0 < t.min() and t.max() < 3.0):
        print("FAIL normalised range looks wrong"); ok = False
    print("OK" if ok else "SELF-TEST FAILED")
    return 0 if ok else 1


def preprocess_path_from_pil(img: Image.Image) -> np.ndarray:
    return preprocess_pil(img)[np.newaxis, ...]


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="Canonical preprocessing (self-test or dump a tensor).")
    ap.add_argument("--image", type=str, default=None, help="image to preprocess; omit to run self-test")
    ap.add_argument("--dump", type=str, default=None, help="optional .npy path to save the tensor")
    args = ap.parse_args()

    if args.image is None:
        raise SystemExit(_self_test())

    tensor = preprocess_path(args.image)
    print(f"preprocessed {args.image} -> {tensor.shape} {tensor.dtype} "
          f"(min={tensor.min():.4f} max={tensor.max():.4f})")
    if args.dump:
        np.save(args.dump, tensor)
        print(f"saved reference tensor -> {args.dump}")
