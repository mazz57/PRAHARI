"""
Phase 1 — dataset inspection & validation for the potato-leaf classifier.

Reports, for the dataset under RAW_DIR (or --data-dir):
  * images per class (per split when the dataset is pre-split)
  * train / validation / test counts
  * image dimensions (min/median/max, plus how many are exactly 224x224)
  * file formats
  * corrupted / unreadable images
  * missing classes
  * obvious duplicates by content hash (within a split, and — for pre-split data — ACROSS splits,
    which would be train/test leakage)

It STOPS with a non-zero exit code and a loud message if the structure is invalid (a canonical class
is missing, a split is empty, or no images are found). It does not continue silently.

Layout auto-detection:
  * pre-split : RAW_DIR has train/ and (val|valid)/ and optionally test/ sub-dirs, each holding class folders
  * flat      : RAW_DIR holds the class folders directly (no official split)

Class-folder name mapping accepts our canonical names AND the original PlantVillage names, e.g.
  Potato___healthy -> healthy, Potato___Early_blight -> early_blight, Potato___Late_blight -> late_blight
"""
from __future__ import annotations

import argparse
import hashlib
import statistics
import sys
from collections import defaultdict
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import config as C  # noqa: E402


def _canonical_class(folder_name: str) -> str | None:
    """Map a folder name to one of our canonical classes, or None if unrecognised."""
    n = folder_name.strip().lower().replace("potato___", "").replace("potato__", "")
    n = n.replace("potato_", "").replace("-", "_").replace(" ", "_").strip("_")
    aliases = {
        "healthy": "healthy",
        "early_blight": "early_blight",
        "earlyblight": "early_blight",
        "late_blight": "late_blight",
        "lateblight": "late_blight",
    }
    return aliases.get(n)


def _detect_splits(data_dir: Path) -> dict[str, Path]:
    """Return {split_name: dir}. Pre-split -> real splits; flat -> {'all': data_dir}."""
    subdirs = {p.name.lower(): p for p in data_dir.iterdir() if p.is_dir()} if data_dir.is_dir() else {}
    train = subdirs.get("train")
    val = subdirs.get("val") or subdirs.get("valid") or subdirs.get("validation")
    test = subdirs.get("test")
    if train and val:
        splits = {"train": train, "val": val}
        if test:
            splits["test"] = test
        return splits
    return {"all": data_dir}


def _hash_file(path: Path, chunk: int = 1 << 16) -> str:
    h = hashlib.md5()
    with open(path, "rb") as f:
        while True:
            b = f.read(chunk)
            if not b:
                break
            h.update(b)
    return h.hexdigest()


def _scan_class_dir(cls_dir: Path):
    """Return (files, dims, formats, corrupted, hashes) for one class folder."""
    files, dims, formats, corrupted = [], [], defaultdict(int), []
    hashes: dict[str, list[str]] = defaultdict(list)
    exts = C.image_extensions()
    for p in sorted(cls_dir.rglob("*")):
        if not p.is_file() or p.suffix.lower() not in exts:
            continue
        files.append(p)
        try:
            with Image.open(p) as im:
                im.verify()  # cheap corruption check
            with Image.open(p) as im2:
                dims.append(im2.size)  # (w, h)
                formats[(im2.format or p.suffix.lstrip(".")).upper()] += 1
            hashes[_hash_file(p)].append(str(p))
        except Exception as e:  # noqa: BLE001 — we WANT to catch anything unreadable
            corrupted.append((str(p), type(e).__name__))
    return files, dims, formats, corrupted, hashes


def inspect(data_dir: Path) -> int:
    print(f"Inspecting dataset at: {data_dir}")
    if not data_dir.is_dir():
        print(f"\n  ✗ STOP: dataset directory does not exist: {data_dir}")
        print("    Place the PlantVillage potato subset there (see ml/README.md).")
        return 1

    splits = _detect_splits(data_dir)
    layout = "pre-split" if set(splits) != {"all"} else "flat (no official split)"
    print(f"Detected layout: {layout}  (splits: {', '.join(splits)})\n")

    problems: list[str] = []
    grand_total = 0
    split_class_counts: dict[str, dict[str, int]] = {}
    all_dims: list[tuple[int, int]] = []
    all_formats: dict[str, int] = defaultdict(int)
    all_corrupted: list[tuple[str, str]] = []
    # hash -> list of "split/class/path" for cross-split leakage detection
    global_hashes: dict[str, list[str]] = defaultdict(list)

    for split, sdir in splits.items():
        # map present folders -> canonical classes
        present: dict[str, Path] = {}
        for p in sorted(sdir.iterdir()) if sdir.is_dir() else []:
            if p.is_dir():
                cc = _canonical_class(p.name)
                if cc:
                    present[cc] = p
        missing = [c for c in C.CLASS_NAMES if c not in present]
        if missing:
            problems.append(f"split '{split}': missing class folder(s): {missing}")

        counts: dict[str, int] = {}
        print(f"── split: {split} ──")
        for cls in C.CLASS_NAMES:
            if cls not in present:
                print(f"   {cls:<13}  (folder MISSING)")
                counts[cls] = 0
                continue
            files, dims, formats, corrupted, hashes = _scan_class_dir(present[cls])
            counts[cls] = len(files)
            grand_total += len(files)
            all_dims.extend(dims)
            for k, v in formats.items():
                all_formats[k] += v
            all_corrupted.extend(corrupted)
            for hsh, paths in hashes.items():
                for pth in paths:
                    global_hashes[hsh].append(f"{split}/{cls}")
            dup_groups = sum(1 for v in hashes.values() if len(v) > 1)
            print(f"   {cls:<13}  {len(files):>6} images   "
                  f"formats={dict(formats)}  corrupted={len(corrupted)}  dup-groups={dup_groups}")
            if len(files) == 0:
                problems.append(f"split '{split}': class '{cls}' has 0 images")
        split_class_counts[split] = counts
        print(f"   {'TOTAL':<13}  {sum(counts.values()):>6}\n")

    # dimensions summary
    if all_dims:
        ws = sorted(w for w, _ in all_dims)
        hs = sorted(h for _, h in all_dims)
        exact = sum(1 for d in all_dims if d == (C.IMAGE_SIZE, C.IMAGE_SIZE))
        print("Image dimensions (width x height):")
        print(f"   width : min={ws[0]} median={statistics.median(ws):.0f} max={ws[-1]}")
        print(f"   height: min={hs[0]} median={statistics.median(hs):.0f} max={hs[-1]}")
        print(f"   exactly {C.IMAGE_SIZE}x{C.IMAGE_SIZE}: {exact}/{len(all_dims)} "
              f"(all images are resized to {C.IMAGE_SIZE}x{C.IMAGE_SIZE} at train/inference time)\n")
    print(f"File formats overall: {dict(all_formats)}")

    # corruption
    if all_corrupted:
        print(f"\n⚠ {len(all_corrupted)} corrupted/unreadable image(s):")
        for pth, err in all_corrupted[:20]:
            print(f"   {err}: {pth}")
        if len(all_corrupted) > 20:
            print(f"   … and {len(all_corrupted) - 20} more")

    # cross-split leakage (only meaningful when pre-split)
    if set(splits) != {"all"}:
        leaks = {h: locs for h, locs in global_hashes.items() if len({l.split('/')[0] for l in locs}) > 1}
        if leaks:
            problems.append(f"{len(leaks)} identical image(s) appear in MORE THAN ONE split "
                            f"(train/val/test leakage)")
            print(f"\n⚠ potential leakage: {len(leaks)} identical file(s) span multiple splits.")

    # ---- verdict ----
    print("\n" + "=" * 60)
    if grand_total == 0:
        print("✗ STOP: no images found. The dataset structure is invalid.")
        return 1
    if problems:
        print("✗ STOP: dataset structure is INVALID. Fix these before training:")
        for pr in problems:
            print(f"   - {pr}")
        return 1
    print(f"✓ Dataset looks valid: {grand_total} images across classes {C.CLASS_NAMES}.")
    if set(splits) == {"all"}:
        print("  No official split detected — run prepare_split.py to create a "
              "deterministic stratified train/val/test split before training.")
    return 0


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="Phase 1 — inspect & validate the potato dataset.")
    ap.add_argument("--data-dir", type=str, default=str(C.RAW_DIR),
                    help=f"dataset root (default: {C.RAW_DIR})")
    args = ap.parse_args()
    raise SystemExit(inspect(Path(args.data_dir).expanduser().resolve()))
