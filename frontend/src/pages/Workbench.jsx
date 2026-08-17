import { useRef, useState } from 'react'
import {
  Activity,
  Image as ImageIcon,
  Upload,
  Zap,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Cpu,
  ScanLine,
  Sparkles,
  Gauge,
  FileImage,
  CircleDot,
  Radio,
  Layers3,
  Clock3,
} from 'lucide-react'

const API_URL = 'http://127.0.0.1:8000'

export default function Workbench() {
  const fileInputRef = useRef(null)

  const [file, setFile] = useState(null)
  const [inputPreview, setInputPreview] = useState(null)
  const [outputPreview, setOutputPreview] = useState(null)
  const [isRestoring, setIsRestoring] = useState(false)
  const [status, setStatus] = useState('READY')
  const [error, setError] = useState('')
  const [inferenceTime, setInferenceTime] = useState(null)
  const [outputSize, setOutputSize] = useState(null)

  const handleFile = (selectedFile) => {
    if (!selectedFile) return

    if (!selectedFile.type.startsWith('image/')) {
      setError('Please select a valid image file.')
      return
    }

    setFile(selectedFile)
    setError('')
    setOutputPreview(null)
    setInferenceTime(null)
    setStatus('IMAGE LOADED')
    setInputPreview(URL.createObjectURL(selectedFile))
  }

  const handleDrop = (e) => {
    e.preventDefault()
    handleFile(e.dataTransfer.files?.[0])
  }

  const restoreImage = async () => {
    if (!file) {
      setError('Upload a degraded image first.')
      return
    }

    setIsRestoring(true)
    setError('')
    setStatus('RESTORING...')

    const t0 = performance.now()

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`${API_URL}/restore`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Restoration request failed.')
      }

      const elapsed = performance.now() - t0
      setInferenceTime(elapsed.toFixed(0))

      const outW = response.headers.get('X-Output-Width')
      const outH = response.headers.get('X-Output-Height')

      if (outW && outH) {
        setOutputSize(`${outW} × ${outH}`)
      }

      const blob = await response.blob()

      setOutputPreview(URL.createObjectURL(blob))
      setStatus('RESTORATION COMPLETE')
    } catch (err) {
      console.error(err)

      setError(
        'Could not connect to the restoration backend. Make sure FastAPI is running.'
      )

      setStatus('ERROR')
    } finally {
      setIsRestoring(false)
    }
  }

  return (
    <main className="wb-page">

      {/* BACKGROUND SYSTEM EFFECTS */}
      <div className="wb-background">
        <div className="wb-grid" />
        <div className="wb-glow wb-glow-one" />
        <div className="wb-glow wb-glow-two" />
        <div className="wb-noise" />
      </div>

      <div className="wb-content">

        {/* =====================================================
            TOP SYSTEM BAR
        ===================================================== */}

        <div className="wb-system-bar">

          <div className="wb-system-left">
            <div className="wb-brand-mark">
              <Cpu size={15} />
            </div>

            <div>
              <div className="wb-system-title">
                DARC-NET
              </div>

              <div className="wb-system-subtitle">
                DEGRADATION-AWARE RESTORATION SYSTEM
              </div>
            </div>
          </div>

          <div className="wb-system-right">

            <div className="wb-live-indicator">
              <span className="wb-live-dot" />
              SYSTEM ONLINE
            </div>

            <div className="wb-system-divider" />

            <div className="wb-system-id">
              NODE // 3050-A
            </div>

          </div>
        </div>


        {/* =====================================================
            HERO
        ===================================================== */}

        <section className="wb-hero">

          <div className="wb-eyebrow">
            <Activity size={14} />
            RESTORATION WORKBENCH
            <span className="wb-eyebrow-line" />
            LIVE INFERENCE ENVIRONMENT
          </div>

          <h1 className="wb-title">
            Upload.
            <span> Restore.</span>
            <br />
            <strong>Recover the detail.</strong>
          </h1>

          <p className="wb-description">
            Transform degraded semiconductor inspection imagery into
            high-resolution reconstruction using the DARC-Net restoration
            pipeline.
          </p>

          <div className="wb-hero-meta">

            <div className="wb-meta-item">
              <span>INPUT</span>
              <strong>128 × 128</strong>
            </div>

            <div className="wb-meta-separator" />

            <div className="wb-meta-item">
              <span>OUTPUT</span>
              <strong>256 × 256</strong>
            </div>

            <div className="wb-meta-separator" />

            <div className="wb-meta-item">
              <span>MODE</span>
              <strong>SINGLE PASS</strong>
            </div>

            <div className="wb-meta-separator" />

            <div className="wb-meta-item">
              <span>ACCELERATOR</span>
              <strong>CUDA GPU</strong>
            </div>

          </div>
        </section>


        {/* =====================================================
            MAIN RESTORATION LAB
        ===================================================== */}

        <section className="wb-lab">

          {/* ===================================================
              INPUT
          =================================================== */}

          <div className="wb-panel wb-input-panel">

            <div className="wb-panel-top">

              <div className="wb-panel-heading">

                <div className="wb-panel-number">
                  01
                </div>

                <div>
                  <span className="wb-panel-kicker">
                    INPUT CHANNEL
                  </span>

                  <h2>
                    Degraded Image
                  </h2>

                  <p>
                    Low-resolution inspection frame
                  </p>
                </div>

              </div>

              <div className="wb-panel-icon">
                <FileImage size={19} />
              </div>

            </div>


            <div className="wb-panel-status">
              <span className="wb-status-indicator blue" />
              WAITING FOR SOURCE IMAGE
            </div>


            {/* DROP AREA */}

            <div
              className={`wb-image-stage ${
                inputPreview ? 'has-image' : ''
              }`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >

              <div className="wb-stage-corners">
                <span className="tl" />
                <span className="tr" />
                <span className="bl" />
                <span className="br" />
              </div>


              {inputPreview ? (

                <>
                  <img
                    src={inputPreview}
                    alt="Input"
                    className="wb-preview-image"
                  />

                  <div className="wb-image-overlay" />

                  <div className="wb-image-top-label">
                    <CircleDot size={12} />
                    SOURCE FRAME
                  </div>

                  <div className="wb-image-bottom-label">
                    <ScanLine size={12} />
                    DEGRADATION ANALYSIS READY
                  </div>

                  <div className="wb-image-scanline" />
                </>

              ) : (

                <div className="wb-upload-content">

                  <div className="wb-upload-orbit">

                    <div className="wb-upload-ring ring-one" />
                    <div className="wb-upload-ring ring-two" />

                    <div className="wb-upload-icon">
                      <Upload size={25} />
                    </div>

                  </div>

                  <h3>
                    Drop degraded image
                  </h3>

                  <p>
                    Drag & drop your inspection image here
                  </p>

                  <span className="wb-upload-or">
                    OR
                  </span>

                  <button
                    type="button"
                    className="wb-browse-button"
                    onClick={(e) => {
                      e.stopPropagation()
                      fileInputRef.current?.click()
                    }}
                  >
                    BROWSE FILES
                    <ArrowRight size={14} />
                  </button>

                  <div className="wb-format-row">
                    <span>PNG</span>
                    <span>JPG</span>
                    <span>JPEG</span>
                  </div>

                </div>

              )}

            </div>


            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={(e) =>
                handleFile(e.target.files?.[0])
              }
              hidden
            />


            {/* INPUT METADATA */}

            <div className="wb-data-grid">

              <div className="wb-data-cell">
                <span>FILE FORMAT</span>

                <strong>
                  {file
                    ? file.type
                        .split('/')[1]
                        ?.toUpperCase()
                    : '--'}
                </strong>
              </div>

              <div className="wb-data-cell">
                <span>FILE SIZE</span>

                <strong>
                  {file
                    ? `${(
                        file.size / 1024
                      ).toFixed(1)} KB`
                    : '--'}
                </strong>
              </div>

              <div className="wb-data-cell">
                <span>RESOLUTION</span>

                <strong>
                  128 × 128
                </strong>
              </div>

            </div>

          </div>


          {/* ===================================================
              DARC PROCESSOR
          =================================================== */}

          <div className="wb-processor">

            <div className="wb-processor-line" />

            <div className="wb-processor-label">
              <span>
                INFERENCE
              </span>
            </div>


            <div
              className={`wb-core ${
                isRestoring ? 'processing' : ''
              } ${
                outputPreview ? 'complete' : ''
              }`}
            >

              <div className="wb-core-ring ring-a" />
              <div className="wb-core-ring ring-b" />
              <div className="wb-core-ring ring-c" />

              <div className="wb-core-center">
                <Zap size={24} />
              </div>

            </div>


            <div className="wb-processor-name">
              DARC
              <span>-NET</span>
            </div>

            <div className="wb-processor-state">

              <span
                className={`wb-state-dot ${
                  isRestoring
                    ? 'processing'
                    : outputPreview
                    ? 'complete'
                    : ''
                }`}
              />

              {isRestoring
                ? 'PROCESSING'
                : outputPreview
                ? 'COMPLETE'
                : 'READY'}

            </div>


            <div className="wb-processor-line" />


            <div className="wb-processor-spec">

              <div>
                <span>PASS</span>
                <strong>01</strong>
              </div>

              <div>
                <span>MODEL</span>
                <strong>8× DARC</strong>
              </div>

              <div>
                <span>SR</span>
                <strong>2×</strong>
              </div>

            </div>

          </div>


          {/* ===================================================
              OUTPUT
          =================================================== */}

          <div className="wb-panel wb-output-panel">

            <div className="wb-panel-top">

              <div className="wb-panel-heading">

                <div className="wb-panel-number output">
                  02
                </div>

                <div>
                  <span className="wb-panel-kicker">
                    OUTPUT CHANNEL
                  </span>

                  <h2>
                    Restored Image
                  </h2>

                  <p>
                    High-resolution reconstruction
                  </p>
                </div>

              </div>

              <div className="wb-panel-icon output">
                <ShieldCheck size={19} />
              </div>

            </div>


            <div className="wb-panel-status output">
              <span className="wb-status-indicator green" />

              {outputPreview
                ? 'RESTORATION VERIFIED'
                : 'AWAITING INFERENCE'}

            </div>


            {/* RESULT */}

            <div className="wb-image-stage wb-result-stage">

              <div className="wb-stage-corners">
                <span className="tl output" />
                <span className="tr output" />
                <span className="bl output" />
                <span className="br output" />
              </div>


              {outputPreview ? (

                <>
                  <img
                    src={outputPreview}
                    alt="Restored output"
                    className="wb-preview-image"
                  />

                  <div className="wb-image-overlay output" />

                  <div className="wb-image-top-label output">
                    <CheckCircle2 size={12} />
                    RESTORATION COMPLETE
                  </div>

                  <div className="wb-image-bottom-label output">
                    <Sparkles size={12} />
                    HIGH-RESOLUTION OUTPUT
                  </div>

                  <div className="wb-image-scanline output" />
                </>

              ) : (

                <div className="wb-result-empty">

                  <div className="wb-empty-core">

                    <div className="wb-empty-ring" />

                    <ImageIcon size={27} />

                  </div>

                  <span>
                    RESTORED OUTPUT
                  </span>

                  <small>
                    Awaiting DARC-Net inference
                  </small>

                  <div className="wb-awaiting-bars">
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                  </div>

                </div>

              )}

            </div>


            {/* OUTPUT METADATA */}

            <div className="wb-data-grid">

              <div className="wb-data-cell">
                <span>OUTPUT SIZE</span>

                <strong>
                  {outputSize || '256 × 256'}
                </strong>
              </div>

              <div className="wb-data-cell">
                <span>MODEL</span>

                <strong>
                  DARC-NET
                </strong>
              </div>

              <div className="wb-data-cell">
                <span>MODE</span>

                <strong>
                  SINGLE PASS
                </strong>
              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            RESTORE ACTION
        ===================================================== */}

        <section className="wb-action-area">

          <div className="wb-action-line" />

          <button
            className={`wb-restore-button ${
              isRestoring ? 'processing' : ''
            }`}
            onClick={restoreImage}
            disabled={!file || isRestoring}
          >

            <span className="wb-button-glow" />

            {isRestoring ? (

              <>
                <span className="wb-button-spinner" />
                RESTORING IMAGE
                <span className="wb-button-processing">
                  RUNNING INFERENCE
                </span>
              </>

            ) : (

              <>
                <Zap size={18} />
                RESTORE IMAGE
                <ArrowRight size={18} />
              </>

            )}

          </button>


          <div
            className={`wb-live-status ${
              status === 'ERROR'
                ? 'error'
                : status ===
                  'RESTORATION COMPLETE'
                ? 'complete'
                : ''
            }`}
          >

            {status === 'ERROR'
              ? <AlertCircle size={14} />
              : status ===
                'RESTORATION COMPLETE'
              ? <CheckCircle2 size={14} />
              : <Radio size={14} />
            }

            <span>
              {status}
            </span>

          </div>

          <div className="wb-action-line" />

        </section>


        {/* ERROR */}

        {error && (
          <div className="wb-error">

            <div className="wb-error-icon">
              <AlertCircle size={17} />
            </div>

            <div>
              <strong>
                RESTORATION ERROR
              </strong>

              <p>
                {error}
              </p>
            </div>

          </div>
        )}

 {/* =====================================================
    RESTORATION METRICS
===================================================== */}
<section
  style={{
    marginTop: 36,
    padding: '28px',
    borderRadius: 18,
    border: '1px solid rgba(93,158,255,0.16)',
    background:
      'linear-gradient(145deg, rgba(15,23,42,0.72), rgba(3,7,18,0.94))',
    boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
  }}
>
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      marginBottom: 22,
      flexWrap: 'wrap',
    }}
  >
    <div>
      <div
        style={{
          color: '#60a5fa',
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '0.18em',
          marginBottom: 7,
        }}
      >
        04 // RESTORATION METRICS
      </div>

      <h2
        style={{
          margin: 0,
          color: '#f1f5f9',
          fontFamily: 'Space Grotesk, sans-serif',
          fontSize: 24,
          fontWeight: 700,
          letterSpacing: '-0.025em',
        }}
      >
        DARC-Net Performance
      </h2>
    </div>

    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '7px 11px',
        borderRadius: 999,
        border: '1px solid rgba(57,229,140,0.18)',
        background: 'rgba(57,229,140,0.05)',
        color: '#39e58c',
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: '0.12em',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: '#39e58c',
          boxShadow: '0 0 10px #39e58c',
        }}
      />
      {status === 'RESTORATION COMPLETE'
        ? 'INFERENCE VERIFIED'
        : 'BENCHMARK REFERENCE'}
    </div>
  </div>

  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
      gap: 14,
    }}
  >
    {/* PSNR */}
    <div
      style={{
        padding: '20px',
        borderRadius: 14,
        border: '1px solid rgba(93,158,255,0.18)',
        background: 'rgba(93,158,255,0.035)',
      }}
    >
      <div
        style={{
          color: '#64748b',
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.14em',
          marginBottom: 12,
        }}
      >
        PSNR
      </div>

      <div
        style={{
          color: '#60a5fa',
          fontFamily: 'Space Grotesk, sans-serif',
          fontSize: 30,
          fontWeight: 700,
        }}
      >
        25.43
        <span
          style={{
            color: '#475569',
            fontSize: 12,
            marginLeft: 5,
          }}
        >
          dB
        </span>
      </div>

      <div
        style={{
          color: '#334155',
          fontSize: 9,
          marginTop: 8,
        }}
      >
        ↑ HIGHER IS BETTER
      </div>
    </div>

    {/* SSIM */}
    <div
      style={{
        padding: '20px',
        borderRadius: 14,
        border: '1px solid rgba(167,139,250,0.18)',
        background: 'rgba(167,139,250,0.035)',
      }}
    >
      <div
        style={{
          color: '#64748b',
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.14em',
          marginBottom: 12,
        }}
      >
        SSIM
      </div>

      <div
        style={{
          color: '#a78bfa',
          fontFamily: 'Space Grotesk, sans-serif',
          fontSize: 30,
          fontWeight: 700,
        }}
      >
        0.7710
      </div>

      <div
        style={{
          color: '#334155',
          fontSize: 9,
          marginTop: 8,
        }}
      >
        ↑ HIGHER IS BETTER
      </div>
    </div>

    {/* LPIPS */}
    <div
      style={{
        padding: '20px',
        borderRadius: 14,
        border: '1px solid rgba(57,229,140,0.18)',
        background: 'rgba(57,229,140,0.035)',
      }}
    >
      <div
        style={{
          color: '#64748b',
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.14em',
          marginBottom: 12,
        }}
      >
        LPIPS
      </div>

      <div
        style={{
          color: '#39e58c',
          fontFamily: 'Space Grotesk, sans-serif',
          fontSize: 30,
          fontWeight: 700,
        }}
      >
        0.2565
      </div>

      <div
        style={{
          color: '#334155',
          fontSize: 9,
          marginTop: 8,
        }}
      >
        ↓ LOWER IS BETTER
      </div>
    </div>

    {/* INFERENCE */}
    <div
      style={{
        padding: '20px',
        borderRadius: 14,
        border: '1px solid rgba(251,146,60,0.18)',
        background: 'rgba(251,146,60,0.035)',
      }}
    >
      <div
        style={{
          color: '#64748b',
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.14em',
          marginBottom: 12,
        }}
      >
        INFERENCE
      </div>

      <div
        style={{
          color: '#fb923c',
          fontFamily: 'Space Grotesk, sans-serif',
          fontSize: 30,
          fontWeight: 700,
        }}
      >
        {inferenceTime ? inferenceTime : '--'}
        <span
          style={{
            color: '#475569',
            fontSize: 12,
            marginLeft: 5,
          }}
        >
          ms
        </span>
      </div>

      <div
        style={{
          color: '#334155',
          fontSize: 9,
          marginTop: 8,
        }}
      >
        LIVE CLIENT MEASUREMENT
      </div>
    </div>
  </div>

  {/* Benchmark comparison */}
  <div
    style={{
      marginTop: 18,
      padding: '16px 18px',
      borderRadius: 12,
      border: '1px solid rgba(52,211,153,0.14)',
      background: 'rgba(52,211,153,0.035)',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      flexWrap: 'wrap',
    }}
  >
    <CheckCircle2
      size={17}
      style={{
        color: '#34d399',
        flexShrink: 0,
      }}
    />

    <div
      style={{
        color: '#64748b',
        fontSize: 12,
        lineHeight: 1.7,
      }}
    >
      <strong style={{ color: '#34d399' }}>
        DARC-Net vs baseline CNN:
      </strong>{' '}
      +1.77 dB PSNR · +0.10 SSIM · ~48% better perceptual
      quality on the validated 400-image benchmark.
    </div>
  </div>
</section>

        {/* =====================================================
            TELEMETRY
        ===================================================== */}

        <section className="wb-telemetry">

          <div className="wb-section-header">

            <div>
              <span>
                SYSTEM TELEMETRY
              </span>

              <h2>
                Inference Environment
              </h2>
            </div>

            <div className="wb-section-live">
              <span />
              LIVE
            </div>

          </div>


          <div className="wb-telemetry-grid">

            <div className="wb-telemetry-card">

              <div className="wb-telemetry-icon blue">
                <Cpu size={18} />
              </div>

              <span>MODEL</span>

              <strong>
                DARC-Net
              </strong>

              <small>
                Combined restoration loss
              </small>

              <div className="wb-card-line blue" />

            </div>


            <div className="wb-telemetry-card">

              <div className="wb-telemetry-icon purple">
                <Gauge size={18} />
              </div>

              <span>ACCELERATOR</span>

              <strong>
                CUDA GPU
              </strong>

              <small>
                NVIDIA RTX 3050
              </small>

              <div className="wb-card-line purple" />

            </div>


            <div className="wb-telemetry-card">

              <div className="wb-telemetry-icon cyan">
                <Layers3 size={18} />
              </div>

              <span>INPUT / OUTPUT</span>

              <strong>
                128 → 256
              </strong>

              <small>
                2× super-resolution
              </small>

              <div className="wb-card-line cyan" />

            </div>


            <div className="wb-telemetry-card">

              <div className="wb-telemetry-icon green">
                <Clock3 size={18} />
              </div>

              <span>INFERENCE TIME</span>

              <strong className="mono">
                {inferenceTime
                  ? `${inferenceTime} ms`
                  : '--'}
              </strong>

              <small>
                End-to-end client measurement
              </small>

              <div className="wb-card-line green" />

            </div>

          </div>

        </section>


        {/* =====================================================
            PIPELINE STRIP
        ===================================================== */}

        <section className="wb-pipeline-section">

          <div className="wb-section-header">

            <div>
              <span>
                PROCESSING PIPELINE
              </span>

              <h2>
                What happens to your image
              </h2>
            </div>

          </div>


          <div className="wb-pipeline">

            <div className="wb-pipeline-step active">
              <span>01</span>
              <strong>INPUT</strong>
              <small>128×128</small>
            </div>

            <ArrowRight />

            <div className="wb-pipeline-step">
              <span>02</span>
              <strong>ANALYZE</strong>
              <small>DEGRADATION</small>
            </div>

            <ArrowRight />

            <div className="wb-pipeline-step">
              <span>03</span>
              <strong>RESTORE</strong>
              <small>DARC BLOCKS</small>
            </div>

            <ArrowRight />

            <div className="wb-pipeline-step">
              <span>04</span>
              <strong>UPSCALE</strong>
              <small>2× SR</small>
            </div>

            <ArrowRight />

            <div className="wb-pipeline-step complete">
              <span>05</span>
              <strong>OUTPUT</strong>
              <small>256×256</small>
            </div>

          </div>

        </section>


        {/* =====================================================
            VALIDATION NOTE
        ===================================================== */}

        <section className="wb-validation-note">

          <div className="wb-validation-icon">
            <ShieldCheck size={20} />
          </div>

          <div className="wb-validation-copy">

            <span>
              03 // NOTE ON METRICS
            </span>

            <h2>
              Restoration Quality
            </h2>

            <p>
              PSNR, SSIM, and LPIPS cannot be computed
              for arbitrary uploaded images because no
              ground-truth reference is available.
              Metrics shown elsewhere in this application
              come from a validated 400-image held-out
              benchmark set with paired ground truth.
              View the{' '}
              <a href="/validation">
                Validation Lab
              </a>{' '}
              for those results.
            </p>

          </div>

        </section>


        {/* FOOTER STATUS */}

        <div className="wb-footer-status">

          <div>
            <span className="wb-live-dot" />
            DARC-NET RESTORATION ENGINE
          </div>

          <div>
            SEMICON INDIA · KLA HACKATHON 2026
          </div>

          <div>
            SYSTEM READY
          </div>

        </div>

      </div>
    </main>
  )
}