# PRAHARI — Potato Leaf Disease Image Classifier

**Final report — image-classification MVP (potato: healthy / early blight / late blight)**
Scope: this is the SECOND capability, added alongside the existing weather → Hutton + Wallin → SAFE/WATCH/ACT risk engine. The risk engine was **not modified**.

> Honesty note (applies throughout): this report does **not** invent accuracy/precision/recall/F1 numbers.
> Those are produced by `ml/scripts/evaluate.py` on the held-out test split **after** training runs on a
> machine with PyTorch + the dataset (this sandbox has neither). Every number below that requires
> training is explicitly marked **[produced on host]**. Everything marked ✅ was actually run and its
> output observed.

---

## 1. Dataset source
PlantVillage — **potato subset only**: `Potato___healthy`, `Potato___Early_blight`, `Potato___Late_blight`. No other crops or diseases are used. The dataset is **not** committed to Git (`ml/data/**` is git-ignored) and is never bundled into the app.

## 2. Image counts per class
**[produced on host]** — reported by `ml/scripts/inspect_dataset.py`, which prints per-class and per-split counts and **stops** (exit 1) if any class is missing, empty, or if the same image content appears across splits (md5 leakage check). For reference, the public PlantVillage potato set is roughly ~1000 early blight, ~1000 late blight, ~150 healthy (imbalanced — handled via inverse-frequency class weights, see §5).

## 3. Train / val / test split
Two honest paths, decided by the data on disk:
- If the dataset already ships an **official** `train/val/test` layout, it is used as-is.
- Otherwise `ml/scripts/prepare_split.py` performs a **deterministic, seeded, stratified** split (per-class 70/15/15 by default), copies files, and writes `split_manifest.json`. It **refuses** to re-split an already-split dataset. Verified ✅ in-sandbox: same seed → byte-identical manifest; every class present in every split.
No "shuffle everything together" split is ever done.

## 4. Model architecture
**Transfer learning — EfficientNet-B0** (torchvision, `IMAGENET1K_V1` weights). The classifier head is replaced with `Linear(in_features, 3)`. No CNN is trained from scratch. Class order is pinned to the canonical `["healthy","early_blight","late_blight"]` everywhere (see §20, "dict-order hazard").

## 5. Training configuration
Single source of truth in `ml/config.py`: input RGB **224×224**; ImageNet normalization (mean `[0.485,0.456,0.406]`, std `[0.229,0.224,0.225]`); optimizer **AdamW** (lr `3e-4`, weight decay `1e-4`); **25 epochs** max with **early stopping** (patience 5) on validation macro-F1; `ReduceLROnPlateau`; **batch size 32**; deterministic seed **42**; automatic **CPU/GPU** selection; **inverse-frequency class weights** (protects the minority `healthy` class); training augmentation (random resized crop, flips, ±20° rotation, mild color jitter); **val/test use NO augmentation** (deterministic resize only). Best checkpoint saved by val macro-F1. No machine-specific paths are hardcoded (overridable via `PRAHARI_*` env vars).

## 6–9. Accuracy / macro precision / recall / F1
**[produced on host]** by `ml/scripts/evaluate.py` on the held-out **test** split; written to `ml/reports/evaluation_report.txt` + `.json`. The script computes overall accuracy and macro precision/recall/F1, and will not claim quality without actually evaluating.

## 10. Confusion matrix
**[produced on host]** — printed as text and saved as `ml/reports/confusion_matrix.png` (matplotlib, Agg backend).

## 11. Late-blight recall
**[produced on host]** — called out **explicitly** in the evaluation output as its own line, because a missed late blight is the costly error in the field. It also drives threshold calibration (§19-uncertainty).

## 12. External generalization test (PlantDoc)
`ml/scripts/external_eval_plantdoc.py` runs the exported ONNX model over PlantDoc's real-world potato photos **as an external test only — never mixed into training**. It maps only the confidently-labelled folders (`Potato leaf early blight`→early_blight, `Potato leaf late blight`→late_blight); the bare "Potato leaf" folder is treated as ambiguous and skipped. If fewer than two classes map reliably, the whole phase is skipped with a reason rather than reporting a misleading number. **[optional, produced on host if PlantDoc is provided]**.

## 13. Model file size
**[produced on host]** — `export_onnx.py` prints the actual size. Expected ≈ **16–21 MB** for EfficientNet-B0 fp32 ONNX — small enough for hackathon deployment. No quantization is applied (kept simple/honest).

## 14. ONNX export result
`ml/scripts/export_onnx.py` exports to `ml/models/potato_disease.onnx` (opset 17, input `"input"`, output `"logits"`, dynamic batch axis) and runs `onnx.checker`. `ml/scripts/verify_onnx_parity.py` then feeds the **same** preprocessed inputs to PyTorch and ONNX Runtime and asserts argmax agreement + `max|Δsoftmax| < 1e-3`. **[produced on host]** (needs torch + the checkpoint).

## 15. API endpoint
**`POST /api/crop-diagnosis`** (Next.js App Router, `runtime='nodejs'`, `dynamic='force-dynamic'`). Input: `multipart/form-data` with an `image` field. It validates file type (JPEG/PNG/WebP) and size (≤ 8 MB), preprocesses **exactly as training does** (`lib/diagnosis/preprocess.ts` mirrors `preprocess_reference.py`), runs ONNX inference via `onnxruntime-node`, softmaxes the logits, maps them to `class_names.json` order, applies the uncertainty rule, and returns the result. A lightweight **`GET /api/crop-diagnosis`** reports `{ available }` so the UI can set expectations. No FastAPI, no second backend — inference is server-side inside Next.js.

## 16. Example prediction (response shape)
Real confident response (values are the model's actual softmax outputs, never hardcoded):
```json
{
  "status": "ok",
  "crop": "potato",
  "prediction": { "class": "late_blight", "confidence": 0.91 },
  "alternatives": [
    { "class": "early_blight", "confidence": 0.07 },
    { "class": "healthy", "confidence": 0.02 }
  ],
  "model": { "name": "PRAHARI Potato Disease Classifier", "version": "1.0", "calibrated": true }
}
```
Uncertain response (below calibrated confidence OR thin top-1/top-2 margin):
```json
{ "status": "uncertain", "crop": "potato", "prediction": {...}, "alternatives": [...],
  "message": "The image check isn't confident enough to name a single condition ...", "model": {...} }
```
Honest model-absent response (**HTTP 503**, returned today because the trained model isn't on this server):
```json
{ "status": "model_unavailable", "crop": "potato",
  "message": "The potato disease model has not been deployed to this server yet ...",
  "model": { "name": "PRAHARI Potato Disease Classifier", "version": "1.0", "calibrated": false } }
```

## 17. TypeScript result
✅ `npx tsc --noEmit` (whole project, including the new route, the 6 `lib/diagnosis` modules, and all new tests) — **passes, 0 errors**. `onnxruntime-node`/`sharp` are imported via a variable specifier so the type check passes even though `onnxruntime-node` isn't installed in this sandbox; they resolve at runtime on the host after `npm install`.

## 18. Build result
⚠️ `npm run build` (`next build`) — **deferred to the host**. In this Linux sandbox it fails for an environment reason only: the Next SWC native binary isn't installed and can't be downloaded (no network — `getaddrinfo EAI_AGAIN registry.npmjs.org`). This is **not** a code error. The type gate (`tsc --noEmit`) passes. On the host: `npm install` (adds `onnxruntime-node`; `sharp` is already present) then `npm run build`.

## 19. Existing weather-risk regression
✅ **All existing risk-engine tests still pass.** Full `node --test` run = **76 tests, 76 pass, 0 fail** — that's the **53 pre-existing** risk tests (Hutton/Wallin/aggregate/scenarios/engine + Open-Meteo parsing + the 7 `/api/disease-risk` integration tests) **plus 23 new** image-diagnosis tests. `lib/disease-risk/*`, `lib/weather/*`, and `app/api/disease-risk/*` were **not modified** (git confirms they are untouched).

## 20. What is REAL vs MOCKED

**Real (code written, and actually run/verified in-sandbox where the environment allowed):**
- Full training/eval/export pipeline as real, runnable Python (`inspect_dataset`, `prepare_split`, `preprocess_reference`, `train`, `evaluate`, `export_onnx`, `verify_onnx_parity`, `external_eval_plantdoc`). ✅ py_compile clean; ✅ `preprocess_reference.py` self-test run (shape `(1,3,224,224)`, ImageNet range −2.118…2.640, deterministic); ✅ dataset-inspection stop/pass paths exercised; ✅ deterministic stratified split verified; ✅ ML unittest suite `Ran 12, OK (skipped=4)` (4 skip only because torch/ONNX artifacts aren't in the sandbox).
- Real inference API + TS logic: preprocessing parity contract, softmax, index-based class mapping, two-part uncertainty rule, ONNX session handling, honest `model_unavailable`. ✅ 23 new `node --test` tests pass (softmax, uncertainty/margin, combine agreement+disagreement, labels, and route validation + model_unavailable driving the real handler).
- Real UI: upload → analyze → confident / uncertain / model_unavailable / invalid / error states, ranked probabilities, a plain next step, a persistent "does not replace an expert" disclaimer, and a Field-Risk cross-check that reports agreement **and** disagreement honestly.

**Mocked / not-yet-real (honestly):**
- **Nothing is faked.** There is no hardcoded prediction or invented confidence anywhere.
- The **trained weights do not exist yet** — training needs PyTorch + the PlantVillage potato dataset on a real machine (Colab/Kaggle/host). Until `ml/models/potato_disease.onnx` is present, the API returns `model_unavailable` (503) and the UI says so. That is the design, per the project's core rule: *a smaller system that genuinely works beats a larger fake one.*
- All accuracy/precision/recall/F1/confusion-matrix numbers are **[produced on host]** by `evaluate.py`; they are deliberately absent here rather than guessed.

**Dict-order hazard, handled:** `torchvision.ImageFolder` labels alphabetically, so `train.py` **remaps** targets to the canonical order; the checkpoint stores `class_names`; `class_names.json` (committed) is the single authority the ONNX server reads. ONNX logits, JSON, and TS all agree on `["healthy","early_blight","late_blight"]`.

---

## How to finish it on the host (3 steps)
1. **Train + export** (Colab/Kaggle/host with the dataset — see `ml/README.md`):
   `python ml/scripts/inspect_dataset.py` → `prepare_split.py` (if needed) → `train.py` → `evaluate.py` → `export_onnx.py` → `verify_onnx_parity.py`.
   This produces `ml/models/potato_disease.onnx` (+ recalibrated `thresholds.json`).
2. **Install serving deps:** `npm install` (adds `onnxruntime-node`; `sharp` already present), then `npm run build`.
3. The **"Check my crop"** page now returns real predictions; if the model file is ever missing it degrades honestly to `model_unavailable`.

## Uncertainty threshold — how it's chosen
Two-part rule: report a single class only if **top-1 probability ≥ confidence threshold** AND **(top-1 − top-2) ≥ margin threshold**; otherwise `status:"uncertain"`. Defaults (`0.60` / `0.15`, in `config.py`) are used until `evaluate.py` recalibrates on the **validation** set: the confidence threshold is the smallest value giving **precision-on-accepted ≥ 0.95** with **coverage ≥ 0.50**; the margin is the 10th-percentile margin of correct predictions, clamped to `[0.05, 0.30]`. Calibrated values are written to `thresholds.json` (`calibrated:true`) and the API prefers them. (Note: for a proper 3-class distribution, top-1 ≥ 0.60 already forces margin ≥ 0.20, so the margin rule mainly engages after calibration lowers the confidence threshold — verified by the unit tests.)

## Stop point
This report ends the image-classification work. No unrelated feature was started.
