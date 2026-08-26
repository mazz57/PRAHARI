"""
Phase 6 — export the trained PyTorch model to ONNX.

Writes models/potato_disease.onnx with:
  * input  name "input",  shape (batch, 3, 224, 224), dynamic batch axis
  * output name "logits", shape (batch, 3) in the CANONICAL class order (config.CLASS_NAMES)
  * opset 17

The class ordering is fixed by how the model was trained (see train.py `_imagefolder_canonical`),
so the ONNX logits are in exactly the order recorded in class_names.json. Run verify_onnx_parity.py
afterwards to confirm ONNX and PyTorch agree.
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import config as C  # noqa: E402
from train import build_model  # noqa: E402


def main() -> int:
    import torch
    if not C.BEST_CHECKPOINT.exists():
        print(f"✗ STOP: checkpoint not found: {C.BEST_CHECKPOINT}. Run train.py first.")
        return 1
    ckpt = torch.load(C.BEST_CHECKPOINT, map_location="cpu")
    if ckpt.get("class_names") != C.CLASS_NAMES:
        print(f"✗ STOP: checkpoint class order {ckpt.get('class_names')} != config {C.CLASS_NAMES}.")
        return 1
    model = build_model()
    model.load_state_dict(ckpt["model_state"])
    model.eval()

    dummy = torch.randn(1, 3, C.IMAGE_SIZE, C.IMAGE_SIZE)
    C.MODELS_DIR.mkdir(parents=True, exist_ok=True)
    torch.onnx.export(
        model, dummy, str(C.ONNX_PATH),
        input_names=["input"], output_names=["logits"],
        dynamic_axes={"input": {0: "batch"}, "logits": {0: "batch"}},
        opset_version=17, do_constant_folding=True,
    )
    size_mb = C.ONNX_PATH.stat().st_size / (1024 * 1024)
    print(f"✓ Exported ONNX -> {C.ONNX_PATH}  ({size_mb:.2f} MB)")

    # optional structural check
    try:
        import onnx
        onnx.checker.check_model(onnx.load(str(C.ONNX_PATH)))
        print("✓ onnx.checker passed")
    except Exception as e:  # noqa: BLE001
        print(f"(onnx.checker skipped/failed: {e})")
    print("  Next: python ml/scripts/verify_onnx_parity.py")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
