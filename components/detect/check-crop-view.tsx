'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import {
  Upload,
  ImageIcon,
  ShieldAlert,
  CloudSun,
  Stethoscope,
  X,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Info,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { DiagnosisResult, TopPrediction } from '@/lib/crop-diagnosis'
import { labelText, AGRONOMIC_GUIDANCE } from '@/lib/diagnosis/labels'

/**
 * "Check my crop" — Real potato leaf disease diagnosis UI.
 *
 * Talks directly to POST /api/crop-diagnosis, running the verified
 * PlantVillage MobileNetV3 ONNX classifier.
 */

function conditionColor(condition: string): { bg: string; text: string; border: string; bar: string } {
  switch (condition) {
    case 'healthy':
      return {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-600 dark:text-emerald-400',
        border: 'border-emerald-500/30',
        bar: '#10b981',
      }
    case 'early_blight':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-600 dark:text-amber-400',
        border: 'border-amber-500/30',
        bar: '#f59e0b',
      }
    case 'late_blight':
      return {
        bg: 'bg-rose-500/10',
        text: 'text-rose-600 dark:text-rose-400',
        border: 'border-rose-500/30',
        bar: '#ef4444',
      }
    default:
      return {
        bg: 'bg-yellow-500/10',
        text: 'text-yellow-600 dark:text-yellow-400',
        border: 'border-yellow-500/30',
        bar: '#eab308',
      }
  }
}

function pct(conf: number): string {
  return `${(conf * 100).toFixed(1)}%`
}

export function CheckCropView() {
  const [file, setFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<DiagnosisResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [modelAvailable, setModelAvailable] = useState<boolean | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)

  // Probe model availability on mount
  useEffect(() => {
    let active = true
    fetch('/api/crop-diagnosis')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data && typeof data.available === 'boolean') {
          setModelAvailable(data.available)
        }
      })
      .catch(() => {
        // Non-fatal probe error
      })
    return () => {
      active = false
    }
  }, [])

  function handleFileSelect(selectedFile?: File) {
    if (!selectedFile) return

    // Quick client-side size check (8MB)
    if (selectedFile.size > 8 * 1024 * 1024) {
      setErrorMessage('Image size is too large (maximum 8 MB). Please select a smaller photo.')
      return
    }

    setFile(selectedFile)
    setFileName(selectedFile.name)
    setResult(null)
    setErrorMessage(null)

    const reader = new FileReader()
    reader.onload = () => {
      setPreview(typeof reader.result === 'string' ? reader.result : null)
    }
    reader.readAsDataURL(selectedFile)
  }

  function handleClear() {
    setFile(null)
    setFileName(null)
    setPreview(null)
    setResult(null)
    setErrorMessage(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function handleAnalyze() {
    if (!file) return

    setAnalyzing(true)
    setErrorMessage(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/crop-diagnosis', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        const detail = data?.details || data?.error || 'Inference request failed.'
        setErrorMessage(detail)
        return
      }

      setResult(data as DiagnosisResult)
    } catch {
      setErrorMessage('Could not connect to the crop diagnosis service. Please check your network.')
    } finally {
      setAnalyzing(false)
    }
  }

  const colors = result ? conditionColor(result.condition) : null
  const guidance = result ? (AGRONOMIC_GUIDANCE[result.condition] ?? AGRONOMIC_GUIDANCE.uncertain) : null

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-primary font-medium">
          <Stethoscope className="h-4 w-4" />
          <span>PRAVAAH Crop Diagnosis</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Check Potato Leaf Health
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
          Upload a clear photograph of a potato leaf to inspect for disease symptoms (Healthy, Early Blight, Late Blight) using our validated AI classifier.
        </p>
      </div>

      {/* Model availability notice */}
      {modelAvailable === false && (
        <Alert className="border-amber-500/40 bg-amber-500/5">
          <ShieldAlert className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-600 font-semibold">Model Status</AlertTitle>
          <AlertDescription className="text-sm text-muted-foreground">
            The ONNX model file is currently not ready on the server. Please ensure the model files are present.
          </AlertDescription>
        </Alert>
      )}

      {/* Image Upload Zone */}
      <div className="rounded-2xl border-2 border-dashed border-border bg-card/50 p-6 transition-all hover:border-primary/40">
        {!preview ? (
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0])
            }}
            className="flex cursor-pointer flex-col items-center gap-3 py-10 text-center"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                inputRef.current?.click()
              }
            }}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Upload className="h-8 w-8" />
            </div>
            <div>
              <div className="text-base font-semibold text-foreground">Upload or drag a potato leaf photo</div>
              <div className="text-xs text-muted-foreground mt-1">
                Supports JPEG, PNG, WebP (Max 8 MB) · Single leaf in clear focus
              </div>
            </div>
            <Button type="button" variant="outline" size="sm" className="mt-2">
              Browse Image
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative mx-auto w-fit">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt={fileName ?? 'Uploaded crop leaf'}
                className="max-h-72 w-auto rounded-xl border border-border object-contain shadow-sm"
              />
              <button
                type="button"
                onClick={handleClear}
                disabled={analyzing}
                className="absolute -right-2.5 -top-2.5 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background shadow-md hover:bg-muted transition-colors"
                aria-label="Remove image"
              >
                <X className="h-4 w-4 text-foreground" />
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ImageIcon className="h-3.5 w-3.5" />
              <span className="truncate max-w-xs font-mono">{fileName}</span>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <Button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="min-w-36 bg-primary text-primary-foreground shadow-sm"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing Leaf…
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Diagnose Leaf
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleClear} disabled={analyzing}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Change Photo
              </Button>
            </div>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files?.[0])}
        />
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Diagnosis Error</AlertTitle>
          <AlertDescription className="text-sm">{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Result Card */}
      {result && colors && guidance && (
        <div className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
          {/* Header & Status */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/70 pb-4">
            <div className="flex items-center gap-3">
              {result.condition === 'healthy' ? (
                <CheckCircle2 className="h-7 w-7 text-emerald-500 shrink-0" />
              ) : (
                <AlertTriangle
                  className="h-7 w-7 shrink-0"
                  style={{ color: colors.bar }}
                />
              )}
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold text-foreground">
                    {labelText(result.condition)}
                  </h2>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colors.bg} ${colors.text} ${colors.border}`}
                  >
                    {result.crop === 'potato' ? 'Potato Crop' : 'Unrecognized Crop'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  AI Model: MobileNetV3 (PlantVillage)
                </p>
              </div>
            </div>

            {/* Confidence Badge */}
            <div className="flex flex-col sm:items-end">
              <div className="text-xs text-muted-foreground font-medium">Model Confidence</div>
              <div className="text-xl font-bold text-foreground tabular-nums">
                {pct(result.confidence)}
              </div>
            </div>
          </div>

          {/* Requires Review Warning */}
          {result.requires_review && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                    Review Recommended by Agricultural Expert
                  </div>
                  <div className="text-xs text-amber-700 dark:text-amber-400/90 leading-relaxed">
                    {result.crop !== 'potato'
                      ? 'The image does not clearly match known potato leaf characteristics. Please verify the crop type and re-test with a clear photo.'
                      : 'The model confidence is below the high-certainty threshold (60%). We advise manual field inspection or expert verification.'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Agronomic Next Steps */}
          <div className="rounded-xl bg-muted/40 p-4 space-y-2 border border-border/50">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Info className="h-4 w-4 text-primary" />
              <span>Recommended Next Steps</span>
            </div>
            <p className="text-sm text-foreground/90 font-medium">
              {guidance.action}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {guidance.note}
            </p>
          </div>

          {/* Top Predictions Breakdown */}
          {result.top_predictions && result.top_predictions.length > 0 && (
            <div className="space-y-2.5 pt-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Class Probability Breakdown
              </div>
              <div className="space-y-2">
                {result.top_predictions.map((pred: TopPrediction, idx: number) => {
                  const predPct = pct(pred.confidence)
                  const isTop = idx === 0
                  return (
                    <div key={pred.class} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className={isTop ? 'font-semibold text-foreground' : 'text-muted-foreground'}>
                          {labelText(pred.class)}
                        </span>
                        <span className="tabular-nums font-mono text-muted-foreground">{predPct}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: predPct,
                            backgroundColor: isTop ? colors.bar : 'var(--muted-foreground)',
                            opacity: isTop ? 1 : 0.4,
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Footer Disclaimer */}
          <div className="flex items-start gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
            <Stethoscope className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />
            <span>
              Prahari AI provides assistive screening based on image recognition and does not replace official lab diagnostics. For critical decisions, consult your local Krishi Vigyan Kendra (KVK).
            </span>
          </div>
        </div>
      )}

      {/* Cross-feature Links */}
      <div className="grid gap-4 sm:grid-cols-2 pt-2">
        <Link
          href="/field-risk"
          className="group rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
              <CloudSun className="h-4 w-4 text-primary" />
              <span>Weather-Based Field Risk</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Check microclimate forecast for disease pressure before physical symptoms show on the crop.
          </p>
        </Link>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
            <Stethoscope className="h-4 w-4 text-primary" />
            <span>Local KVK Extension</span>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Connect with certified agronomists at your district Krishi Vigyan Kendra for lab leaf testing.
          </p>
        </div>
      </div>
    </div>
  )
}
