"""
Central, explicit configuration for the PRAHARI potato-leaf disease classifier.

Design rules honoured here:
  * NO machine-specific absolute paths — everything is derived from this file's location
    (the `ml/` directory) and can be overridden with environment variables.
  * The class list and its ORDER are defined in exactly one place. Training, evaluation,
    ONNX export and the Next.js serving code all agree because they all read this order
    (persisted to models/class_names.json). Never rely on dict / os.listdir ordering.
  * Deterministic seed for reproducibility.

Only three classes, as scoped: healthy, early_blight, late_blight. No other crops or diseases.

Environment overrides (all optional):
  PRAHARI_RAW_DIR        -> dataset root that contains the class sub-folders (or split/ sub-dirs)
  PRAHARI_PROCESSED_DIR  -> where prepare_split.py writes train/val/test
  PRAHARI_MODELS_DIR     -> where checkpoints, class_names.json, ONNX are written
  PRAHARI_EPOCHS, PRAHARI_BATCH_SIZE, PRAHARI_LR, PRAHARI_SEED, PRAHARI_PATIENCE
  PRAHARI_VAL_SPLIT, PRAHARI_TEST_SPLIT  (only used by prepare_split.py when no official split exists)
"""
from __future__ import annotations

import os
from pathlib import Path

# ----------------------------------------------------------------------------- paths
# This file lives at <project>/ml/config.py -> ML_DIR is its parent.
ML_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = ML_DIR.parent  # the Next.js old_prj root


def _env_path(var: str, default: Path) -> Path:
    v = os.environ.get(var)
    return Path(v).expanduser().resolve() if v else default


# Dataset root. Expected to contain the three class folders directly, OR pre-split
# sub-dirs (train/ val/ test/) each containing the three class folders. inspect_dataset.py
# auto-detects which layout is present.
RAW_DIR = _env_path("PRAHARI_RAW_DIR", ML_DIR / "data" / "raw")
PROCESSED_DIR = _env_path("PRAHARI_PROCESSED_DIR", ML_DIR / "data" / "processed")
MODELS_DIR = _env_path("PRAHARI_MODELS_DIR", ML_DIR / "models")
REPORTS_DIR = _env_path("PRAHARI_REPORTS_DIR", ML_DIR / "reports")

# ----------------------------------------------------------------------------- classes
# CANONICAL ORDER. The trained model's output logits are in exactly this order.
CLASS_NAMES: list[str] = ["healthy", "early_blight", "late_blight"]
NUM_CLASSES = len(CLASS_NAMES)

# Human-friendly labels (used only for reports; the API localizes its own labels).
CLASS_DISPLAY = {
    "healthy": "Healthy",
    "early_blight": "Early blight",
    "late_blight": "Late blight",
}

# ----------------------------------------------------------------------------- image / preprocessing
IMAGE_SIZE = 224  # EfficientNet-B0 default input
# ImageNet statistics — EfficientNet-B0 was pre-trained on ImageNet, so we normalise the same way.
IMAGENET_MEAN = (0.485, 0.456, 0.406)
IMAGENET_STD = (0.229, 0.224, 0.225)

# ----------------------------------------------------------------------------- training
SEED = int(os.environ.get("PRAHARI_SEED", "42"))
EPOCHS = int(os.environ.get("PRAHARI_EPOCHS", "25"))
BATCH_SIZE = int(os.environ.get("PRAHARI_BATCH_SIZE", "32"))
LEARNING_RATE = float(os.environ.get("PRAHARI_LR", "3e-4"))
WEIGHT_DECAY = float(os.environ.get("PRAHARI_WEIGHT_DECAY", "1e-4"))
EARLY_STOP_PATIENCE = int(os.environ.get("PRAHARI_PATIENCE", "5"))  # epochs w/o val-macro-F1 gain
NUM_WORKERS = int(os.environ.get("PRAHARI_NUM_WORKERS", "2"))

# Split fractions — ONLY used by prepare_split.py, and ONLY when the dataset ships no
# official split. Stratified + seeded so it is reproducible, never a careless random mix.
VAL_SPLIT = float(os.environ.get("PRAHARI_VAL_SPLIT", "0.15"))
TEST_SPLIT = float(os.environ.get("PRAHARI_TEST_SPLIT", "0.15"))

# ----------------------------------------------------------------------------- artifacts
BEST_CHECKPOINT = MODELS_DIR / "potato_disease_best.pth"
CLASS_NAMES_JSON = MODELS_DIR / "class_names.json"
THRESHOLDS_JSON = MODELS_DIR / "thresholds.json"
ONNX_PATH = MODELS_DIR / "potato_disease.onnx"

# ----------------------------------------------------------------------------- uncertainty (defaults)
# Documented DEFAULT thresholds. evaluate.py recalibrates these from the validation set and
# overwrites thresholds.json; until then these conservative defaults apply. See README.
DEFAULT_CONFIDENCE_THRESHOLD = 0.60  # top-1 softmax prob must clear this
DEFAULT_MARGIN_THRESHOLD = 0.15      # (top1 - top2) must clear this


def image_extensions() -> set[str]:
    return {".jpg", ".jpeg", ".png"}


if __name__ == "__main__":
    # Print the resolved config so a user can sanity-check paths on their machine.
    print("PRAHARI potato classifier — resolved config")
    print(f"  PROJECT_ROOT   = {PROJECT_ROOT}")
    print(f"  RAW_DIR        = {RAW_DIR}")
    print(f"  PROCESSED_DIR  = {PROCESSED_DIR}")
    print(f"  MODELS_DIR     = {MODELS_DIR}")
    print(f"  CLASS_NAMES    = {CLASS_NAMES}")
    print(f"  IMAGE_SIZE     = {IMAGE_SIZE}")
    print(f"  SEED           = {SEED}")
    print(f"  EPOCHS         = {EPOCHS}  BATCH_SIZE = {BATCH_SIZE}  LR = {LEARNING_RATE}")
