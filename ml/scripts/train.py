"""
Phase 2 — train the potato-leaf classifier with transfer learning (EfficientNet-B0).

NOT trained from scratch: we start from ImageNet-pretrained EfficientNet-B0 and fine-tune it for our
three classes. Highlights:
  * RGB, 224x224
  * training augmentation on the train split ONLY; val/test use the deterministic eval transform
    that MATCHES ml/scripts/preprocess_reference.py (and therefore the TS server)
  * automatic CPU/GPU selection
  * deterministic seeds where practical
  * class-weighted loss (helps recall on any under-represented class, e.g. late_blight)
  * best-model checkpointing by validation macro-F1
  * early stopping

Data source resolution (first that exists wins):
  1. PROCESSED_DIR with train/ + val/           (created by prepare_split.py)
  2. RAW_DIR pre-split with train/ + val|valid/  (official split)
Otherwise it stops and tells you to run prepare_split.py.

Writes:
  models/potato_disease_best.pth   (state_dict + metadata)
  models/class_names.json          (canonical class order)
  reports/training_history.json
"""
from __future__ import annotations

import json
import random
import sys
import time
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import config as C  # noqa: E402
from inspect_dataset import _canonical_class, _detect_splits  # noqa: E402

# Torch imports are deferred to run-time inside main() so that non-training tools (and CI without
# torch) can import this module for its transform builders without requiring torch.


def set_seed(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    import torch
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)
        # cuDNN determinism flags are only meaningful when CUDA is present.
        torch.backends.cudnn.benchmark = False
        torch.backends.cudnn.deterministic = True


def build_eval_transform():
    """Deterministic eval/inference transform. MUST match preprocess_reference.py:
    resize to 224x224 (bilinear) -> [0,1] -> ImageNet normalize -> CHW float32."""
    from torchvision import transforms
    return transforms.Compose([
        transforms.Resize((C.IMAGE_SIZE, C.IMAGE_SIZE),
                           interpolation=transforms.InterpolationMode.BILINEAR),
        transforms.ToTensor(),
        transforms.Normalize(mean=C.IMAGENET_MEAN, std=C.IMAGENET_STD),
    ])


def build_train_transform():
    """Augmentation for the TRAIN split only."""
    from torchvision import transforms
    return transforms.Compose([
        transforms.RandomResizedCrop(C.IMAGE_SIZE, scale=(0.7, 1.0),
                                     interpolation=transforms.InterpolationMode.BILINEAR),
        transforms.RandomHorizontalFlip(),
        transforms.RandomVerticalFlip(),
        transforms.RandomRotation(20),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, hue=0.02),
        transforms.ToTensor(),
        transforms.Normalize(mean=C.IMAGENET_MEAN, std=C.IMAGENET_STD),
    ])


def _resolve_data_dirs() -> tuple[Path, Path]:
    """Return (train_dir, val_dir) or stop with guidance."""
    proc = C.PROCESSED_DIR
    if (proc / "train").is_dir() and (proc / "val").is_dir():
        return proc / "train", proc / "val"
    raw_splits = _detect_splits(C.RAW_DIR)
    if "train" in raw_splits and "val" in raw_splits:
        return raw_splits["train"], raw_splits["val"]
    print("✗ STOP: no train/val split found.")
    print(f"   Looked in {proc} and {C.RAW_DIR}.")
    print("   Run: python ml/scripts/prepare_split.py   (for a flat dataset)")
    raise SystemExit(1)


def _imagefolder_canonical(directory: Path, transform):
    """ImageFolder whose targets are remapped to CANONICAL class indices (config.CLASS_NAMES order),
    regardless of the folder names / alphabetical ordering ImageFolder would otherwise use."""
    from torchvision import datasets
    ds = datasets.ImageFolder(str(directory), transform=transform)
    canon_idx = {c: i for i, c in enumerate(C.CLASS_NAMES)}
    remap = {}
    for folder_idx, folder_name in enumerate(ds.classes):
        cc = _canonical_class(folder_name)
        if cc is None:
            raise SystemExit(f"✗ STOP: folder '{folder_name}' in {directory} is not a known class.")
        remap[folder_idx] = canon_idx[cc]
    ds.samples = [(p, remap[t]) for (p, t) in ds.samples]
    ds.targets = [remap[t] for t in ds.targets]
    ds.classes = list(C.CLASS_NAMES)
    ds.class_to_idx = dict(canon_idx)
    return ds


def _class_weights(targets: list[int]):
    import torch
    counts = np.bincount(np.array(targets), minlength=C.NUM_CLASSES).astype(np.float64)
    counts[counts == 0] = 1.0
    w = counts.sum() / (C.NUM_CLASSES * counts)   # inverse-frequency
    return torch.tensor(w, dtype=torch.float32)


def build_model():
    import torch.nn as nn
    from torchvision import models
    try:
        weights = models.EfficientNet_B0_Weights.IMAGENET1K_V1
    except AttributeError:  # very old torchvision
        weights = "IMAGENET1K_V1"
    model = models.efficientnet_b0(weights=weights)
    in_f = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(in_f, C.NUM_CLASSES)
    return model


def main() -> int:
    import torch
    from torch.utils.data import DataLoader
    import torch.nn as nn
    from sklearn.metrics import f1_score

    set_seed(C.SEED)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device: {device}  |  seed={C.SEED}  epochs={C.EPOCHS}  batch={C.BATCH_SIZE}  lr={C.LEARNING_RATE}")

    train_dir, val_dir = _resolve_data_dirs()
    print("[DEBUG] building datasets")
    train_ds = _imagefolder_canonical(train_dir, build_train_transform())
    val_ds = _imagefolder_canonical(val_dir, build_eval_transform())
    print(f"Train images: {len(train_ds)}  |  Val images: {len(val_ds)}  |  classes: {C.CLASS_NAMES}")

    print("[DEBUG] building dataloaders (num_workers=0)")
    g = torch.Generator(); g.manual_seed(C.SEED)
    train_loader = DataLoader(train_ds, batch_size=C.BATCH_SIZE, shuffle=True,
                              num_workers=0, generator=g, pin_memory=False)
    val_loader = DataLoader(val_ds, batch_size=C.BATCH_SIZE, shuffle=False,
                            num_workers=0, pin_memory=False)

    print("[DEBUG] loading first training batch")
    _dbg_batch = next(iter(train_loader))
    print(f"[DEBUG] first training batch loaded — shape={_dbg_batch[0].shape}")
    del _dbg_batch

    print("[DEBUG] building model")
    model = build_model().to(device)
    print("[DEBUG] model built")
    criterion = nn.CrossEntropyLoss(weight=_class_weights(train_ds.targets).to(device))
    optimizer = torch.optim.AdamW(model.parameters(), lr=C.LEARNING_RATE, weight_decay=C.WEIGHT_DECAY)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode="max", factor=0.5, patience=2)

    C.MODELS_DIR.mkdir(parents=True, exist_ok=True)
    C.REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    best_f1, best_epoch, epochs_no_improve = -1.0, -1, 0
    history = []

    for epoch in range(1, C.EPOCHS + 1):
        t0 = time.time()
        model.train()
        run_loss = 0.0
        for imgs, labels in train_loader:
            imgs, labels = imgs.to(device), labels.to(device)
            optimizer.zero_grad()
            print("[DEBUG] starting forward pass")
            loss = criterion(model(imgs), labels)
            print("[DEBUG] forward pass complete")
            print("[DEBUG] starting backward pass")
            loss.backward()
            print("[DEBUG] backward pass complete")
            optimizer.step()
            run_loss += loss.item() * imgs.size(0)
        train_loss = run_loss / max(1, len(train_ds))

        # validation
        model.eval()
        y_true, y_pred = [], []
        val_loss = 0.0
        with torch.no_grad():
            for imgs, labels in val_loader:
                imgs, labels = imgs.to(device), labels.to(device)
                out = model(imgs)
                val_loss += criterion(out, labels).item() * imgs.size(0)
                y_pred.extend(out.argmax(1).cpu().tolist())
                y_true.extend(labels.cpu().tolist())
        val_loss /= max(1, len(val_ds))
        val_macro_f1 = float(f1_score(y_true, y_pred, average="macro", zero_division=0))
        val_acc = float(np.mean(np.array(y_true) == np.array(y_pred))) if y_true else 0.0
        scheduler.step(val_macro_f1)
        dt = time.time() - t0
        print(f"epoch {epoch:>2}/{C.EPOCHS}  train_loss={train_loss:.4f}  val_loss={val_loss:.4f}  "
              f"val_acc={val_acc:.4f}  val_macroF1={val_macro_f1:.4f}  ({dt:.1f}s)")
        history.append({"epoch": epoch, "train_loss": train_loss, "val_loss": val_loss,
                        "val_acc": val_acc, "val_macro_f1": val_macro_f1})

        if val_macro_f1 > best_f1:
            best_f1, best_epoch, epochs_no_improve = val_macro_f1, epoch, 0
            torch.save({
                "model_state": model.state_dict(),
                "arch": "efficientnet_b0",
                "class_names": C.CLASS_NAMES,
                "image_size": C.IMAGE_SIZE,
                "normalize": {"mean": list(C.IMAGENET_MEAN), "std": list(C.IMAGENET_STD)},
                "val_macro_f1": best_f1, "epoch": epoch,
            }, C.BEST_CHECKPOINT)
            print(f"   ↳ new best (macroF1={best_f1:.4f}) saved to {C.BEST_CHECKPOINT.name}")
        else:
            epochs_no_improve += 1
            if epochs_no_improve >= C.EARLY_STOP_PATIENCE:
                print(f"Early stopping at epoch {epoch} (no val macro-F1 gain for "
                      f"{C.EARLY_STOP_PATIENCE} epochs).")
                break

    # persist canonical class order + history
    with open(C.CLASS_NAMES_JSON, "w") as f:
        json.dump({"classes": C.CLASS_NAMES, "num_classes": C.NUM_CLASSES,
                   "image_size": C.IMAGE_SIZE,
                   "normalize": {"mean": list(C.IMAGENET_MEAN), "std": list(C.IMAGENET_STD)}}, f, indent=2)
    with open(C.REPORTS_DIR / "training_history.json", "w") as f:
        json.dump({"best_epoch": best_epoch, "best_val_macro_f1": best_f1, "history": history}, f, indent=2)

    if best_epoch < 0:
        print("✗ Training produced no checkpoint (did any epochs run?).")
        return 1
    print(f"\n✓ Done. Best val macro-F1={best_f1:.4f} @ epoch {best_epoch}. "
          f"Checkpoint: {C.BEST_CHECKPOINT}")
    print("  Next: python ml/scripts/evaluate.py")
    return 0


if __name__ == "__main__":
    import argparse

    ap = argparse.ArgumentParser(
        description="Train the potato-leaf EfficientNet-B0 classifier."
    )
    ap.add_argument(
        "--epochs",
        type=int,
        default=C.EPOCHS,
        help=f"number of training epochs (default: {C.EPOCHS})",
    )
    ap.add_argument(
        "--batch-size",
        type=int,
        default=C.BATCH_SIZE,
        help=f"mini-batch size (default: {C.BATCH_SIZE})",
    )
    ap.add_argument(
        "--patience",
        type=int,
        default=C.EARLY_STOP_PATIENCE,
        help=f"early-stopping patience in epochs (default: {C.EARLY_STOP_PATIENCE})",
    )
    args = ap.parse_args()

    # Override module-level config values so main() picks them up without
    # any changes to the training logic or model architecture.
    C.EPOCHS = args.epochs
    C.BATCH_SIZE = args.batch_size
    C.EARLY_STOP_PATIENCE = args.patience

    raise SystemExit(main())
