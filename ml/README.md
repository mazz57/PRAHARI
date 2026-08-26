# PRAHARI — Potato Leaf Disease Classifier (ML pipeline)

A small, honest, transfer-learning image classifier for **potato leaves**, with exactly three
classes: `healthy`, `early_blight`, `late_blight`. It complements (does **not** replace) the
weather-based Field-Risk engine already in this app.

> **Why this lives outside Git for data/weights:** the dataset is large and license-bound, and
> model weights are large binaries. `ml/data/**`, `*.pth` and `*.onnx` are git-ignored. Only the
> tiny, deterministic `class_names.json` and `thresholds.json` are tracked, because the Next.js
> app reads them at runtime.

---

## 0. Where things go

```
ml/
  config.py              # single source of truth (paths, classes, hyperparams, seed)
  requirements.txt
  data/
    raw/                 # <- put the dataset here (git-ignored)
    processed/           # <- prepare_split.py writes train/ val/ test/ here (git-ignored)
  models/
    potato_disease_best.pth   # written by train.py        (git-ignored)
    class_names.json          # written by train.py        (tracked)
    thresholds.json           # written by evaluate.py      (tracked)
    potato_disease.onnx       # written by export_onnx.py  (git-ignored)
  scripts/
    inspect_dataset.py   # Phase 1 — validates structure, STOPS if invalid
    prepare_split.py     # deterministic stratified split (only if no official split)
    train.py             # Phase 2 — EfficientNet-B0 transfer learning
    evaluate.py          # Phase 3 — metrics + confusion matrix + threshold calibration
    export_onnx.py       # Phase 6 — PyTorch -> ONNX
    verify_onnx_parity.py# Phase 6 — PyTorch vs ONNX agreement
    external_eval_plantdoc.py  # Phase 5 — optional generalization test (never trains)
    preprocess_reference.py    # canonical preprocessing (shared contract w/ the TS server)
  tests/
    test_pipeline.py     # torch-free tests run anywhere; torch/model tests skip if absent
  reports/               # evaluation report + confusion matrix image (created on run)
```

---

## 1. Get the dataset (PlantVillage potato subset)

The **PlantVillage** dataset contains a potato subset with the three classes we need
(`Potato___healthy`, `Potato___Early_blight`, `Potato___Late_blight`). Obtain it legally, e.g.
from Kaggle ("PlantVillage" / "Plant Village" datasets) or the original release. Place the images
so that `ml/data/raw/` contains **either**:

* **Flat layout** (no official split) — three class folders:
  ```
  ml/data/raw/healthy/*.jpg
  ml/data/raw/early_blight/*.jpg
  ml/data/raw/late_blight/*.jpg
  ```
  (Folder names may also be the original `Potato___healthy` etc. — `inspect_dataset.py` maps the
  common PlantVillage names to our canonical class names.)

* **Pre-split layout** (use it as-is, do not re-mix):
  ```
  ml/data/raw/train/<class>/...
  ml/data/raw/val/<class>/...     (or valid/)
  ml/data/raw/test/<class>/...
  ```

Do **not** commit these files. Do **not** blend other crops/diseases in.

---

## 2. Run the pipeline

```bash
# from the old_prj/ root, with the venv activated and deps installed
python ml/config.py                       # sanity-check resolved paths

python ml/scripts/inspect_dataset.py      # Phase 1 — STOPS loudly if structure is invalid

# Only if inspect_dataset.py reports "flat layout, no official split":
python ml/scripts/prepare_split.py        # deterministic stratified split -> data/processed/

python ml/scripts/train.py                # Phase 2 — writes models/potato_disease_best.pth + class_names.json
python ml/scripts/evaluate.py             # Phase 3 — metrics + confusion matrix + thresholds.json + reports/
python ml/scripts/export_onnx.py          # Phase 6 — writes models/potato_disease.onnx
python ml/scripts/verify_onnx_parity.py   # Phase 6 — PyTorch vs ONNX must agree

# optional:
python ml/scripts/external_eval_plantdoc.py --plantdoc-dir /path/to/plantdoc   # Phase 5
```

All scripts read `ml/config.py`. Override anything via environment variables, e.g.
`PRAHARI_EPOCHS=10 PRAHARI_BATCH_SIZE=16 python ml/scripts/train.py`.

### Kaggle / Google Colab (recommended — free GPU, dataset one click away)

```python
# In a Colab/Kaggle cell, after cloning this repo and attaching the PlantVillage dataset:
%pip install -r old_prj/ml/requirements.txt
import os
os.environ["PRAHARI_RAW_DIR"] = "/kaggle/input/plantvillage/.../PlantVillage"  # point at the potato classes
!python old_prj/ml/scripts/inspect_dataset.py
!python old_prj/ml/scripts/prepare_split.py     # if needed
!python old_prj/ml/scripts/train.py
!python old_prj/ml/scripts/evaluate.py
!python old_prj/ml/scripts/export_onnx.py && python old_prj/ml/scripts/verify_onnx_parity.py
# then download models/potato_disease.onnx + class_names.json + thresholds.json back into old_prj/ml/models/
```

---

## 3. Serve it in the app

Once `ml/models/potato_disease.onnx`, `class_names.json` and `thresholds.json` exist, install the
serving deps and run the app **on your host** (the API uses `onnxruntime-node` + `sharp`, which are
native and are installed per-platform):

```bash
npm install                # picks up onnxruntime-node + sharp added to package.json
npm run build
npm start
```

`POST /api/crop-diagnosis` (multipart `image=<file>`) will then return real predictions. **Until the
ONNX file is present, the endpoint honestly returns `status: "model_unavailable"` — it never
fabricates a diagnosis.**

---

## 4. Uncertainty threshold

The API refuses to force a low-confidence image into a confident disease label. A prediction is
returned as `status:"uncertain"` when the top-1 probability is below the confidence threshold **or**
the top-1/top-2 margin is too small. Defaults live in `ml/config.py`
(`DEFAULT_CONFIDENCE_THRESHOLD = 0.60`, `DEFAULT_MARGIN_THRESHOLD = 0.15`). `evaluate.py` recalibrates
them from the **validation** set (choosing the confidence cut-off that keeps accepted predictions
high-precision) and writes the chosen values to `ml/models/thresholds.json`, which the API prefers
when present. See `evaluate.py` for the exact selection procedure.
