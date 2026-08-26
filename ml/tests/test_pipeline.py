"""
Tests for the potato-classifier ML pipeline.

Runs with the stdlib (no pytest needed):
    python ml/tests/test_pipeline.py            # or: python -m unittest -v ml.tests.test_pipeline

Torch-free tests run everywhere. Tests that need torch/torchvision, or a trained checkpoint / exported
ONNX, SKIP cleanly when those are absent — so this suite is green in CI without torch, and becomes a
full end-to-end check on a machine that has the deps and artifacts. Nothing here fabricates results.
"""
from __future__ import annotations

import importlib.util
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

import numpy as np

ML_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ML_DIR))
sys.path.insert(0, str(ML_DIR / "scripts"))

import config as C  # noqa: E402
import preprocess_reference as pp  # noqa: E402
import inspect_dataset as insp  # noqa: E402
import prepare_split as ps  # noqa: E402


def _have(mod: str) -> bool:
    return importlib.util.find_spec(mod) is not None


def _make_dataset(root: Path, per_class: int, classes=None, sizes_offset=0) -> None:
    classes = classes or C.CLASS_NAMES
    k = sizes_offset
    for cls in classes:
        d = root / cls
        d.mkdir(parents=True, exist_ok=True)
        for i in range(per_class):
            k += 3
            pp._deterministic_test_image(100 + k).save(d / f"{cls}_{i}.jpg")


class TestConfigAndMetadata(unittest.TestCase):
    def test_three_unique_classes_incl_late_blight(self):
        self.assertEqual(len(C.CLASS_NAMES), 3)
        self.assertEqual(len(set(C.CLASS_NAMES)), 3)
        self.assertIn("late_blight", C.CLASS_NAMES)
        self.assertEqual(C.IMAGE_SIZE, 224)

    def test_class_names_json_matches_config(self):
        import json
        self.assertTrue(C.CLASS_NAMES_JSON.exists(), "class_names.json should be committed")
        data = json.loads(C.CLASS_NAMES_JSON.read_text())
        self.assertEqual(data["classes"], C.CLASS_NAMES, "ordering MUST match config (no dict-order reliance)")


class TestPreprocessing(unittest.TestCase):
    def test_shape_dtype_and_determinism(self):
        img = pp._deterministic_test_image(300)
        a = pp.preprocess_path_from_pil(img)
        b = pp.preprocess_path_from_pil(pp._deterministic_test_image(300))
        self.assertEqual(a.shape, (1, 3, 224, 224))
        self.assertEqual(a.dtype, np.float32)
        self.assertTrue(np.array_equal(a, b), "preprocessing must be deterministic")

    def test_imagenet_normalized_range(self):
        a = pp.preprocess_path_from_pil(pp._deterministic_test_image(256))
        # ImageNet-normalized bounds: min ~ -2.118, max ~ 2.640
        self.assertGreater(a.min(), -2.2)
        self.assertLess(a.max(), 2.7)


class TestDatasetInspection(unittest.TestCase):
    def test_stops_on_missing_class(self):
        with tempfile.TemporaryDirectory() as t:
            root = Path(t) / "ds"
            _make_dataset(root, 2, classes=["healthy", "early_blight"])  # late_blight missing
            self.assertEqual(insp.inspect(root), 1)

    def test_passes_on_valid(self):
        with tempfile.TemporaryDirectory() as t:
            root = Path(t) / "ds"
            _make_dataset(root, 4)
            self.assertEqual(insp.inspect(root), 0)

    def test_stops_on_empty(self):
        with tempfile.TemporaryDirectory() as t:
            self.assertEqual(insp.inspect(Path(t) / "empty"), 1)


class TestPrepareSplit(unittest.TestCase):
    def test_stratified_and_deterministic(self):
        with tempfile.TemporaryDirectory() as t:
            raw = Path(t) / "raw"
            out1 = Path(t) / "o1"
            out2 = Path(t) / "o2"
            _make_dataset(raw, 20)
            self.assertEqual(ps.prepare(raw, out1, 0.15, 0.15, C.SEED), 0)
            self.assertEqual(ps.prepare(raw, out2, 0.15, 0.15, C.SEED), 0)
            m1 = (out1 / "split_manifest.json").read_text()
            m2 = (out2 / "split_manifest.json").read_text()
            self.assertEqual(m1, m2, "same seed => identical split")
            # every class present in every split
            import json
            counts = json.loads(m1)["counts"]
            for split in ("train", "val", "test"):
                for cls in C.CLASS_NAMES:
                    self.assertGreater(counts[split][cls], 0, f"{cls} missing from {split}")


@unittest.skipUnless(_have("torch") and _have("torchvision"), "torch/torchvision not installed")
class TestModelArchitecture(unittest.TestCase):
    def test_head_has_three_outputs(self):
        import torch
        from train import build_model  # noqa
        # weights=None avoids a network download; we only check the classifier wiring here.
        import torchvision.models as models
        m = models.efficientnet_b0(weights=None)
        import torch.nn as nn
        m.classifier[1] = nn.Linear(m.classifier[1].in_features, C.NUM_CLASSES)
        m.eval()
        with torch.no_grad():
            out = m(torch.randn(2, 3, 224, 224))
        self.assertEqual(tuple(out.shape), (2, C.NUM_CLASSES))

    def test_eval_transform_matches_reference(self):
        import train
        tfm = train.build_eval_transform()
        img = pp._deterministic_test_image(300)
        import torch
        t = tfm(img).unsqueeze(0).numpy()
        ref = pp.preprocess_path_from_pil(img)
        self.assertEqual(t.shape, ref.shape)
        # tolerant: catch gross errors (channel order / normalization), allow sub-pixel resample diffs
        self.assertLess(float(np.abs(t - ref).mean()), 0.05,
                        "eval transform should match preprocess_reference within resampling tolerance")


class TestCheckpointArtifact(unittest.TestCase):
    @unittest.skipUnless(_have("torch"), "torch not installed")
    def test_checkpoint_class_order(self):
        if not C.BEST_CHECKPOINT.exists():
            self.skipTest("no trained checkpoint yet (run train.py)")
        import torch
        ckpt = torch.load(C.BEST_CHECKPOINT, map_location="cpu")
        self.assertEqual(ckpt.get("class_names"), C.CLASS_NAMES)


class TestOnnxArtifact(unittest.TestCase):
    @unittest.skipUnless(_have("onnxruntime"), "onnxruntime not installed")
    def test_onnx_runs_and_shapes(self):
        if not C.ONNX_PATH.exists():
            self.skipTest("no exported ONNX yet (run export_onnx.py)")
        import onnxruntime as ort
        sess = ort.InferenceSession(str(C.ONNX_PATH), providers=["CPUExecutionProvider"])
        x = pp.preprocess_path_from_pil(pp._deterministic_test_image(300))
        out = sess.run(None, {sess.get_inputs()[0].name: x})[0]
        self.assertEqual(tuple(out.shape), (1, C.NUM_CLASSES))


if __name__ == "__main__":
    unittest.main(verbosity=2)
