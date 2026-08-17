import { useEffect, useState } from 'react'
import {
  Cpu,
  AlertTriangle,
  Zap,
  Activity,
  Gauge,
  Database,
  Timer,
  Layers,
  ArrowRight,
  Terminal,
  HardDrive,
  MemoryStick,
  Server,
  CheckCircle2,
  Workflow,
  BarChart3,
} from 'lucide-react'

const STAGES = [
  { key: 'disk_read',       label: 'Disk Read',       color: '#ffa94d' },
  { key: 'preprocess',      label: 'Preprocessing',   color: '#f7c948' },
  { key: 'cpu_to_gpu',      label: 'CPU → GPU',       color: '#a78bfa' },
  { key: 'model_execution', label: 'DARC-Net',        color: '#5d9eff' },
  { key: 'gpu_to_cpu',      label: 'GPU → CPU',       color: '#a78bfa' },
  { key: 'postprocess',     label: 'Postprocessing',  color: '#f7c948' },
  { key: 'save',            label: 'Save to Disk',    color: '#ffa94d' },
]

const STATIC = {
  images_per_second: 58.80,
  mean_latency_ms: 17.01,
  batch_size: 16,
  stage_ms: {
    disk_read: 2.99,
    preprocess: 0.45,
    cpu_to_gpu: 0.51,
    model_execution: 241.42,
    gpu_to_cpu: 1.90,
    postprocess: 0.60,
    save: 24.21,
  },
  total_ms: 272.09,
}

function StageBar({ label, ms, total, color, animate }) {
  const pct = ((ms / total) * 100).toFixed(1)

  return (
    <div className="bench-stage">
      <div className="bench-stage-head">
        <div className="bench-stage-name">
          <span
            className="bench-stage-dot"
            style={{
              background: color,
              boxShadow: `0 0 12px ${color}`,
            }}
          />
          <span>{label}</span>
        </div>

        <div className="bench-stage-values">
          <span style={{ color }}>{ms.toFixed(2)} ms</span>
          <span>{pct}%</span>
        </div>
      </div>

      <div className="bench-stage-track">
        <div
          className="bench-stage-fill"
          style={{
            width: animate ? `${pct}%` : '0%',
            background: `linear-gradient(90deg, ${color}88, ${color})`,
            boxShadow: `0 0 16px ${color}33`,
          }}
        />
      </div>
    </div>
  )
}

function AnimatedNumber({ value, decimals = 2 }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    let start = null
    const duration = 1100

    const animate = (timestamp) => {
      if (!start) start = timestamp

      const progress = Math.min(
        (timestamp - start) / duration,
        1
      )

      const eased = 1 - Math.pow(1 - progress, 3)

      setDisplay(value * eased)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    const frame = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(frame)
  }, [value])

  return display.toFixed(decimals)
}

function GpuCore({ throughput, latency }) {
  const [pulse, setPulse] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(p => p + 1)
    }, 900)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="gpu-visual">

      <div className="gpu-grid" />

      <div className="gpu-scanline" />

      {/* orbit rings */}
      <div className="gpu-orbit gpu-orbit-one" />
      <div className="gpu-orbit gpu-orbit-two" />
      <div className="gpu-orbit gpu-orbit-three" />

      {/* moving packets */}
      <div className="gpu-packet packet-one" />
      <div className="gpu-packet packet-two" />
      <div className="gpu-packet packet-three" />
      <div className="gpu-packet packet-four" />

      <div className="gpu-core">

        <div className="gpu-core-ring" />

        <div className="gpu-core-inner">
          <Cpu size={30} />

          <strong>RTX 3050</strong>

          <span>INFERENCE CORE</span>
        </div>

      </div>

      <div className="gpu-floating gpu-top">
        <Activity size={13} />
        <span>CUDA ACTIVE</span>
      </div>

      <div className="gpu-floating gpu-bottom">
        <Zap size={13} />
        <span>{throughput.toFixed(2)} IMG/S</span>
      </div>

      <div className="gpu-side-stat gpu-left">
        <span>LATENCY</span>
        <strong>{latency.toFixed(2)} ms</strong>
      </div>

      <div className="gpu-side-stat gpu-right">
        <span>BATCH</span>
        <strong>16</strong>
      </div>

      <div className="gpu-pulse-counter">
        <span>INFERENCE CYCLES</span>
        <strong>{String(pulse + 1).padStart(3, '0')}</strong>
      </div>

    </div>
  )
}

function DataPipeline({ stages }) {
  return (
    <div className="pipeline-visual">

      <div className="pipeline-line" />

      {stages.map((stage, index) => (
        <div
          className="pipeline-node"
          key={stage.key}
          style={{
            '--node-color': stage.color,
            animationDelay: `${index * 0.22}s`,
          }}
        >
          <div className="pipeline-node-core">
            {index === 3 ? (
              <Cpu size={14} />
            ) : index === 0 || index === 6 ? (
              <Database size={13} />
            ) : (
              <Workflow size={13} />
            )}
          </div>

          <span>{stage.label}</span>

          {index < stages.length - 1 && (
            <ArrowRight className="pipeline-arrow" size={13} />
          )}
        </div>
      ))}

      <div className="pipeline-packet" />
    </div>
  )
}

function TelemetryCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div
      className="telemetry-card"
      style={{ '--telemetry-color': color }}
    >
      <div className="telemetry-icon">
        <Icon size={16} />
      </div>

      <span>{label}</span>

      <strong>{value}</strong>

      <small>{sub}</small>
    </div>
  )
}

export default function Benchmark() {

  const [animate, setAnimate] = useState(false)
  const [data, setData] = useState(null)

  useEffect(() => {
    const t = setTimeout(() => setAnimate(true), 200)

    fetch('/data/benchmark_result.json')
      .then(r => r.json())
      .then(j => setData(j))
      .catch(() => setData(null))

    return () => clearTimeout(t)
  }, [])

  const stages = data
    ? STAGES.map(s => ({
        ...s,
        ms:
          (data.stage_timings_mean_seconds_per_batch[s.key] || 0) *
          1000,
      }))
    : STAGES.map(s => ({
        ...s,
        ms: STATIC.stage_ms[s.key],
      }))

  const totalMs = stages.reduce((a, s) => a + s.ms, 0)

  const imagesPerSec = data
    ? data.throughput.images_per_second
    : STATIC.images_per_second

  const latencyMs = data
    ? data.throughput.mean_latency_ms_per_image
    : STATIC.mean_latency_ms

  const batchSize = data
    ? data.config.batch_size
    : STATIC.batch_size

  const gpu = data
    ? data.hardware.gpu
    : 'NVIDIA GeForce RTX 3050 Laptop GPU'

  const torchVer = data
    ? data.hardware.torch_version
    : '2.5.1+cu121'

  const cudaVer = data
    ? data.hardware.cuda_version
    : '12.1'

  const pythonVer = data
    ? data.hardware.python_version
    : '3.12.10'

  const modelMs =
    stages.find(s => s.key === 'model_execution')?.ms || 0

  const modelPercentage =
    totalMs > 0 ? ((modelMs / totalMs) * 100).toFixed(1) : '0.0'

  const saveMs =
    stages.find(s => s.key === 'save')?.ms || 0

  const savePercentage =
    totalMs > 0 ? ((saveMs / totalMs) * 100).toFixed(1) : '0.0'

  return (
    <main className="main-container benchmark-page">

      <style>{`

        /* =====================================================
           BENCHMARK PAGE
        ===================================================== */

        .benchmark-page {
          --bench-blue: #5d9eff;
          --bench-cyan: #00ffcc;
          --bench-purple: #a78bfa;
          --bench-green: #39e58c;
          --bench-orange: #ffa94d;
          --bench-bg: #030712;
          position: relative;
          overflow: hidden;
        }

        .benchmark-page::before {
          content: "";
          position: fixed;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(
              circle at 78% 12%,
              rgba(93,158,255,.075),
              transparent 30%
            ),
            radial-gradient(
              circle at 12% 58%,
              rgba(167,139,250,.045),
              transparent 28%
            );
          z-index: 0;
        }

        .benchmark-page > * {
          position: relative;
          z-index: 1;
        }

        /* =====================================================
           HERO
        ===================================================== */

        .bench-hero-system {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 18px;
          color: #42536c;
          font-family: monospace;
          font-size: 9px;
          letter-spacing: .12em;
        }

        .bench-live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #39e58c;
          box-shadow: 0 0 12px #39e58c;
          animation: bench-live 1.4s ease-in-out infinite;
        }

        @keyframes bench-live {
          0%,100% {
            opacity: .35;
            transform: scale(.8);
          }
          50% {
            opacity: 1;
            transform: scale(1.25);
          }
        }

        /* =====================================================
           GPU VISUAL
        ===================================================== */

        .gpu-visual {
          position: relative;
          height: 390px;
          margin: 25px 0 60px;
          border: 1px solid rgba(93,158,255,.13);
          border-radius: 22px;
          overflow: hidden;
          background:
            radial-gradient(
              circle at 50% 50%,
              rgba(93,158,255,.09),
              transparent 30%
            ),
            linear-gradient(
              145deg,
              rgba(10,18,34,.92),
              rgba(3,7,18,.98)
            );
          box-shadow:
            inset 0 0 80px rgba(0,0,0,.35),
            0 30px 90px rgba(0,0,0,.2);
        }

        .gpu-grid {
          position: absolute;
          inset: 0;
          opacity: .18;
          background-image:
            linear-gradient(
              rgba(93,158,255,.08) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(93,158,255,.08) 1px,
              transparent 1px
            );
          background-size: 35px 35px;
          animation: gpu-grid-move 12s linear infinite;
        }

        @keyframes gpu-grid-move {
          from {
            transform: translate(0,0);
          }
          to {
            transform: translate(35px,35px);
          }
        }

        .gpu-scanline {
          position: absolute;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(93,158,255,.55),
            transparent
          );
          box-shadow: 0 0 15px rgba(93,158,255,.5);
          animation: gpu-scan 4s linear infinite;
        }

        @keyframes gpu-scan {
          from {
            top: -5%;
          }
          to {
            top: 105%;
          }
        }

        .gpu-orbit {
          position: absolute;
          left: 50%;
          top: 50%;
          border: 1px dashed rgba(93,158,255,.13);
          border-radius: 50%;
          transform: translate(-50%,-50%);
        }

        .gpu-orbit-one {
          width: 190px;
          height: 190px;
          animation: gpu-spin 10s linear infinite;
        }

        .gpu-orbit-two {
          width: 290px;
          height: 290px;
          border-color: rgba(167,139,250,.11);
          animation: gpu-spin-reverse 15s linear infinite;
        }

        .gpu-orbit-three {
          width: 390px;
          height: 390px;
          border-color: rgba(0,255,204,.07);
          animation: gpu-spin 22s linear infinite;
        }

        @keyframes gpu-spin {
          to {
            transform: translate(-50%,-50%) rotate(360deg);
          }
        }

        @keyframes gpu-spin-reverse {
          to {
            transform: translate(-50%,-50%) rotate(-360deg);
          }
        }

        .gpu-core {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 145px;
          height: 145px;
          transform: translate(-50%,-50%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            radial-gradient(
              circle,
              rgba(93,158,255,.18),
              rgba(3,7,18,.96) 68%
            );
          box-shadow:
            0 0 70px rgba(93,158,255,.13),
            inset 0 0 35px rgba(93,158,255,.08);
        }

        .gpu-core-ring {
          position: absolute;
          inset: -8px;
          border: 1px solid rgba(93,158,255,.3);
          border-radius: 50%;
          border-top-color: #5d9eff;
          animation: gpu-spin 4s linear infinite;
        }

        .gpu-core-inner {
          width: 105px;
          height: 105px;
          border-radius: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 6px;
          color: #6eb0ff;
          border: 1px solid rgba(93,158,255,.2);
          background: rgba(5,11,22,.9);
          box-shadow: inset 0 0 30px rgba(93,158,255,.06);
        }

        .gpu-core-inner strong {
          color: #dceaff;
          font-family: "Space Grotesk",sans-serif;
          font-size: 15px;
        }

        .gpu-core-inner span {
          color: #4b617e;
          font-family: monospace;
          font-size: 7px;
          letter-spacing: .13em;
        }

        .gpu-packet {
          position: absolute;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #5d9eff;
          box-shadow: 0 0 14px #5d9eff;
        }

        .packet-one {
          left: 12%;
          top: 35%;
          animation: packet-one 3.2s linear infinite;
        }

        .packet-two {
          right: 13%;
          top: 65%;
          background: #a78bfa;
          box-shadow: 0 0 14px #a78bfa;
          animation: packet-two 3.8s linear infinite;
        }

        .packet-three {
          left: 28%;
          bottom: 18%;
          background: #00ffcc;
          box-shadow: 0 0 14px #00ffcc;
          animation: packet-three 3.5s linear infinite;
        }

        .packet-four {
          right: 28%;
          top: 18%;
          background: #ffa94d;
          box-shadow: 0 0 14px #ffa94d;
          animation: packet-four 4.1s linear infinite;
        }

        @keyframes packet-one {
          0% { transform: translate(0,0); opacity: 0; }
          15% { opacity: 1; }
          70% { transform: translate(250px,80px); opacity: 1; }
          100% { transform: translate(300px,90px); opacity: 0; }
        }

        @keyframes packet-two {
          0% { transform: translate(0,0); opacity: 0; }
          15% { opacity: 1; }
          70% { transform: translate(-220px,-100px); opacity: 1; }
          100% { transform: translate(-270px,-120px); opacity: 0; }
        }

        @keyframes packet-three {
          0% { transform: translate(0,0); opacity: 0; }
          20% { opacity: 1; }
          75% { transform: translate(120px,-160px); opacity: 1; }
          100% { transform: translate(145px,-180px); opacity: 0; }
        }

        @keyframes packet-four {
          0% { transform: translate(0,0); opacity: 0; }
          20% { opacity: 1; }
          75% { transform: translate(-120px,160px); opacity: 1; }
          100% { transform: translate(-145px,180px); opacity: 0; }
        }

        .gpu-floating {
          position: absolute;
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 8px 11px;
          border: 1px solid rgba(93,158,255,.14);
          border-radius: 8px;
          background: rgba(3,7,18,.72);
          backdrop-filter: blur(8px);
          color: #5d9eff;
          font-family: monospace;
          font-size: 8px;
          letter-spacing: .1em;
        }

        .gpu-top {
          top: 24px;
          left: 24px;
        }

        .gpu-bottom {
          right: 24px;
          bottom: 24px;
          color: #00ffcc;
          border-color: rgba(0,255,204,.13);
        }

        .gpu-side-stat {
          position: absolute;
          top: 50%;
          padding: 11px 13px;
          border: 1px solid rgba(255,255,255,.07);
          background: rgba(3,7,18,.65);
          border-radius: 9px;
          transform: translateY(-50%);
        }

        .gpu-side-stat span,
        .gpu-pulse-counter span {
          display: block;
          color: #3d4d60;
          font-size: 7px;
          font-weight: 800;
          letter-spacing: .12em;
        }

        .gpu-side-stat strong {
          display: block;
          margin-top: 5px;
          color: #a9bbd2;
          font-family: monospace;
          font-size: 11px;
        }

        .gpu-left {
          left: 24px;
        }

        .gpu-right {
          right: 24px;
        }

        .gpu-pulse-counter {
          position: absolute;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          text-align: center;
        }

        .gpu-pulse-counter strong {
          color: #5d9eff;
          font-family: monospace;
          font-size: 10px;
        }

        /* =====================================================
           PIPELINE
        ===================================================== */

        .pipeline-visual {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 5px;
          padding: 25px 12px;
          margin-bottom: 30px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,.055);
          border-radius: 15px;
          background: rgba(255,255,255,.012);
        }

        .pipeline-line {
          position: absolute;
          left: 7%;
          right: 7%;
          top: 43px;
          height: 1px;
          background: linear-gradient(
            90deg,
            rgba(255,169,77,.15),
            rgba(93,158,255,.35),
            rgba(0,255,204,.15)
          );
        }

        .pipeline-node {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          color: #596579;
          font-size: 7px;
          font-weight: 800;
          letter-spacing: .07em;
          text-align: center;
          animation: pipeline-node-in .6s ease both;
        }

        @keyframes pipeline-node-in {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .pipeline-node-core {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          border: 1px solid color-mix(
            in srgb,
            var(--node-color) 35%,
            transparent
          );
          background: rgba(3,7,18,.95);
          color: var(--node-color);
          box-shadow: 0 0 20px color-mix(
            in srgb,
            var(--node-color) 12%,
            transparent
          );
        }

        .pipeline-node:nth-child(5) .pipeline-node-core {
          box-shadow:
            0 0 22px rgba(93,158,255,.24),
            inset 0 0 20px rgba(93,158,255,.08);
          animation: pipeline-core-pulse 1.5s ease-in-out infinite;
        }

        @keyframes pipeline-core-pulse {
          0%,100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }

        .pipeline-arrow {
          position: absolute;
          right: -16px;
          top: 13px;
          color: #253348;
        }

        .pipeline-packet {
          position: absolute;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #5d9eff;
          box-shadow: 0 0 12px #5d9eff;
          top: 41px;
          left: 7%;
          animation: pipeline-packet 3.5s linear infinite;
        }

        @keyframes pipeline-packet {
          0% {
            left: 7%;
            opacity: 0;
          }
          8% {
            opacity: 1;
          }
          92% {
            opacity: 1;
          }
          100% {
            left: 93%;
            opacity: 0;
          }
        }

        /* =====================================================
           STAGES
        ===================================================== */

        .bench-stage {
          margin-bottom: 17px;
        }

        .bench-stage-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 7px;
        }

        .bench-stage-name {
          display: flex;
          align-items: center;
          gap: 9px;
          color: #8490a2;
          font-size: 11px;
          font-weight: 600;
        }

        .bench-stage-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .bench-stage-values {
          display: flex;
          gap: 17px;
          font-family: monospace;
          font-size: 10px;
        }

        .bench-stage-values span:last-child {
          width: 43px;
          text-align: right;
          color: #3d4d60;
        }

        .bench-stage-track {
          height: 8px;
          border-radius: 4px;
          overflow: hidden;
          background: rgba(255,255,255,.045);
        }

        .bench-stage-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 1.3s cubic-bezier(.16,1,.3,1);
        }

        /* =====================================================
           TELEMETRY
        ===================================================== */

        .telemetry-grid {
          display: grid;
          grid-template-columns: repeat(4,1fr);
          gap: 10px;
        }

        .telemetry-card {
          position: relative;
          overflow: hidden;
          padding: 18px;
          min-height: 145px;
          border: 1px solid rgba(255,255,255,.055);
          border-radius: 14px;
          background:
            linear-gradient(
              145deg,
              rgba(15,23,42,.68),
              rgba(3,7,18,.9)
            );
          transition:
            transform .3s ease,
            border-color .3s ease,
            box-shadow .3s ease;
        }

        .telemetry-card::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            120deg,
            transparent 20%,
            rgba(255,255,255,.04),
            transparent 80%
          );
          transform: translateX(-120%);
          transition: transform .65s ease;
        }

        .telemetry-card:hover {
          transform: translateY(-5px);
          border-color: color-mix(
            in srgb,
            var(--telemetry-color) 30%,
            transparent
          );
          box-shadow:
            0 20px 45px rgba(0,0,0,.2);
        }

        .telemetry-card:hover::after {
          transform: translateX(120%);
        }

        .telemetry-icon {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          color: var(--telemetry-color);
          background: color-mix(
            in srgb,
            var(--telemetry-color) 8%,
            transparent
          );
          border: 1px solid color-mix(
            in srgb,
            var(--telemetry-color) 15%,
            transparent
          );
          margin-bottom: 15px;
        }

        .telemetry-card > span {
          display: block;
          color: #475569;
          font-size: 7px;
          font-weight: 800;
          letter-spacing: .13em;
        }

        .telemetry-card strong {
          display: block;
          margin-top: 7px;
          color: #dbe7f5;
          font-family: "Space Grotesk",sans-serif;
          font-size: 17px;
        }

        .telemetry-card small {
          display: block;
          margin-top: 5px;
          color: #39485d;
          font-size: 8px;
        }

        /* =====================================================
           EXECUTION DOMINANCE
        ===================================================== */

        .execution-panel {
          display: grid;
          grid-template-columns: 1.15fr .85fr;
          gap: 30px;
          align-items: center;
          padding: 28px;
          border: 1px solid rgba(93,158,255,.12);
          border-radius: 17px;
          background:
            radial-gradient(
              circle at 80% 30%,
              rgba(93,158,255,.07),
              transparent 30%
            ),
            rgba(255,255,255,.012);
        }

        .execution-copy h3 {
          margin: 0;
          color: #edf4ff;
          font-family: "Space Grotesk",sans-serif;
          font-size: 25px;
          letter-spacing: -.035em;
        }

        .execution-copy p {
          max-width: 620px;
          margin: 13px 0 0;
          color: #596579;
          font-size: 11px;
          line-height: 1.8;
        }

        .execution-stat {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 190px;
          height: 190px;
          margin: auto;
          border-radius: 50%;
          background:
            conic-gradient(
              #5d9eff ${modelPercentage}%,
              rgba(255,255,255,.035) ${modelPercentage}% 100%
            );
          box-shadow:
            0 0 55px rgba(93,158,255,.1);
        }

        .execution-stat::before {
          content: "";
          position: absolute;
          inset: 10px;
          border-radius: 50%;
          background: #060c18;
        }

        .execution-stat-content {
          position: relative;
          text-align: center;
        }

        .execution-stat-content strong {
          display: block;
          color: #dceaff;
          font-family: "Space Grotesk",sans-serif;
          font-size: 36px;
          letter-spacing: -.05em;
        }

        .execution-stat-content span {
          display: block;
          margin-top: 5px;
          color: #536b89;
          font-family: monospace;
          font-size: 8px;
          letter-spacing: .1em;
        }

        /* =====================================================
           BENCHMARK RUN
        ===================================================== */

        .run-terminal {
          border: 1px solid rgba(57,229,140,.12);
          border-radius: 14px;
          overflow: hidden;
          background: #02050a;
          box-shadow: inset 0 0 50px rgba(0,0,0,.3);
        }

        .run-terminal-head {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 11px 14px;
          border-bottom: 1px solid rgba(255,255,255,.05);
          background: rgba(255,255,255,.018);
        }

        .terminal-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }

        .run-terminal-title {
          margin-left: 5px;
          color: #475569;
          font-family: monospace;
          font-size: 8px;
          letter-spacing: .1em;
        }

        .run-terminal-body {
          padding: 18px;
          font-family: monospace;
          font-size: 10px;
          line-height: 2;
        }

        .terminal-line {
          display: flex;
          gap: 10px;
        }

        .terminal-time {
          color: #26384e;
        }

        .terminal-command {
          color: #59718e;
        }

        .terminal-success {
          color: #39e58c;
        }

        .terminal-blue {
          color: #5d9eff;
        }

        /* =====================================================
           RESPONSIVE
        ===================================================== */

        @media (max-width: 900px) {

          .telemetry-grid {
            grid-template-columns: repeat(2,1fr);
          }

          .execution-panel {
            grid-template-columns: 1fr;
          }

          .pipeline-visual {
            overflow-x: auto;
            justify-content: flex-start;
            padding-left: 20px;
            padding-right: 20px;
          }

          .pipeline-node {
            min-width: 90px;
          }

          .pipeline-line {
            left: 40px;
            width: 650px;
            right: auto;
          }

          .pipeline-packet {
            display: none;
          }

        }

        @media (max-width: 650px) {

          .gpu-visual {
            height: 330px;
          }

          .gpu-orbit-three {
            width: 300px;
            height: 300px;
          }

          .gpu-orbit-two {
            width: 235px;
            height: 235px;
          }

          .gpu-orbit-one {
            width: 160px;
            height: 160px;
          }

          .gpu-left,
          .gpu-right {
            display: none;
          }

          .gpu-core {
            width: 125px;
            height: 125px;
          }

          .gpu-core-inner {
            width: 92px;
            height: 92px;
          }

          .telemetry-grid {
            grid-template-columns: 1fr 1fr;
          }

          .execution-stat {
            width: 155px;
            height: 155px;
          }

          .execution-stat-content strong {
            font-size: 29px;
          }

        }

        @media (max-width: 430px) {

          .telemetry-grid {
            grid-template-columns: 1fr;
          }

          .gpu-top {
            top: 15px;
            left: 15px;
          }

          .gpu-bottom {
            right: 15px;
            bottom: 15px;
          }

          .gpu-pulse-counter {
            display: none;
          }

        }

        @media (prefers-reduced-motion: reduce) {

          .benchmark-page *,
          .benchmark-page *::before,
          .benchmark-page *::after {
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: .01ms !important;
          }

        }

      `}</style>


      {/* =====================================================
          HERO
      ===================================================== */}

      <section
        className="hero"
        style={{
          marginBottom: 30,
          position: 'relative',
        }}
      >

        <div className="eyebrow">
          <Cpu size={14} />
          PERFORMANCE BENCHMARK
        </div>

        <h1>
          End-to-End
          <br />
          <span>Throughput Analysis</span>
        </h1>

        <p>
          Complete inference profiling across the DARC-Net pipeline:
          disk reading → preprocessing → CPU-to-GPU transfer →
          model execution → GPU-to-CPU transfer → postprocessing →
          output persistence.
        </p>

        <div className="bench-hero-system">
          <span className="bench-live-dot" />
          BENCHMARK PROFILE · RTX 3050 · CUDA · 30 TIMED BATCHES
        </div>

      </section>


      {/* =====================================================
          GPU INFERENCE VISUAL
      ===================================================== */}

      <GpuCore
        throughput={imagesPerSec}
        latency={latencyMs}
      />


      {/* =====================================================
          H100 DISCLAIMER
      ===================================================== */}

      <div
        className="panel"
        style={{
          marginBottom: 40,
          padding: '16px 20px',
          borderColor: 'rgba(255,169,77,0.25)',
          background: 'rgba(255,169,77,0.04)',
        }}
      >

        <div
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
          }}
        >

          <AlertTriangle
            size={16}
            style={{
              color: '#ffa94d',
              flexShrink: 0,
              marginTop: 2,
            }}
          />

          <p
            style={{
              margin: 0,
              color: '#8490a2',
              fontSize: 12,
              lineHeight: 1.8,
            }}
          >

            <strong style={{ color: '#ffa94d' }}>
              Development Hardware Benchmark
            </strong>{' '}
            — all numbers below are measured on an
            NVIDIA GeForce RTX 3050 Laptop GPU (4 GB VRAM).
            KLA will benchmark shortlisted submissions on a common{' '}
            <strong style={{ color: '#c8d4e8' }}>
              NVIDIA H100
            </strong>.
            These results should therefore be interpreted as the
            measured local development performance, not H100 performance.

          </p>

        </div>

      </div>


      {/* =====================================================
          TOP STATS
      ===================================================== */}

      <section style={{ marginBottom: 60 }}>

        <div className="section-heading">

          <div>
            <span className="panel-label">
              01 // THROUGHPUT
            </span>

            <h2>
              Pipeline Performance
            </h2>
          </div>

          <span className="benchmark-note">
            batch_size = {batchSize}
          </span>

        </div>


        <div className="benchmark-grid">

          <div className="benchmark-card">

            <span>
              THROUGHPUT
            </span>

            <strong>
              <AnimatedNumber
                value={imagesPerSec}
                decimals={2}
              />
            </strong>

            <small>
              images / sec
            </small>

          </div>


          <div className="benchmark-card">

            <span>
              LATENCY / IMAGE
            </span>

            <strong>
              <AnimatedNumber
                value={latencyMs}
                decimals={2}
              />
            </strong>

            <small>
              ms · end-to-end
            </small>

          </div>


          <div className="benchmark-card">

            <span>
              BATCH SIZE
            </span>

            <strong>
              {batchSize}
            </strong>

            <small>
              images per batch
            </small>

          </div>

        </div>

      </section>


      {/* =====================================================
          DATA PIPELINE VISUAL
      ===================================================== */}

      <section style={{ marginBottom: 60 }}>

        <div className="section-heading">

          <div>

            <span className="panel-label">
              02 // INFERENCE PIPELINE
            </span>

            <h2>
              How One Batch Moves
            </h2>

          </div>

          <span className="benchmark-note">
            END-TO-END EXECUTION
          </span>

        </div>

        <DataPipeline stages={stages} />

      </section>


      {/* =====================================================
          STAGE BREAKDOWN
      ===================================================== */}

      <section style={{ marginBottom: 60 }}>

        <div className="section-heading">

          <div>

            <span className="panel-label">
              03 // STAGE BREAKDOWN
            </span>

            <h2>
              Where Time Goes
            </h2>

          </div>

          <span className="benchmark-note">
            Mean per batch · {totalMs.toFixed(1)} ms total
          </span>

        </div>


        <div
          className="panel"
          style={{
            padding: '28px 28px',
          }}
        >

          {stages.map(s => (

            <StageBar
              key={s.key}
              label={s.label}
              ms={s.ms}
              total={totalMs}
              color={s.color}
              animate={animate}
            />

          ))}


          <div
            style={{
              borderTop:
                '1px solid rgba(255,255,255,0.06)',
              paddingTop: 14,
              marginTop: 14,
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >

            <span
              style={{
                color: '#667085',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.1em',
              }}
            >
              TOTAL · MEAN PER BATCH
            </span>

            <span
              style={{
                color: '#e7ebf2',
                fontSize: 11,
                fontFamily: 'monospace',
                fontWeight: 700,
              }}
            >
              {totalMs.toFixed(2)} ms
            </span>

          </div>

        </div>


        <p
          style={{
            color: '#596579',
            fontSize: 11,
            marginTop: 12,
            lineHeight: 1.7,
          }}
        >

          Model execution dominates at approximately{' '}
          <strong style={{ color: '#5d9eff' }}>
            {modelPercentage}%
          </strong>{' '}
          of total pipeline time. File saving contributes approximately{' '}
          <strong style={{ color: '#ffa94d' }}>
            {savePercentage}%
          </strong>.
          Disk and CPU↔GPU transfer costs remain comparatively small,
          indicating that the current pipeline is primarily compute-bound
          rather than transfer-bound.

        </p>

      </section>


      {/* =====================================================
          EXECUTION DOMINANCE
      ===================================================== */}

      <section style={{ marginBottom: 60 }}>

        <div className="section-heading">

          <div>

            <span className="panel-label">
              04 // COMPUTE PROFILE
            </span>

            <h2>
              DARC-Net Execution Cost
            </h2>

          </div>

        </div>


        <div className="execution-panel">

          <div className="execution-copy">

            <h3>
              The GPU is doing the heavy lifting.
            </h3>

            <p>
              The profiling results show that the DARC-Net forward pass
              is the dominant computational stage. This is expected:
              the network performs degradation-aware feature extraction,
              eight DARC residual blocks, FiLM conditioning and learned
              2× super-resolution before reconstruction.
            </p>

            <div
              style={{
                display: 'flex',
                gap: 10,
                flexWrap: 'wrap',
                marginTop: 20,
              }}
            >

              <div
                style={{
                  padding: '8px 11px',
                  borderRadius: 7,
                  border:
                    '1px solid rgba(93,158,255,.15)',
                  background:
                    'rgba(93,158,255,.035)',
                  color: '#6da9ff',
                  fontFamily: 'monospace',
                  fontSize: 8,
                }}
              >
                {modelMs.toFixed(2)} ms MODEL
              </div>

              <div
                style={{
                  padding: '8px 11px',
                  borderRadius: 7,
                  border:
                    '1px solid rgba(167,139,250,.15)',
                  background:
                    'rgba(167,139,250,.035)',
                  color: '#aa95ee',
                  fontFamily: 'monospace',
                  fontSize: 8,
                }}
              >
                CUDA ACCELERATED
              </div>

              <div
                style={{
                  padding: '8px 11px',
                  borderRadius: 7,
                  border:
                    '1px solid rgba(57,229,140,.15)',
                  background:
                    'rgba(57,229,140,.035)',
                  color: '#55d996',
                  fontFamily: 'monospace',
                  fontSize: 8,
                }}
              >
                COMPUTE BOUND
              </div>

            </div>

          </div>


          <div className="execution-stat">

            <div className="execution-stat-content">

              <strong>
                {modelPercentage}%
              </strong>

              <span>
                TOTAL TIME
              </span>

              <span>
                DARC-NET
              </span>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          BENCHMARK RUN TERMINAL
      ===================================================== */}

      <section style={{ marginBottom: 60 }}>

        <div className="section-heading">

          <div>

            <span className="panel-label">
              05 // BENCHMARK RUN
            </span>

            <h2>
              Measurement Trace
            </h2>

          </div>

          <span className="benchmark-note">
            5 WARMUP · 30 TIMED BATCHES
          </span>

        </div>


        <div className="run-terminal">

          <div className="run-terminal-head">

            <span
              className="terminal-dot"
              style={{ background: '#ff6b6b' }}
            />

            <span
              className="terminal-dot"
              style={{ background: '#ffa94d' }}
            />

            <span
              className="terminal-dot"
              style={{ background: '#39e58c' }}
            />

            <span className="run-terminal-title">
              darc-net / benchmark / inference-profile
            </span>

          </div>


          <div className="run-terminal-body">

            <div className="terminal-line">
              <span className="terminal-time">
                [00.00]
              </span>

              <span className="terminal-command">
                Initializing CUDA runtime...
              </span>
            </div>


            <div className="terminal-line">
              <span className="terminal-time">
                [00.18]
              </span>

              <span className="terminal-blue">
                GPU detected:
              </span>

              <span className="terminal-command">
                RTX 3050 Laptop GPU
              </span>
            </div>


            <div className="terminal-line">
              <span className="terminal-time">
                [00.31]
              </span>

              <span className="terminal-command">
                Loading DARC-Net checkpoint...
              </span>
            </div>


            <div className="terminal-line">
              <span className="terminal-time">
                [01.02]
              </span>

              <span className="terminal-success">
                ✓ Model ready · 892,577 parameters
              </span>
            </div>


            <div className="terminal-line">
              <span className="terminal-time">
                [01.04]
              </span>

              <span className="terminal-command">
                Warmup batches: 5
              </span>
            </div>


            <div className="terminal-line">
              <span className="terminal-time">
                [04.87]
              </span>

              <span className="terminal-command">
                Timed batches: 30
              </span>
            </div>


            <div className="terminal-line">
              <span className="terminal-time">
                [12.94]
              </span>

              <span className="terminal-blue">
                Throughput:
              </span>

              <span className="terminal-success">
                {imagesPerSec.toFixed(2)} images/sec
              </span>
            </div>


            <div className="terminal-line">
              <span className="terminal-time">
                [12.95]
              </span>

              <span className="terminal-blue">
                Mean latency:
              </span>

              <span className="terminal-success">
                {latencyMs.toFixed(2)} ms/image
              </span>
            </div>


            <div className="terminal-line">
              <span className="terminal-time">
                [12.96]
              </span>

              <span className="terminal-success">
                ✓ Benchmark complete
              </span>
            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          HARDWARE INFO
      ===================================================== */}

      <section style={{ marginBottom: 40 }}>

        <div className="section-heading">

          <div>

            <span className="panel-label">
              06 // ENVIRONMENT
            </span>

            <h2>
              Hardware & Software
            </h2>

          </div>

        </div>


        <div className="telemetry-grid">

          <TelemetryCard
            icon={Cpu}
            label="GPU"
            value="RTX 3050"
            sub="4 GB Laptop GPU"
            color="#5d9eff"
          />

          <TelemetryCard
            icon={MemoryStick}
            label="VRAM"
            value="4 GB"
            sub="Dedicated GPU memory"
            color="#a78bfa"
          />

          <TelemetryCard
            icon={Zap}
            label="CUDA"
            value={cudaVer}
            sub="CUDA runtime"
            color="#00ffcc"
          />

          <TelemetryCard
            icon={Layers}
            label="PYTORCH"
            value={torchVer}
            sub="Deep learning runtime"
            color="#ffa94d"
          />

          <TelemetryCard
            icon={Terminal}
            label="PYTHON"
            value={pythonVer}
            sub="Execution environment"
            color="#f7c948"
          />

          <TelemetryCard
            icon={Server}
            label="BATCH SIZE"
            value={String(batchSize)}
            sub="Images per batch"
            color="#39e58c"
          />

          <TelemetryCard
            icon={Timer}
            label="WARMUP"
            value="5"
            sub="Excluded from timing"
            color="#a78bfa"
          />

          <TelemetryCard
            icon={Gauge}
            label="TIMED RUN"
            value="30"
            sub="Measured batches"
            color="#5d9eff"
          />

        </div>

      </section>


      {/* =====================================================
          TIMING METHOD
      ===================================================== */}

      <section style={{ marginBottom: 40 }}>

        <div
          className="panel"
          style={{
            padding: '22px 24px',
            borderColor: 'rgba(0,255,204,.10)',
            background:
              'linear-gradient(120deg, rgba(0,255,204,.025), rgba(3,7,18,.9))',
          }}
        >

          <div
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'flex-start',
            }}
          >

            <CheckCircle2
              size={17}
              color="#39e58c"
              style={{
                flexShrink: 0,
                marginTop: 2,
              }}
            />

            <div>

              <div
                style={{
                  color: '#6dfff0',
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: '.16em',
                }}
              >
                MEASUREMENT INTEGRITY
              </div>

              <p
                style={{
                  margin: '8px 0 0',
                  color: '#596579',
                  fontSize: 11,
                  lineHeight: 1.8,
                }}
              >
                GPU timing uses{' '}
                <code style={{ color: '#8abaff' }}>
                  torch.cuda.synchronize()
                </code>{' '}
                to ensure asynchronous CUDA operations are completed
                before timing boundaries are recorded. Five warmup
                batches are excluded, followed by 30 timed batches
                used to calculate the reported mean throughput and latency.
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <div
        style={{
          height: 1,
          background:
            'linear-gradient(90deg, transparent, rgba(93,158,255,.2), rgba(0,255,204,.15), transparent)',
          marginTop: 65,
        }}
      />

      <footer
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 20,
          paddingTop: 22,
          color: '#334155',
          fontSize: 9,
          letterSpacing: '.12em',
        }}
      >

        <span>
          DARC-NET · PERFORMANCE PROFILING
        </span>

        <span>
          RTX 3050 · CUDA · 2026
        </span>

      </footer>

    </main>
  )
}
