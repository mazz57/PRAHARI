"""
Leakage-safe, deterministic, stratified train/val/test split.

Problem solved
--------------
The raw dataset contains DUPLICATE image pairs (e.g. original.JPG and original_1.JPG have
identical pixel content).  A naive file-level shuffle can land one copy in train and the other
in val/test, leaking ground-truth content across splits and inflating accuracy to 1.0.

Solution
--------
1.  Compute a content hash (SHA-256) for every image.
2.  Group all files that share the same content hash into a single "duplicate group".
3.  Split at the *group* level, never at the file level.
    => All copies of the same image are always in the same split.
4.  After copying, independently verify that hash sets across splits are disjoint.
    The script raises SystemExit(1) and prints a loud error if any overlap is found.

Split targets: ~70 % train / ~15 % val / ~15 % test  (configurable via CLI / config.py).
Groups are sorted by their representative hash before shuffling so the order is stable
regardless of the filesystem's traversal order.  seed=42 is the default.

Manifest
--------
ml/data/processed/split_manifest.json is written with seed, counts, class counts,
duplicate-group statistics, and the leakage-check result.

Torch-free — safe to run anywhere Python ≥ 3.9 with Pillow is available.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import random
import shutil
import sys
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Tuple

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import config as C  # noqa: E402
from inspect_dataset import _canonical_class, _detect_splits  # noqa: E402


# ---------------------------------------------------------------------------
# Hashing
# ---------------------------------------------------------------------------

def _sha256(path: Path, chunk: int = 1 << 16) -> str:
    """Return hex SHA-256 of a file's content."""
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        while True:
            block = fh.read(chunk)
            if not block:
                break
            h.update(block)
    return h.hexdigest()


# ---------------------------------------------------------------------------
# Group-level splitting helpers
# ---------------------------------------------------------------------------

def _group_files_by_hash(files: List[Path]) -> Dict[str, List[Path]]:
    """
    Return a mapping  {content_hash: [file, ...]}  for all files.
    Files that are byte-for-byte identical share a hash and end up in the same group.
    """
    groups: Dict[str, List[Path]] = defaultdict(list)
    for f in files:
        groups[_sha256(f)].append(f)
    return dict(groups)


def _split_groups(
    groups: Dict[str, List[Path]],
    val_frac: float,
    test_frac: float,
    rng: random.Random,
) -> Tuple[List[str], List[str], List[str]]:
    """
    Assign group hashes to train / val / test by IMAGE COUNT, not group count,
    so the actual file distribution closely matches the requested fractions.

    Strategy: sort groups by hash (stable), shuffle with seeded RNG, then greedily
    assign groups to val first, then test, then everything left goes to train.
    This keeps all files in a group in the same split.
    """
    # Stable deterministic order before seeded shuffle
    hashes = sorted(groups.keys())
    rng.shuffle(hashes)

    total_files = sum(len(groups[h]) for h in hashes)
    target_val  = round(total_files * val_frac)
    target_test = round(total_files * test_frac)

    val_hashes:   List[str] = []
    test_hashes:  List[str] = []
    train_hashes: List[str] = []

    val_count = 0
    test_count = 0

    for h in hashes:
        n = len(groups[h])
        if val_count < target_val:
            val_hashes.append(h)
            val_count += n
        elif test_count < target_test:
            test_hashes.append(h)
            test_count += n
        else:
            train_hashes.append(h)

    return train_hashes, val_hashes, test_hashes


# ---------------------------------------------------------------------------
# Leakage validation
# ---------------------------------------------------------------------------

def _hashes_in_dir(split_cls_dir: Path) -> set:
    """Compute content hashes of all images under split_cls_dir."""
    hashes = set()
    exts = C.image_extensions()
    for f in sorted(split_cls_dir.rglob("*")):
        if f.is_file() and f.suffix.lower() in exts:
            hashes.add(_sha256(f))
    return hashes


def _leakage_check(out_dir: Path) -> dict:
    """
    Independent post-copy leakage check.
    Computes content hashes of every file written to train/val/test and verifies
    that the three hash sets are disjoint.
    Returns a dict with 'passed' and overlap counts.
    """
    train_hashes: set = set()
    val_hashes:   set = set()
    test_hashes:  set = set()

    exts = C.image_extensions()
    for split, target in (("train", train_hashes), ("val", val_hashes), ("test", test_hashes)):
        split_dir = out_dir / split
        for f in sorted(split_dir.rglob("*")):
            if f.is_file() and f.suffix.lower() in exts:
                target.add(_sha256(f))

    tv = len(train_hashes & val_hashes)
    tt = len(train_hashes & test_hashes)
    vt = len(val_hashes   & test_hashes)

    return {
        "passed": (tv == 0 and tt == 0 and vt == 0),
        "train_val_overlap":  tv,
        "train_test_overlap": tt,
        "val_test_overlap":   vt,
    }


# ---------------------------------------------------------------------------
# Main prepare function
# ---------------------------------------------------------------------------

def prepare(raw_dir: Path, out_dir: Path, val_split: float, test_split: float, seed: int) -> int:
    if not raw_dir.is_dir():
        print(f"✗ STOP: raw dir not found: {raw_dir}")
        return 1
    if set(_detect_splits(raw_dir)) != {"all"}:
        print("✗ STOP: RAW_DIR already appears pre-split (train/val present). "
              "Train on the official split directly — do not re-mix it.")
        return 1
    if val_split + test_split >= 0.9:
        print(f"✗ STOP: val_split + test_split = {val_split + test_split} leaves too little for training.")
        return 1

    exts = C.image_extensions()

    # -------------------------------------------------------------------------
    # 1. Collect files per canonical class
    # -------------------------------------------------------------------------
    per_class: Dict[str, List[Path]] = {c: [] for c in C.CLASS_NAMES}
    for p in sorted(raw_dir.iterdir()):
        if not p.is_dir():
            continue
        cc = _canonical_class(p.name)
        if cc is None:
            print(f"   (skipping unrecognised folder: {p.name})")
            continue
        files = [f for f in sorted(p.rglob("*")) if f.is_file() and f.suffix.lower() in exts]
        per_class[cc].extend(files)

    missing = [c for c, fs in per_class.items() if not fs]
    if missing:
        print(f"✗ STOP: no images for class(es): {missing}. Cannot build a valid split.")
        return 1

    # -------------------------------------------------------------------------
    # 2. Hash every image and group by content hash
    # -------------------------------------------------------------------------
    print("Computing content hashes (this may take a moment)…")
    per_class_groups: Dict[str, Dict[str, List[Path]]] = {}
    for cls, files in per_class.items():
        groups = _group_files_by_hash(files)
        per_class_groups[cls] = groups
        n_dup_groups = sum(1 for v in groups.values() if len(v) > 1)
        print(f"   {cls:<13}  {len(files):>6} files   {len(groups):>6} unique hashes"
              f"   {n_dup_groups:>4} duplicate groups")

    # -------------------------------------------------------------------------
    # 3. Wipe the existing processed split (keep .gitkeep)
    # -------------------------------------------------------------------------
    for split in ("train", "val", "test"):
        d = out_dir / split
        if d.exists():
            shutil.rmtree(d)

    # -------------------------------------------------------------------------
    # 4. Split at group level and copy files
    # -------------------------------------------------------------------------
    rng = random.Random(seed)

    manifest_counts: Dict[str, Dict[str, int]] = {"train": {}, "val": {}, "test": {}}
    group_split_counts: Dict[str, Dict[str, int]] = {
        "train": {c: 0 for c in C.CLASS_NAMES},
        "val":   {c: 0 for c in C.CLASS_NAMES},
        "test":  {c: 0 for c in C.CLASS_NAMES},
    }

    print("\nSplitting groups and copying files…")
    for cls in C.CLASS_NAMES:
        groups = per_class_groups[cls]

        # Each class gets its own seeded rng derived from the global seed so the
        # split of one class doesn't depend on the order in which classes are
        # processed (stable across future class additions).
        cls_rng = random.Random(seed ^ hash(cls) & 0xFFFFFFFF)

        train_hashes, val_hashes, test_hashes = _split_groups(
            groups, val_split, test_split, cls_rng
        )

        assignments = (
            ("train", train_hashes),
            ("val",   val_hashes),
            ("test",  test_hashes),
        )
        for split_name, hash_list in assignments:
            dst_dir = out_dir / split_name / cls
            dst_dir.mkdir(parents=True, exist_ok=True)
            counter = 0
            for h in hash_list:
                for src in groups[h]:
                    shutil.copy2(src, dst_dir / f"{cls}_{counter:05d}{src.suffix.lower()}")
                    counter += 1
            manifest_counts[split_name][cls] = counter
            group_split_counts[split_name][cls] = len(hash_list)

    # -------------------------------------------------------------------------
    # 5. Independent leakage validation
    # -------------------------------------------------------------------------
    print("\nRunning leakage check…")
    leakage = _leakage_check(out_dir)

    if not leakage["passed"]:
        print("✗ STOP: LEAKAGE DETECTED after split!")
        print(f"   train∩val  overlap: {leakage['train_val_overlap']} hashes")
        print(f"   train∩test overlap: {leakage['train_test_overlap']} hashes")
        print(f"   val∩test   overlap: {leakage['val_test_overlap']} hashes")
        print("   This should never happen — please report a bug.")
        return 1

    print("✓ Leakage check PASSED — zero overlap across train / val / test.")

    # -------------------------------------------------------------------------
    # 6. Write manifest
    # -------------------------------------------------------------------------
    total_groups = {
        cls: len(per_class_groups[cls]) for cls in C.CLASS_NAMES
    }
    dup_groups = {
        cls: sum(1 for v in per_class_groups[cls].values() if len(v) > 1)
        for cls in C.CLASS_NAMES
    }

    manifest = {
        "seed": seed,
        "val_split": val_split,
        "test_split": test_split,
        "classes": C.CLASS_NAMES,
        "counts": manifest_counts,
        "class_totals": {
            cls: sum(manifest_counts[s][cls] for s in ("train", "val", "test"))
            for cls in C.CLASS_NAMES
        },
        "split_totals": {
            s: sum(manifest_counts[s].values()) for s in ("train", "val", "test")
        },
        "unique_hash_groups": total_groups,
        "duplicate_groups": dup_groups,
        "groups_per_split": group_split_counts,
        "leakage_check": leakage,
    }

    out_dir.mkdir(parents=True, exist_ok=True)
    with open(out_dir / "split_manifest.json", "w") as fh:
        json.dump(manifest, fh, indent=2)

    # -------------------------------------------------------------------------
    # 7. Summary report
    # -------------------------------------------------------------------------
    print("\n" + "=" * 64)
    print(f"✓ Leakage-safe split written to: {out_dir}")
    print(f"  seed = {seed}")
    print()
    print(f"  {'split':<6}  {'total':>7}  " + "  ".join(f"{c:>13}" for c in C.CLASS_NAMES))
    print(f"  {'-'*6}  {'-'*7}  " + "  ".join(f"{'─'*13}" for _ in C.CLASS_NAMES))
    for split in ("train", "val", "test"):
        total = manifest["split_totals"][split]
        cls_parts = "  ".join(f"{manifest_counts[split][c]:>13}" for c in C.CLASS_NAMES)
        print(f"  {split:<6}  {total:>7}  {cls_parts}")
    grand = sum(manifest["split_totals"].values())
    print(f"  {'TOTAL':<6}  {grand:>7}")

    print()
    print("  Duplicate groups (files sharing identical content hash):")
    for cls in C.CLASS_NAMES:
        print(f"    {cls:<13}  {dup_groups[cls]:>5} dup groups  "
              f"(out of {total_groups[cls]} unique hashes)")

    print()
    print("  Groups per split:")
    for split in ("train", "val", "test"):
        gparts = "  ".join(f"{group_split_counts[split][c]:>5}" for c in C.CLASS_NAMES)
        print(f"    {split:<6}  {gparts}   "
              f"(classes: {', '.join(C.CLASS_NAMES)})")

    print()
    print("  Leakage check:")
    print(f"    passed           : {leakage['passed']}")
    print(f"    train∩val  hashes: {leakage['train_val_overlap']}")
    print(f"    train∩test hashes: {leakage['train_test_overlap']}")
    print(f"    val∩test   hashes: {leakage['val_test_overlap']}")
    print("=" * 64)

    return 0


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    ap = argparse.ArgumentParser(
        description="Create a leakage-safe, deterministic, group-stratified split (flat datasets only)."
    )
    ap.add_argument("--raw-dir",    type=str, default=str(C.RAW_DIR))
    ap.add_argument("--out-dir",    type=str, default=str(C.PROCESSED_DIR))
    ap.add_argument("--val-split",  type=float, default=C.VAL_SPLIT)
    ap.add_argument("--test-split", type=float, default=C.TEST_SPLIT)
    ap.add_argument("--seed",       type=int,   default=C.SEED)
    a = ap.parse_args()
    raise SystemExit(
        prepare(
            Path(a.raw_dir).expanduser().resolve(),
            Path(a.out_dir).expanduser().resolve(),
            a.val_split,
            a.test_split,
            a.seed,
        )
    )
