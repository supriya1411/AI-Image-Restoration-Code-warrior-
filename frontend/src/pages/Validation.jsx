import { useEffect, useState } from 'react'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Cpu,
  Database,
  ScanLine,
  Terminal,
  Zap,
  ShieldCheck,
  Gauge,
  Binary,
  GitCompare,
  Layers3,
  CircleDot,
  ArrowRight,
} from 'lucide-react'

const DARC = { PSNR: 25.4332, SSIM: 0.7710, LPIPS: 0.2565 }
const BASE = { PSNR: 23.6653, SSIM: 0.6702, LPIPS: 0.4966 }

// Best and worst example filenames — unchanged
const BEST_EXAMPLES = [
  'best_002359.png',
  'best_002227.png',
  'best_002226.png',
  'best_001525.png',
  'best_003119.png',
]

const WORST_EXAMPLES = [
  'worst_002975.png',
  'worst_002973.png',
  'worst_002637.png',
  'worst_000407.png',
  'worst_002534.png',
]


/* ============================================================
   ANIMATED NUMBER
============================================================ */

function AnimatedNumber({ value, decimals = 4, duration = 1200 }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    let start = null
    const target = Number(value)

    const animate = (timestamp) => {
      if (!start) start = timestamp

      const progress = Math.min(
        (timestamp - start) / duration,
        1
      )

      const eased =
        1 - Math.pow(1 - progress, 3)

      setDisplay(target * eased)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    const timer = setTimeout(() => {
      requestAnimationFrame(animate)
    }, 350)

    return () => clearTimeout(timer)
  }, [value, duration])

  return <>{display.toFixed(decimals)}</>
}


/* ============================================================
   METRIC BAR
============================================================ */

function MetricBar({
  label,
  baseline,
  darc,
  higherBetter,
}) {
  const max = Math.max(baseline, darc) * 1.15

  const baseW = (baseline / max) * 100
  const darcW = (darc / max) * 100

  const improved =
    higherBetter
      ? darc > baseline
      : darc < baseline

  const diff =
    higherBetter
      ? darc - baseline
      : baseline - darc

  return (
    <div className="validation-metric-row">

      <div className="validation-metric-header">

        <div className="validation-metric-name">
          <CircleDot size={11} />
          {label}
        </div>

        <div
          className={`validation-improvement ${
            improved ? 'positive' : 'negative'
          }`}
        >
          {improved ? '▲' : '▼'} {diff.toFixed(4)}
          {' '}improvement
        </div>

      </div>


      {/* BASELINE */}

      <div className="validation-bar-line">

        <span className="validation-bar-label">
          BASELINE
        </span>

        <div className="validation-bar-track">

          <div
            className="validation-bar baseline-bar"
            style={{
              width: `${baseW}%`,
            }}
          />

          <div className="validation-bar-glint" />

        </div>

        <span className="validation-bar-value">
          {baseline.toFixed(4)}
        </span>

      </div>


      {/* DARC */}

      <div className="validation-bar-line">

        <span className="validation-bar-label darc-label">
          DARC-NET
        </span>

        <div className="validation-bar-track">

          <div
            className="validation-bar darc-bar"
            style={{
              width: `${darcW}%`,
            }}
          />

          <div className="validation-bar-pulse" />

        </div>

        <span className="validation-bar-value darc-value">
          {darc.toFixed(4)}
        </span>

      </div>

    </div>
  )
}


/* ============================================================
   EXAMPLE CARD
============================================================ */

function ExampleCard({ src, tag }) {
  const [err, setErr] = useState(false)

  const best = tag === 'best'

  return (
    <div
      className={`validation-example ${
        best
          ? 'validation-example-best'
          : 'validation-example-worst'
      }`}
    >

      <div className="validation-example-top">

        <div
          className={
            best
              ? 'validation-success-label'
              : 'validation-warning-label'
          }
        >
          {best
            ? '✓ SUCCESSFUL RESTORATION'
            : '⚠ DIFFICULT CASE'}
        </div>

        <div className="validation-example-index">
          {best ? 'TOP' : 'LOW'}
        </div>

      </div>


      <div className="validation-image-wrapper">

        {!err ? (
          <>
            <img
              src={`/data/examples/${src}`}
              alt={src}
              onError={() => setErr(true)}
              className="validation-example-image"
            />

            <div className="validation-image-scan" />
            <div className="validation-image-corner tl" />
            <div className="validation-image-corner tr" />
            <div className="validation-image-corner bl" />
            <div className="validation-image-corner br" />
          </>
        ) : (
          <div className="validation-image-error">
            <ScanLine size={20} />
            <span>
              IMAGE NOT FOUND
            </span>
            <small>
              public/data/examples/
            </small>
          </div>
        )}

      </div>


      <div className="validation-example-footer">

        <div className="validation-file-icon">
          <Database size={12} />
        </div>

        <span>
          {src}
        </span>

      </div>

    </div>
  )
}


/* ============================================================
   LIVE VALIDATION PIPELINE
============================================================ */

function ValidationPipeline() {
  const [progress, setProgress] = useState(0)
  const [active, setActive] = useState(0)

  const stages = [
    {
      icon: Database,
      title: 'LOAD DATASET',
      sub: '400 paired validation samples',
    },
    {
      icon: ScanLine,
      title: 'PREPROCESS',
      sub: 'Normalize & tensorize inputs',
    },
    {
      icon: Cpu,
      title: 'DARC-NET',
      sub: 'Forward inference',
    },
    {
      icon: GitCompare,
      title: 'COMPARE',
      sub: 'Prediction ↔ Ground Truth',
    },
    {
      icon: BarChart3,
      title: 'COMPUTE METRICS',
      sub: 'PSNR · SSIM · LPIPS',
    },
  ]

  useEffect(() => {
    let frame
    let start = null

    const duration = 2800

    const animate = (time) => {
      if (!start) start = time

      const p = Math.min(
        (time - start) / duration,
        1
      )

      setProgress(p * 100)

      const stage = Math.min(
        Math.floor(p * stages.length),
        stages.length - 1
      )

      setActive(stage)

      if (p < 1) {
        frame = requestAnimationFrame(animate)
      }
    }

    const timeout = setTimeout(() => {
      frame = requestAnimationFrame(animate)
    }, 400)

    return () => {
      clearTimeout(timeout)
      cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div className="validation-pipeline">

      <div className="validation-pipeline-header">

        <div className="validation-pipeline-title">
          <div className="validation-live-dot" />

          <div>
            <span>
              VALIDATION ENGINE
            </span>

            <strong>
              DARC-Net Evaluation Runtime
            </strong>
          </div>
        </div>

        <div className="validation-runtime">
          <Activity size={12} />
          LIVE
        </div>

      </div>


      <div className="validation-terminal">

        <div className="validation-terminal-head">

          <div className="terminal-dots">
            <span />
            <span />
            <span />
          </div>

          <span>
            validation_runner.py
          </span>

          <div className="terminal-gpu">
            <img src="/data/gpu.png" alt="GPU" />
              <span>RTX 3050</span>
        </div>

        </div>


        <div className="validation-terminal-body">

          <div>
            <span className="terminal-prompt">
              $
            </span>

            <span className="terminal-command">
              python evaluate_darc_full.py
            </span>
          </div>

          <div className="terminal-line">
            Loading checkpoint:
            <span>
              weights/darc_losses_best.pth
            </span>
          </div>

          <div className="terminal-line">
            Validation samples:
            <span>
              400
            </span>
          </div>

          <div className="terminal-line">
            Device:
            <span>
              CUDA / RTX 3050
            </span>
          </div>

          <div className="terminal-progress-text">
            Evaluating batch
            {' '}
            <span>
              {Math.max(
                1,
                Math.floor(progress * 4)
              )}
              / 4
            </span>
          </div>

          <div className="terminal-progress-track">
            <div
              className="terminal-progress-fill"
              style={{
                width: `${progress}%`,
              }}
            />

            <div className="terminal-progress-glow" />
          </div>

          <div className="terminal-result">

            <span className="terminal-ok">
              ✓
            </span>

            <span>
              Benchmark pipeline ready
            </span>

            <span className="terminal-cursor">
              _
            </span>

          </div>

        </div>

      </div>


      <div className="validation-stage-grid">

        {stages.map((stage, index) => {

          const Icon = stage.icon

          const isActive =
            index === active

          const completed =
            progress >=
            ((index + 1) / stages.length) * 100

          return (
            <div
              key={stage.title}
              className={`validation-stage ${
                isActive ? 'active' : ''
              } ${
                completed ? 'completed' : ''
              }`}
            >

              <div className="validation-stage-icon">
                <Icon size={15} />
              </div>

              <div>
                <strong>
                  {stage.title}
                </strong>

                <span>
                  {stage.sub}
                </span>
              </div>

              {index < stages.length - 1 && (
                <ArrowRight
                  className="validation-stage-arrow"
                  size={13}
                />
              )}

            </div>
          )
        })}

      </div>

    </div>
  )
}

/* ============================================================
   GPU RUNTIME CARD
============================================================ */

function GPURuntimeCard() {
  return (
    <div className="gpu-runtime-card">

      <div className="gpu-runtime-image">

        <img
          src="/data/gpu.png"
          alt="GPU used for DARC-Net validation"
        />

        <div className="gpu-image-overlay">
          <span className="gpu-status-dot" />
          CUDA ACCELERATED
        </div>

      </div>


      <div className="gpu-runtime-info">

        <div className="gpu-runtime-label">
          <Cpu size={14} />
          COMPUTE ENVIRONMENT
        </div>

        <h3>
          NVIDIA RTX 3050
        </h3>

        <p>
          DARC-Net validation inference was executed
          using CUDA acceleration on an NVIDIA RTX 3050.
        </p>


        <div className="gpu-spec-grid">

          <div className="gpu-spec">
            <span>DEVICE</span>
            <strong>RTX 3050</strong>
          </div>

          <div className="gpu-spec">
            <span>BACKEND</span>
            <strong>CUDA</strong>
          </div>

          <div className="gpu-spec">
            <span>RUNTIME</span>
            <strong>PyTorch</strong>
          </div>

          <div className="gpu-spec">
            <span>VALIDATION</span>
            <strong>400 PAIRS</strong>
          </div>

        </div>

      </div>

    </div>
  )
}


/* ============================================================
   MAIN
============================================================ */

export default function Validation() {

  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(
      () => setVisible(true),
      100
    )

    return () => clearTimeout(t)
  }, [])


  return (
    <main className="validation-page">

      <style>{`

        /* ======================================================
           ROOT
        ====================================================== */

        .validation-page {
          --v-bg: #030712;
          --v-panel: rgba(8, 15, 28, .76);
          --v-panel-2: rgba(12, 20, 35, .9);
          --v-line: rgba(148, 163, 184, .09);
          --v-text: #e7edf6;
          --v-muted: #64748b;
          --v-blue: #5d9eff;
          --v-green: #39e58c;
          --v-purple: #a78bfa;
          --v-orange: #ffa94d;

          position: relative;
          min-height: 100vh;
          overflow: hidden;

          padding:
            35px
            0
            110px;

          color: var(--v-text);

          background:
            radial-gradient(
              circle at 12% 3%,
              rgba(37,99,235,.12),
              transparent 28%
            ),
            radial-gradient(
              circle at 90% 12%,
              rgba(167,139,250,.09),
              transparent 25%
            ),
            radial-gradient(
              circle at 50% 60%,
              rgba(0,255,204,.025),
              transparent 32%
            ),
            #030712;

          font-family:
            Inter,
            system-ui,
            sans-serif;
        }


        .validation-page *,
        .validation-page *::before,
        .validation-page *::after {
          box-sizing: border-box;
        }


        /* ======================================================
           BACKGROUND GRID
        ====================================================== */

        .validation-page::before {
          content: "";

          position: fixed;
          inset: 0;

          pointer-events: none;

          opacity: .25;

          background-image:
            linear-gradient(
              rgba(255,255,255,.025) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(255,255,255,.025) 1px,
              transparent 1px
            );

          background-size: 48px 48px;

          mask-image:
            linear-gradient(
              to bottom,
              black,
              transparent 85%
            );

          z-index: 0;
        }


        .validation-page::after {
          content: "";

          position: fixed;

          width: 450px;
          height: 450px;

          right: -180px;
          top: 320px;

          border-radius: 50%;

          background:
            radial-gradient(
              circle,
              rgba(93,158,255,.06),
              transparent 70%
            );

          pointer-events: none;
        }


        .validation-page > * {
          position: relative;
          z-index: 1;
        }


        /* ======================================================
           HERO
        ====================================================== */

        .validation-page .hero {
          position: relative;
          max-width: 1180px;
          margin: 0 auto 65px;
          padding:
            70px
            0
            0;

          animation:
            validation-rise
            .8s
            ease
            both;
        }


        .validation-page .hero::after {
          content: "";

          position: absolute;

          right: 0;
          top: 45px;

          width: 260px;
          height: 1px;

          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(93,158,255,.35)
            );

          animation:
            validation-line-grow
            1.2s
            ease
            .3s
            both;
        }


        .validation-page .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;

          padding:
            8px
            13px;

          border:
            1px solid
            rgba(93,158,255,.25);

          border-radius: 999px;

          color: #7db5ff;

          background:
            rgba(93,158,255,.055);

          font-size: 10px;
          font-weight: 850;
          letter-spacing: .16em;

          box-shadow:
            0 0 30px
            rgba(93,158,255,.04);
        }


        .validation-page .hero h1 {
          margin:
            24px
            0
            20px;

          font-family:
            "Space Grotesk",
            system-ui,
            sans-serif;

          font-size:
            clamp(
              46px,
              6vw,
              76px
            );

          line-height: .94;

          letter-spacing: -.055em;

          color: #f8fafc;
        }


        .validation-page .hero h1 span {
          background:
            linear-gradient(
              120deg,
              #ffffff,
              #b9d7ff 30%,
              #5d9eff 62%,
              #a78bfa
            );

          background-size: 250% 250%;

          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;

          animation:
            validation-gradient
            5s
            ease
            infinite;
        }


        .validation-page .hero p {
          max-width: 700px;

          color: #64748b;

          font-size: 14px;
          line-height: 1.85;
        }


        /* ======================================================
           PIPELINE
        ====================================================== */

        .validation-pipeline {
          max-width: 1180px;

          margin:
            0
            auto
            75px;

          padding:
            1px;

          border-radius: 20px;

          background:
            linear-gradient(
              135deg,
              rgba(93,158,255,.3),
              rgba(167,139,250,.08),
              rgba(0,255,204,.16)
            );

          box-shadow:
            0 35px 100px
            rgba(0,0,0,.3);
        }


        .validation-pipeline-header {
          display: flex;
          align-items: center;
          justify-content: space-between;

          padding:
            18px
            22px;

          border-radius:
            19px
            19px
            0
            0;

          background:
            rgba(7,13,25,.96);

          border-bottom:
            1px solid
            rgba(255,255,255,.055);
        }


        .validation-pipeline-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }


        .validation-live-dot {
          width: 9px;
          height: 9px;

          border-radius: 50%;

          background:
            #39e58c;

          box-shadow:
            0 0 0 0
            rgba(57,229,140,.6);

          animation:
            validation-live
            1.5s
            infinite;
        }


        .validation-pipeline-title span {
          display: block;

          color: #526176;

          font-size: 8px;
          font-weight: 850;

          letter-spacing: .16em;
        }


        .validation-pipeline-title strong {
          display: block;

          margin-top: 3px;

          color: #dce7f4;

          font-family:
            "Space Grotesk",
            sans-serif;

          font-size: 13px;
        }


        .validation-runtime {
          display: flex;
          align-items: center;
          gap: 6px;

          padding:
            6px
            9px;

          border:
            1px solid
            rgba(57,229,140,.16);

          border-radius: 6px;

          color: #39e58c;

          background:
            rgba(57,229,140,.035);

          font-size: 8px;
          font-weight: 850;
          letter-spacing: .12em;
        }


        /* ======================================================
           TERMINAL
        ====================================================== */

        .validation-terminal {
          background:
            rgba(2,6,15,.95);

          border-radius:
            0
            0
            19px
            19px;

          overflow: hidden;
        }


        .validation-terminal-head {
          display: flex;
          align-items: center;
          gap: 12px;

          height: 38px;

          padding:
            0
            15px;

          border-bottom:
            1px solid
            rgba(255,255,255,.045);

          color: #4b5b70;

          font-family:
            monospace;

          font-size: 9px;
        }


        .terminal-dots {
          display: flex;
          gap: 5px;
        }


        .terminal-dots span {
          width: 7px;
          height: 7px;

          border-radius: 50%;

          background:
            #263348;
        }


        .terminal-status {
          margin-left: auto;

          color: #39e58c;

          font-size: 8px;
        }


        .validation-terminal-body {
          position: relative;

          padding:
            20px
            22px;

          min-height: 205px;

          font-family:
            "JetBrains Mono",
            monospace;

          font-size: 10px;

          line-height: 1.9;
        }


        .terminal-prompt {
          color: #39e58c;
          margin-right: 8px;
        }


        .terminal-command {
          color: #d7e3f1;
        }


        .terminal-line {
          color: #4e6076;
        }


        .terminal-line span {
          color: #7ea5d2;
          margin-left: 6px;
        }


        .terminal-progress-text {
          margin-top: 8px;
          color: #66778d;
        }


        .terminal-progress-text span {
          color: #5d9eff;
        }


        .terminal-progress-track {
          position: relative;

          width: 100%;
          height: 5px;

          margin-top: 7px;

          overflow: hidden;

          border-radius: 999px;

          background:
            rgba(255,255,255,.055);
        }


        .terminal-progress-fill {
          height: 100%;

          border-radius: inherit;

          background:
            linear-gradient(
              90deg,
              #2d6bc4,
              #5d9eff,
              #00ffcc
            );

          box-shadow:
            0 0 15px
            rgba(93,158,255,.6);

          transition:
            width .08s linear;
        }


        .terminal-progress-glow {
          position: absolute;
          top: 0;

          width: 100px;
          height: 100%;

          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(255,255,255,.7),
              transparent
            );

          animation:
            terminal-glide
            1.2s
            linear
            infinite;
        }


        .terminal-result {
          display: flex;
          align-items: center;
          gap: 8px;

          margin-top: 10px;

          color: #53677e;
        }


        .terminal-ok {
          color: #39e58c;
        }


        .terminal-cursor {
          color: #39e58c;

          animation:
            terminal-blink
            1s
            infinite;
        }


        /* ======================================================
           STAGES
        ====================================================== */

        .validation-stage-grid {
          display: grid;

          grid-template-columns:
            repeat(
              5,
              1fr
            );

          gap: 1px;

          padding: 1px;

          background:
            rgba(255,255,255,.045);
        }


        .validation-stage {
          position: relative;

          display: flex;
          align-items: center;

          gap: 9px;

          min-height: 78px;

          padding:
            13px;

          background:
            #050b16;

          transition:
            background .3s ease,
            transform .3s ease;
        }


        .validation-stage.active {
          background:
            rgba(93,158,255,.065);
        }


        .validation-stage.completed
          .validation-stage-icon {
          color: #39e58c;
          border-color: rgba(57,229,140,.25);
        }


        .validation-stage-icon {
          flex-shrink: 0;

          width: 31px;
          height: 31px;

          display: flex;
          align-items: center;
          justify-content: center;

          border:
            1px solid
            rgba(93,158,255,.14);

          border-radius: 8px;

          color: #5d9eff;

          background:
            rgba(93,158,255,.035);
        }


        .validation-stage strong {
          display: block;

          color: #a8b8ca;

          font-size: 8px;
          font-weight: 850;

          letter-spacing: .08em;
        }


        .validation-stage span {
          display: block;

          margin-top: 4px;

          color: #425166;

          font-size: 8px;

          line-height: 1.4;
        }


        .validation-stage-arrow {
          position: absolute;

          right: -7px;

          color: #334155;

          z-index: 3;
        }


        /* ======================================================
           CONTENT WIDTH
        ====================================================== */

        .validation-page > section:not(.validation-pipeline) {
          max-width: 1180px;
          margin-left: auto;
          margin-right: auto;
        }


        /* ======================================================
           SECTION HEADINGS
        ====================================================== */

        .validation-page .section-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;

          gap: 25px;

          margin-bottom: 25px;
        }


        .validation-page .panel-label {
          color: #5d9eff;

          font-size: 9px;
          font-weight: 850;

          letter-spacing: .18em;
        }


        .validation-page .section-heading h2 {
          margin:
            8px
            0
            0;

          color: #f1f5f9;

          font-family:
            "Space Grotesk",
            sans-serif;

          font-size:
            clamp(
              27px,
              4vw,
              42px
            );

          line-height: 1;

          letter-spacing: -.04em;
        }


        .benchmark-note {
          color: #4c5b70;

          font-size: 9px;
          font-family: monospace;
        }


        /* ======================================================
           BENCHMARK CARDS
        ====================================================== */

        .benchmark-grid {
          display: grid;

          grid-template-columns:
            repeat(
              3,
              1fr
            );

          gap: 14px;
        }


        .benchmark-card {
          position: relative;

          overflow: hidden;

          min-height: 170px;

          padding:
            23px;

          border:
            1px solid
            rgba(255,255,255,.07);

          border-radius: 16px;

          background:
            linear-gradient(
              145deg,
              rgba(15,23,42,.72),
              rgba(3,7,18,.9)
            );

          transition:
            transform .35s ease,
            border-color .35s ease,
            box-shadow .35s ease;
        }


        .benchmark-card::before {
          content: "";

          position: absolute;

          top: 0;
          left: -100%;

          width: 100%;
          height: 1px;

          background:
            linear-gradient(
              90deg,
              transparent,
              #5d9eff,
              transparent
            );

          animation:
            metric-scan
            3s
            linear
            infinite;
        }


        .benchmark-card:hover {
          transform:
            translateY(-6px);

          border-color:
            rgba(93,158,255,.22);

          box-shadow:
            0 25px 60px
            rgba(0,0,0,.3);
        }


        .benchmark-card > div:first-child span:first-child {
          color: #8b9aae;

          font-family: monospace;

          font-size: 10px;
          font-weight: 800;

          letter-spacing: .16em;
        }


        .benchmark-card strong {
          display: inline-block;

          margin-top: 24px;

          color: #f4f8fc;

          font-family:
            "Space Grotesk",
            sans-serif;

          letter-spacing: -.04em;
        }


        .benchmark-card small {
          margin-left: 7px;

          color: #5d9eff;

          font-family: monospace;

          font-size: 9px;
        }


        .benchmark-disclaimer {
          margin-top: 13px;

          color: #46556a;

          font-size: 10px;
          line-height: 1.7;
        }


        /* ======================================================
           COMPARISON METRIC CARDS
        ====================================================== */

        .validation-page .metric-card {
          position: relative;

          overflow: hidden;

          display: flex;
          flex-direction: column;
          justify-content: space-between;

          min-height: 120px;

          padding:
            20px;

          border:
            1px solid
            rgba(255,255,255,.07);

          border-radius: 14px;

          background:
            rgba(255,255,255,.015);

          transition:
            transform .3s ease,
            background .3s ease;
        }


        .validation-page .metric-card:hover {
          transform:
            translateY(-4px);

          background:
            rgba(255,255,255,.025);
        }


        .validation-page .metric-card strong {
          display: block;

          margin-top: 16px;
        }


        /* ======================================================
           COMPARISON PANEL
        ====================================================== */

        .validation-page .panel {
          position: relative;

          overflow: hidden;

          border:
            1px solid
            rgba(255,255,255,.07);

          border-radius: 16px;

          background:
            linear-gradient(
              145deg,
              rgba(15,23,42,.65),
              rgba(3,7,18,.88)
            );

          box-shadow:
            0 15px 50px
            rgba(0,0,0,.15);
        }


        .validation-page .panel::before {
          content: "";

          position: absolute;

          top: 0;
          left: 0;

          width: 100%;
          height: 1px;

          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(93,158,255,.3),
              transparent
            );
        }


        /* ======================================================
           METRIC BARS
        ====================================================== */

        .validation-metric-row {
          margin-bottom: 30px;
        }


        .validation-metric-row:last-child {
          margin-bottom: 0;
        }


        .validation-metric-header {
          display: flex;
          justify-content: space-between;
          align-items: center;

          margin-bottom: 12px;
        }


        .validation-metric-name {
          display: flex;
          align-items: center;
          gap: 7px;

          color: #8490a2;

          font-size: 10px;
          font-weight: 800;

          letter-spacing: .13em;
        }


        .validation-metric-name svg {
          color: #5d9eff;
        }


        .validation-improvement {
          font-size: 9px;
          font-weight: 800;

          letter-spacing: .04em;
        }


        .validation-improvement.positive {
          color: #39e58c;
        }


        .validation-improvement.negative {
          color: #ff6b6b;
        }


        .validation-bar-line {
          display: grid;

          grid-template-columns:
            72px
            1fr
            68px;

          align-items: center;

          gap: 10px;

          margin-bottom: 8px;
        }


        .validation-bar-label {
          color: #596579;

          font-size: 8px;
          font-weight: 800;

          letter-spacing: .1em;
        }


        .darc-label {
          color: #5d9eff;
        }


        .validation-bar-track {
          position: relative;

          height: 7px;

          overflow: hidden;

          border-radius: 999px;

          background:
            rgba(255,255,255,.055);
        }


        .validation-bar {
          height: 100%;

          border-radius: inherit;

          transform-origin: left;

          animation:
            bar-grow
            1.4s
            cubic-bezier(.2,.8,.2,1)
            both;
        }


        .baseline-bar {
          background:
            #3d5270;
        }


        .darc-bar {
          background:
            linear-gradient(
              90deg,
              #245db1,
              #5d9eff,
              #7bb4ff
            );

          box-shadow:
            0 0 15px
            rgba(93,158,255,.4);
        }


        .validation-bar-glint,
        .validation-bar-pulse {
          position: absolute;

          top: 0;

          width: 80px;
          height: 100%;

          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(255,255,255,.55),
              transparent
            );

          animation:
            bar-glint
            2.4s
            linear
            infinite;
        }


        .validation-bar-value {
          color: #8490a2;

          font-family: monospace;

          font-size: 10px;

          text-align: right;
        }


        .darc-value {
          color: #5d9eff;
        }


        /* ======================================================
           TABLE
        ====================================================== */

        .validation-page table {
          color: #a8b4c4;
        }


        .validation-page tbody tr {
          transition:
            background .25s ease;
        }


        .validation-page tbody tr:hover {
          background:
            rgba(93,158,255,.055) !important;
        }


        /* ======================================================
           EXAMPLES
        ====================================================== */

        .validation-example {
          position: relative;

          overflow: hidden;

          padding: 13px;

          border:
            1px solid
            rgba(255,255,255,.07);

          border-radius: 15px;

          background:
            linear-gradient(
              145deg,
              rgba(15,23,42,.68),
              rgba(3,7,18,.92)
            );

          transition:
            transform .35s ease,
            border-color .35s ease,
            box-shadow .35s ease;
        }


        .validation-example:hover {
          transform:
            translateY(-7px);

          box-shadow:
            0 25px 65px
            rgba(0,0,0,.32);
        }


        .validation-example-best:hover {
          border-color:
            rgba(57,229,140,.3);
        }


        .validation-example-worst:hover {
          border-color:
            rgba(255,107,107,.25);
        }


        .validation-example-top {
          display: flex;
          align-items: center;
          justify-content: space-between;

          margin-bottom: 10px;
        }


        .validation-success-label,
        .validation-warning-label {
          font-size: 8px;
          font-weight: 850;

          letter-spacing: .14em;
        }


        .validation-success-label {
          color: #39e58c;
        }


        .validation-warning-label {
          color: #ff6b6b;
        }


        .validation-example-index {
          padding:
            4px
            6px;

          border-radius: 5px;

          color: #4d5e73;

          background:
            rgba(255,255,255,.025);

          font-family: monospace;

          font-size: 7px;
        }


        .validation-image-wrapper {
          position: relative;

          overflow: hidden;

          min-height: 160px;

          border-radius: 8px;

          background:
            radial-gradient(
              circle,
              rgba(93,158,255,.04),
              rgba(0,0,0,.35)
            );
        }


        .validation-example-image {
          display: block;

          width: 100%;

          border-radius: 8px;

          transition:
            transform .5s ease,
            filter .5s ease;
        }


        .validation-example:hover
          .validation-example-image {
          transform: scale(1.035);

          filter:
            contrast(1.04)
            brightness(1.03);
        }


        .validation-image-scan {
          position: absolute;

          left: 0;

          width: 100%;
          height: 2px;

          top: -5px;

          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(93,158,255,.75),
              transparent
            );

          box-shadow:
            0 0 15px
            rgba(93,158,255,.6);

          animation:
            image-scan
            3.2s
            linear
            infinite;
        }


        .validation-image-corner {
          position: absolute;

          width: 13px;
          height: 13px;

          border-color: #5d9eff;

          opacity: .7;
        }


        .validation-image-corner.tl {
          top: 8px;
          left: 8px;

          border-top: 1px solid;
          border-left: 1px solid;
        }


        .validation-image-corner.tr {
          top: 8px;
          right: 8px;

          border-top: 1px solid;
          border-right: 1px solid;
        }


        .validation-image-corner.bl {
          bottom: 8px;
          left: 8px;

          border-bottom: 1px solid;
          border-left: 1px solid;
        }


        .validation-image-corner.br {
          bottom: 8px;
          right: 8px;

          border-bottom: 1px solid;
          border-right: 1px solid;
        }


        .validation-image-error {
          min-height: 160px;

          display: flex;
          flex-direction: column;

          align-items: center;
          justify-content: center;

          gap: 7px;

          color: #35465a;

          font-family: monospace;

          font-size: 9px;
        }


        .validation-image-error small {
          color: #263448;
        }


        .validation-example-footer {
          display: flex;
          align-items: center;

          gap: 8px;

          margin-top: 9px;

          color: #596579;

          font-family: monospace;

          font-size: 8px;

          overflow: hidden;
        }


        .validation-example-footer span:last-child {
          overflow: hidden;

          text-overflow: ellipsis;

          white-space: nowrap;
        }


        .validation-file-icon {
          display: flex;

          align-items: center;
          justify-content: center;

          width: 23px;
          height: 23px;

          flex-shrink: 0;

          border-radius: 6px;

          color: #5d9eff;

          background:
            rgba(93,158,255,.055);

          border:
            1px solid
            rgba(93,158,255,.1);
        }


        /* ======================================================
           RESPONSIVE
        ====================================================== */

        @media (max-width: 1000px) {

          .validation-page .hero,
          .validation-page > section:not(.validation-pipeline),
          .validation-pipeline {
            width:
              min(
                100% - 40px,
                1180px
              );
          }


          .validation-stage-grid {
            grid-template-columns:
              repeat(
                3,
                1fr
              );
          }


          .validation-stage-arrow {
            display: none;
          }

        }


        @media (max-width: 750px) {

          .validation-page {
            padding-top: 10px;
          }


          .validation-page .hero {
            padding-top: 45px;
          }


          .validation-page .hero h1 {
            font-size: 48px;
          }


          .benchmark-grid {
            grid-template-columns: 1fr;
          }


          .validation-stage-grid {
            grid-template-columns:
              1fr
              1fr;
          }


          .validation-page .section-heading {
            display: block;
          }


          .benchmark-note {
            display: block;
            margin-top: 12px;
          }


          .validation-bar-line {
            grid-template-columns:
              65px
              1fr
              60px;
          }

        }


        @media (max-width: 520px) {

          .validation-page .hero,
          .validation-page > section:not(.validation-pipeline),
          .validation-pipeline {
            width:
              calc(100% - 28px);
          }


          .validation-page .hero h1 {
            font-size: 42px;
          }


          .validation-stage-grid {
            grid-template-columns: 1fr;
          }


          .validation-terminal-body {
            padding: 17px;
            font-size: 8px;
          }


          .validation-pipeline-header {
            padding:
              15px;
          }


          .validation-bar-line {
            grid-template-columns:
              60px
              1fr
              55px;

            gap: 7px;
          }


          .validation-metric-header {
            align-items: flex-start;
            gap: 10px;
          }


          .validation-improvement {
            text-align: right;
          }

        }


        /* ======================================================
           ANIMATIONS
        ====================================================== */

        @keyframes validation-rise {

          from {
            opacity: 0;
            transform:
              translateY(25px);
          }

          to {
            opacity: 1;
            transform:
              translateY(0);
          }

        }


        @keyframes validation-line-grow {

          from {
            width: 0;
            opacity: 0;
          }

          to {
            width: 260px;
            opacity: 1;
          }

        }


        @keyframes validation-gradient {

          0%,
          100% {
            background-position:
              0% 50%;
          }

          50% {
            background-position:
              100% 50%;
          }

        }


        @keyframes validation-live {

          0% {
            box-shadow:
              0 0 0 0
              rgba(57,229,140,.55);
          }

          70% {
            box-shadow:
              0 0 0 8px
              rgba(57,229,140,0);
          }

          100% {
            box-shadow:
              0 0 0 0
              rgba(57,229,140,0);
          }

        }


        @keyframes terminal-glide {

          from {
            left: -100px;
          }

          to {
            left: 100%;
          }

        }


        @keyframes terminal-blink {

          0%,
          45% {
            opacity: 1;
          }

          46%,
          100% {
            opacity: 0;
          }

        }


        @keyframes metric-scan {

          0% {
            left: -100%;
          }

          50%,
          100% {
            left: 100%;
          }

        }


        @keyframes bar-grow {

          from {
            transform:
              scaleX(0);
          }

          to {
            transform:
              scaleX(1);
          }

        }


        @keyframes bar-glint {

          0% {
            left: -100px;
          }

          50%,
          100% {
            left: 100%;
          }

        }


        @keyframes image-scan {

          0% {
            top: -5px;
          }

          55%,
          100% {
            top: calc(100% + 5px);
          }

        }


        @media (prefers-reduced-motion: reduce) {

          .validation-page *,
          .validation-page *::before,
          .validation-page *::after {
            animation-duration:
              .01ms !important;

            animation-iteration-count:
              1 !important;

            transition-duration:
              .01ms !important;
          }

        }

      `}</style>


      {/* ======================================================
          HERO
      ====================================================== */}

      <section
        className="hero"
        style={{
          marginBottom: 55,
        }}
      >

        <div className="eyebrow">

          <BarChart3 size={14} />

          VALIDATION LAB

        </div>


        <h1>

          Does DARC-Net

          <br />

          <span>
            Actually Improve Restoration?
          </span>

        </h1>


        <p>

          Evaluated on 400 held-out validation pairs
          (seed 42) that were never seen during training
          or used for model selection. Same metric
          implementation for both models.

        </p>

      </section>


      {/* ======================================================
          LIVE ML VALIDATION PIPELINE
      ====================================================== */}

      <ValidationPipeline />


      {/* ======================================================
          METRIC RESULTS
      ====================================================== */}

      <section style={{ marginBottom: 72 }}>

        <div className="section-heading">

          <div>

            <span className="panel-label">
              01 // DARC-NET RESULTS
            </span>

            <h2>
              Validation Benchmark
            </h2>

          </div>

          <span className="benchmark-note">
            n = 400 images · paired GT available
          </span>

        </div>


        <div className="benchmark-grid">

          {[
            {
              label: 'PSNR',
              value: DARC.PSNR,
              unit: 'dB',
              dir: '↑ Higher is better',
              desc:
                'Pixel-level reconstruction fidelity',
            },

            {
              label: 'SSIM',
              value: DARC.SSIM,
              unit: '',
              dir: '↑ Higher is better',
              desc:
                'Structural similarity preservation',
            },

            {
              label: 'LPIPS',
              value: DARC.LPIPS,
              unit: '',
              dir: '↓ Lower is better',
              desc:
                'Perceptual similarity (AlexNet)',
            },

          ].map((m) => (

            <div
              key={m.label}
              className="benchmark-card"
            >

              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                }}
              >

                <span>
                  {m.label}
                </span>

                <span
                  style={{
                    color: '#39e58c',
                    fontSize: 9,
                    fontWeight: 700,
                  }}
                >
                  {m.dir}
                </span>

              </div>


              <strong
                style={{
                  fontSize: 36,
                }}
              >
                <AnimatedNumber
                  value={m.value}
                />
              </strong>


              {m.unit && (
                <small>
                  {m.unit}
                </small>
              )}


              <div
                style={{
                  color: '#596579',
                  fontSize: 10,
                  marginTop: 8,
                }}
              >
                {m.desc}
              </div>

            </div>

          ))}

        </div>


        <p className="benchmark-disclaimer">

          These metrics are computed against ground-truth
          paired images from the KLA validation set.
          They are{' '}
          <strong
            style={{
              color: '#8490a2',
            }}
          >
            not
          </strong>{' '}
          computed for arbitrary user uploads.

        </p>

      </section>


      {/* ======================================================
          BASELINE COMPARISON
      ====================================================== */}

      <section style={{ marginBottom: 72 }}>

        <div className="section-heading">

          <div>

            <span className="panel-label">
              02 // COMPARISON
            </span>

            <h2>
              DARC-Net vs Baseline CNN
            </h2>

          </div>

        </div>


        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(2, 1fr)',
            gap: 14,
            marginBottom: 28,
          }}
        >

          {[
            {
              label: 'PSNR GAIN',
              value: '+1.7679 dB',
              icon:
                <TrendingUp size={18} />,
              color: '#39e58c',
            },

            {
              label: 'SSIM GAIN',
              value: '+0.1008',
              icon:
                <TrendingUp size={18} />,
              color: '#39e58c',
            },

            {
              label: 'LPIPS IMPROVEMENT',
              value: '0.2400 lower',
              icon:
                <TrendingDown size={18} />,
              color: '#5d9eff',
            },

            {
              label: 'LPIPS RELATIVE',
              value: '~48% better',
              icon:
                <TrendingDown size={18} />,
              color: '#5d9eff',
            },

          ].map((c) => (

            <div
              key={c.label}
              className="metric-card"
              style={{
                borderColor:
                  `${c.color}22`,
              }}
            >

              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                  color: c.color,
                }}
              >

                {c.icon}

                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '.12em',
                  }}
                >
                  {c.label}
                </span>

              </div>


              <strong
                style={{
                  fontSize: 24,
                  color: c.color,
                  fontFamily:
                    'Space Grotesk,sans-serif',
                }}
              >
                {c.value}
              </strong>

            </div>

          ))}

        </div>


        <div
          className="panel"
          style={{
            padding:
              '32px 28px',
          }}
        >

          {visible && (
            <>
              <MetricBar
                label="PSNR (dB)"
                baseline={BASE.PSNR}
                darc={DARC.PSNR}
                higherBetter={true}
              />

              <MetricBar
                label="SSIM"
                baseline={BASE.SSIM}
                darc={DARC.SSIM}
                higherBetter={true}
              />

              <MetricBar
                label="LPIPS"
                baseline={BASE.LPIPS}
                darc={DARC.LPIPS}
                higherBetter={false}
              />
            </>
          )}

        </div>


        {/* TABLE */}

        <div
          className="panel"
          style={{
            marginTop: 16,
            padding: 0,
            overflow: 'hidden',
          }}
        >

          <table
            style={{
              width: '100%',
              borderCollapse:
                'collapse',
              fontSize: 12,
            }}
          >

            <thead>

              <tr
                style={{
                  background:
                    'rgba(255,255,255,.03)',
                }}
              >

                {[
                  'Model',
                  'PSNR (dB)',
                  'SSIM',
                  'LPIPS',
                ].map((h) => (

                  <th
                    key={h}
                    style={{
                      padding:
                        '14px 20px',
                      textAlign: 'left',
                      color: '#596579',
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing:
                        '.13em',
                      borderBottom:
                        '1px solid rgba(255,255,255,.06)',
                    }}
                  >
                    {h}
                  </th>

                ))}

              </tr>

            </thead>


            <tbody>

              {[
                {
                  name:
                    'Baseline CNN',
                  ...BASE,
                  highlight:
                    false,
                },

                {
                  name:
                    'DARC-Net',
                  ...DARC,
                  highlight:
                    true,
                },

              ].map((row) => (

                <tr
                  key={row.name}
                  style={{
                    background:
                      row.highlight
                        ? 'rgba(75,140,255,.04)'
                        : 'transparent',
                  }}
                >

                  <td
                    style={{
                      padding:
                        '14px 20px',
                      color:
                        row.highlight
                          ? '#5d9eff'
                          : '#8490a2',
                      fontWeight:
                        row.highlight
                          ? 700
                          : 400,
                      fontFamily:
                        'Space Grotesk,sans-serif',
                    }}
                  >
                    {row.name}
                  </td>


                  <td
                    style={{
                      padding:
                        '14px 20px',
                      color:
                        row.highlight
                          ? '#e7ebf2'
                          : '#667085',
                      fontFamily:
                        'monospace',
                    }}
                  >
                    {row.PSNR.toFixed(4)}
                  </td>


                  <td
                    style={{
                      padding:
                        '14px 20px',
                      color:
                        row.highlight
                          ? '#e7ebf2'
                          : '#667085',
                      fontFamily:
                        'monospace',
                    }}
                  >
                    {row.SSIM.toFixed(4)}
                  </td>


                  <td
                    style={{
                      padding:
                        '14px 20px',
                      color:
                        row.highlight
                          ? '#e7ebf2'
                          : '#667085',
                      fontFamily:
                        'monospace',
                    }}
                  >
                    {row.LPIPS.toFixed(4)}
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </section>


      {/* ======================================================
          BEST EXAMPLES
      ====================================================== */}

      <section style={{ marginBottom: 60 }}>

        <div className="section-heading">

          <div>

            <span className="panel-label">
              03 // EXAMPLES
            </span>

            <h2>
              Successful Restorations
            </h2>

          </div>


          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: '#39e58c',
              fontSize: 10,
              fontWeight: 700,
            }}
          >

            <CheckCircle2 size={14} />

            TOP BY PSNR

          </div>

        </div>


        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit,minmax(260px,1fr))',
            gap: 14,
          }}
        >

          {BEST_EXAMPLES.map((f) => (

            <ExampleCard
              key={f}
              src={f}
              tag="best"
            />

          ))}

        </div>

      </section>


      {/* ======================================================
          FAILURE ANALYSIS
      ====================================================== */}

      <section style={{ marginBottom: 40 }}>

        <div className="section-heading">

          <div>

            <span className="panel-label">
              04 // FAILURE ANALYSIS
            </span>

            <h2>
              Where the Model Struggles
            </h2>

          </div>


          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: '#ffa94d',
              fontSize: 10,
              fontWeight: 700,
            }}
          >

            <AlertTriangle size={14} />

            LOWEST PSNR

          </div>

        </div>


        <div
          className="panel"
          style={{
            marginBottom: 20,
            padding:
              '18px 22px',
            borderColor:
              'rgba(255,169,77,.15)',
          }}
        >

          <p
            style={{
              margin: 0,
              color: '#8490a2',
              fontSize: 13,
              lineHeight: 1.8,
            }}
          >

            Failure cases correspond to inputs where the
            ground truth itself is dominated by
            high-frequency, near-random texture. Since
            the degradation process destroys fine
            noise-realization detail irrecoverably,
            these cases represent an{' '}

            <strong
              style={{
                color: '#c8d4e8',
              }}
            >
              information-theoretic lower bound
            </strong>

            {' '}on achievable PSNR/SSIM — not a model
            deficiency. Forcing higher scores on such
            cases would require hallucinating specific
            noise patterns, which the degradation-consistency
            design explicitly avoids.

          </p>

        </div>


        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit,minmax(260px,1fr))',
            gap: 14,
          }}
        >

          {WORST_EXAMPLES.map((f) => (

            <ExampleCard
              key={f}
              src={f}
              tag="worst"
            />

          ))}

        </div>

      </section>


      {/* ======================================================
          FOOTER SIGNAL
      ====================================================== */}

      <div
        style={{
          maxWidth: 1180,
          margin: '75px auto 0',
          height: 1,
          background:
            'linear-gradient(90deg,transparent,rgba(93,158,255,.25),rgba(0,255,204,.18),transparent)',
        }}
      />

      <div
        style={{
          maxWidth: 1180,
          margin: '20px auto 0',
          display: 'flex',
          justifyContent:
            'space-between',
          gap: 20,
          color: '#334155',
          fontSize: 8,
          letterSpacing: '.13em',
        }}
      >

        <span>
          DARC-NET · VALIDATION LAB
        </span>

        <span>
          400 HELD-OUT PAIRS · SEED 42
        </span>

      </div>

    </main>
  )
}