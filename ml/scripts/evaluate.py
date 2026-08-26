"""
Phase 3 — evaluate the trained classifier and calibrate the uncertainty thresholds.

Reports (printed AND saved to reports/evaluation_report.json + .txt):
  * accuracy
  * macro precision / recall / F1
  * per-class precision / recall / F1
  * confusion matrix (also saved as reports/confusion_matrix.png)
  * late_blight recall, called out explicitly

Then calibrates the uncertainty thresholds on the VALIDATION set and writes models/thresholds.json.

Threshold selection procedure (documented, reproducible):
  * confidence_threshold: sweep t in [0.30, 0.99]; "accept" a prediction when its top-1 softmax prob
    >= t. Pick the SMALLEST t whose precision-on-accepted >= TARGET_PRECISION (default 0.95) while
    keeping coverage (fraction accepted) >= MIN_COVERAGE (default 0.50). If no t satisfies both, fall
    back to the t maximising precision*coverage. This makes "confident" predictions high-precision;
    everything below is returned as status:"uncertain" instead of a forced label.
  * margin_threshold: the 10th percentile of (top1 - top2) among CORRECT validation predictions,
    clamped to [0.05, 0.30]. Requires a clear separation between the top two classes.

Nothing here fabricates numbers — every value comes from running the model you trained.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import config as C  # noqa: E402
from inspect_dataset import _detect_splits  # noqa: E402
from train import _imagefolder_canonical, build_eval_transform, build_model  # noqa: E402

TARGET_PRECISION = float(__import__("os").environ.get("PRAHARI_TARGET_PRECISION", "0.95"))
MIN_COVERAGE = float(__import__("os").environ.get("PRAHARI_MIN_COVERAGE", "0.50"))


def _resolve_eval_dirs() -> tuple[Path, Path | None]:
    """Return (eval_dir, val_dir_for_calibration). Prefer a test split for the headline metrics."""
    proc, raw = C.PROCESSED_DIR, C.RAW_DIR
    val_dir = None
    for base in (proc, raw):
        splits = _detect_splits(base) if base.is_dir() else {}
        if "val" in splits:
            val_dir = splits["val"]
            break
    for base in (proc, raw):
        splits = _detect_splits(base) if base.is_dir() else {}
        if "test" in splits:
            return splits["test"], val_dir
    if val_dir is not None:
        print("(no test split found — evaluating on the validation split)")
        return val_dir, val_dir
    print("✗ STOP: no test/val split found to evaluate on.")
    raise SystemExit(1)


def _infer(model, loader, device):
    import torch
    probs_all, y_true = [], []
    model.eval()
    with torch.no_grad():
        for imgs, labels in loader:
            imgs = imgs.to(device)
            logits = model(imgs)
            probs = torch.softmax(logits, dim=1).cpu().numpy()
            probs_all.append(probs)
            y_true.extend(labels.tolist())
    return np.concatenate(probs_all, axis=0), np.array(y_true)


def _calibrate(val_probs: np.ndarray, val_true: np.ndarray) -> dict:
    top1 = val_probs.max(axis=1)
    pred = val_probs.argmax(axis=1)
    correct = (pred == val_true).astype(np.int32)
    chosen_t, chosen_prec, chosen_cov = None, None, None
    fallback = (C.DEFAULT_CONFIDENCE_THRESHOLD, -1.0)
    best_score = -1.0
    for t in np.round(np.arange(0.30, 0.991, 0.01), 3):
        accept = top1 >= t
        cov = float(accept.mean())
        if accept.sum() == 0:
            continue
        prec = float(correct[accept].mean())
        if prec * cov > best_score:
            best_score, fallback = prec * cov, (float(t), prec)
        if prec >= TARGET_PRECISION and cov >= MIN_COVERAGE and chosen_t is None:
            chosen_t, chosen_prec, chosen_cov = float(t), prec, cov
    if chosen_t is None:
        chosen_t, chosen_prec = fallback
        chosen_cov = float((top1 >= chosen_t).mean())

    # margin threshold from correct predictions' top1-top2 gap
    sorted_probs = np.sort(val_probs, axis=1)
    margin = sorted_probs[:, -1] - sorted_probs[:, -2]
    correct_margins = margin[correct == 1]
    if correct_margins.size:
        margin_t = float(np.clip(np.percentile(correct_margins, 10), 0.05, 0.30))
    else:
        margin_t = C.DEFAULT_MARGIN_THRESHOLD
    return {
        "confidence_threshold": round(chosen_t, 3),
        "margin_threshold": round(margin_t, 3),
        "source": "calibrated on validation set by evaluate.py",
        "calibrated": True,
        "target_precision": TARGET_PRECISION,
        "achieved_precision_on_accepted": round(float(chosen_prec), 4),
        "coverage": round(float(chosen_cov), 4),
    }


def _save_confusion_png(cm: np.ndarray, path: Path) -> None:
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
    except Exception as e:  # noqa: BLE001
        print(f"(skipping confusion PNG — matplotlib unavailable: {e})")
        return
    fig, ax = plt.subplots(figsize=(4.5, 4))
    im = ax.imshow(cm, cmap="Blues")
    ax.set_xticks(range(C.NUM_CLASSES)); ax.set_yticks(range(C.NUM_CLASSES))
    ax.set_xticklabels(C.CLASS_NAMES, rotation=30, ha="right"); ax.set_yticklabels(C.CLASS_NAMES)
    ax.set_xlabel("Predicted"); ax.set_ylabel("True"); ax.set_title("Confusion matrix")
    for i in range(C.NUM_CLASSES):
        for j in range(C.NUM_CLASSES):
            ax.text(j, i, str(cm[i, j]), ha="center", va="center",
                    color="white" if cm[i, j] > cm.max() / 2 else "black")
    fig.colorbar(im, fraction=0.046, pad=0.04); fig.tight_layout()
    fig.savefig(path, dpi=120); plt.close(fig)


def main() -> int:
    import torch
    from torch.utils.data import DataLoader
    from sklearn.metrics import (accuracy_score, precision_recall_fscore_support,
                                  confusion_matrix, classification_report)

    if not C.BEST_CHECKPOINT.exists():
        print(f"✗ STOP: checkpoint not found: {C.BEST_CHECKPOINT}. Run train.py first.")
        return 1
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    ckpt = torch.load(C.BEST_CHECKPOINT, map_location=device)
    if ckpt.get("class_names") != C.CLASS_NAMES:
        print(f"✗ STOP: checkpoint class order {ckpt.get('class_names')} != config {C.CLASS_NAMES}.")
        return 1
    model = build_model().to(device)
    model.load_state_dict(ckpt["model_state"])

    eval_dir, val_dir = _resolve_eval_dirs()
    eval_ds = _imagefolder_canonical(eval_dir, build_eval_transform())
    eval_loader = DataLoader(eval_ds, batch_size=C.BATCH_SIZE, shuffle=False, num_workers=C.NUM_WORKERS)
    print(f"Evaluating on {len(eval_ds)} images from {eval_dir}")

    probs, y_true = _infer(model, eval_loader, device)
    y_pred = probs.argmax(axis=1)

    acc = float(accuracy_score(y_true, y_pred))
    p_mac, r_mac, f_mac, _ = precision_recall_fscore_support(y_true, y_pred, average="macro", zero_division=0)
    p_pc, r_pc, f_pc, sup = precision_recall_fscore_support(
        y_true, y_pred, labels=list(range(C.NUM_CLASSES)), zero_division=0)
    cm = confusion_matrix(y_true, y_pred, labels=list(range(C.NUM_CLASSES)))
    lb = C.CLASS_NAMES.index("late_blight")

    print("\n===== EVALUATION =====")
    print(f"accuracy        : {acc:.4f}")
    print(f"macro precision : {p_mac:.4f}")
    print(f"macro recall    : {r_mac:.4f}")
    print(f"macro F1        : {f_mac:.4f}")
    print("\nper-class:")
    for i, cls in enumerate(C.CLASS_NAMES):
        print(f"  {cls:<13} precision={p_pc[i]:.4f} recall={r_pc[i]:.4f} f1={f_pc[i]:.4f} support={int(sup[i])}")
    print(f"\n>>> late_blight RECALL = {r_pc[lb]:.4f}  (missing late blight is the costly error) <<<")
    print("\nconfusion matrix (rows=true, cols=pred), order =", C.CLASS_NAMES)
    print(cm)
    print("\n" + classification_report(y_true, y_pred, target_names=C.CLASS_NAMES, zero_division=0))

    # calibrate thresholds on validation
    thresholds = None
    if val_dir is not None:
        val_ds = _imagefolder_canonical(val_dir, build_eval_transform())
        val_loader = DataLoader(val_ds, batch_size=C.BATCH_SIZE, shuffle=False, num_workers=C.NUM_WORKERS)
        v_probs, v_true = _infer(model, val_loader, device)
        thresholds = _calibrate(v_probs, v_true)
        with open(C.THRESHOLDS_JSON, "w") as f:
            json.dump(thresholds, f, indent=2)
        print(f"\ncalibrated thresholds -> {C.THRESHOLDS_JSON.name}: {thresholds}")

    C.REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    _save_confusion_png(cm, C.REPORTS_DIR / "confusion_matrix.png")
    report = {
        "eval_dir": str(eval_dir), "n_images": int(len(eval_ds)),
        "accuracy": acc, "macro": {"precision": p_mac, "recall": r_mac, "f1": f_mac},
        "per_class": {cls: {"precision": float(p_pc[i]), "recall": float(r_pc[i]),
                            "f1": float(f_pc[i]), "support": int(sup[i])}
                      for i, cls in enumerate(C.CLASS_NAMES)},
        "late_blight_recall": float(r_pc[lb]),
        "confusion_matrix": cm.tolist(), "class_order": C.CLASS_NAMES,
        "thresholds": thresholds,
    }
    with open(C.REPORTS_DIR / "evaluation_report.json", "w") as f:
        json.dump(report, f, indent=2)
    with open(C.REPORTS_DIR / "evaluation_report.txt", "w") as f:
        f.write(json.dumps(report, indent=2))
    print(f"\n✓ Saved report -> {C.REPORTS_DIR / 'evaluation_report.json'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
