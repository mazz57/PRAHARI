"""
Independent leakage verification.

Reads every image file from ml/data/processed/{train,val,test} (all classes),
computes its SHA-256 content hash, and checks that the three hash sets are disjoint.

Exit code 0 = no leakage.
Exit code 1 = leakage found or other error.
"""
from __future__ import annotations

import hashlib
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import config as C  # noqa: E402


def sha256(path: Path, chunk: int = 1 << 16) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        while True:
            block = fh.read(chunk)
            if not block:
                break
            h.update(block)
    return h.hexdigest()


def collect_hashes(split_dir: Path) -> set:
    exts = C.image_extensions()
    hashes = set()
    count = 0
    for f in split_dir.rglob("*"):
        if f.is_file() and f.suffix.lower() in exts:
            hashes.add(sha256(f))
            count += 1
    print(f"  {split_dir.name:<6}  {count:>5} files  →  {len(hashes):>5} unique hashes")
    return hashes


def main() -> int:
    processed = C.PROCESSED_DIR
    print(f"Independent leakage verification")
    print(f"Processed dir: {processed}\n")

    if not processed.is_dir():
        print(f"✗ STOP: processed dir does not exist: {processed}")
        return 1

    train_hashes = collect_hashes(processed / "train")
    val_hashes   = collect_hashes(processed / "val")
    test_hashes  = collect_hashes(processed / "test")

    tv = train_hashes & val_hashes
    tt = train_hashes & test_hashes
    vt = val_hashes   & test_hashes

    print()
    print(f"  train∩val  overlap : {len(tv)} hashes")
    print(f"  train∩test overlap : {len(tt)} hashes")
    print(f"  val∩test   overlap : {len(vt)} hashes")
    print()

    if tv or tt or vt:
        print("✗ LEAKAGE DETECTED!")
        if tv:
            print(f"  Sample train∩val  hashes: {list(tv)[:5]}")
        if tt:
            print(f"  Sample train∩test hashes: {list(tt)[:5]}")
        if vt:
            print(f"  Sample val∩test   hashes: {list(vt)[:5]}")
        return 1

    print("✓ PASSED — zero cross-split hash overlap. No leakage.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
