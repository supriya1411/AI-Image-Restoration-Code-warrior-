import {
  Layers,
  Zap,
  GitBranch,
  ArrowDown,
  ArrowRight,
  Cpu,
  Activity,
  ShieldCheck,
  Gauge,
  Network,
  Binary,
  ScanLine,
  Workflow,
  Sparkles,
  CircuitBoard,
  Database,
  Boxes,
  BrainCircuit,
  Waves,
} from 'lucide-react'

const BLOCKS = [
  {
    id: 'input',
    number: '01',
    label: 'INPUT',
    sub: '1 × 128 × 128  ·  float32  ·  NoisyLR',
    color: '#ff6b6b',
    icon: ScanLine,
    note: 'Values in roughly [-0.28, 2.16] — not clipped to [0,1]. The original sensor dynamic range is preserved before restoration.',
  },
  {
    id: 'shallow',
    number: '02',
    label: 'SHALLOW FEATURE EXTRACTION',
    sub: 'Conv 3×3  ·  C = 64 channels',
    color: '#ffa94d',
    icon: Layers,
    note: 'Converts the raw single-channel input into a 64-channel feature representation F₀ for deeper restoration processing.',
  },
  {
    id: 'estimator',
    number: '03',
    label: 'NOISE & DEGRADATION ESTIMATOR',
    sub: 'Parallel encoder → Global Pool → FC → 32-D embedding',
    color: '#f7c948',
    icon: Activity,
    note: 'Estimates degradation strength. Evidence from the dataset indicates signal-dependent noise, with residual variance increasing with intensity.',
  },
  {
    id: 'trunk',
    number: '04',
    label: 'RESTORATION TRUNK',
    sub: 'N = 8 DARC Blocks  ·  Norm → Conv → DWConv → GELU → FiLM → Residual',
    color: '#a78bfa',
    icon: Network,
    note: 'Eight degradation-aware residual blocks process the feature representation while the noise embedding dynamically conditions feature processing.',
  },
  {
    id: 'upsample',
    number: '05',
    label: 'UPSAMPLER',
    sub: 'Conv 3×3 → GELU → Conv 3×3 → PixelShuffle ×2',
    color: '#5d9eff',
    icon: ArrowUpIcon,
    note: 'Learned 2× super-resolution converts the 128×128 feature representation into a 256×256 spatial grid.',
  },
  {
    id: 'residual',
    number: '06',
    label: 'GLOBAL RESIDUAL RECONSTRUCTION',
    sub: 'Bicubic(Input) + Learned Residual',
    color: '#39e58c',
    icon: GitBranch,
    note: 'The network predicts the correction rather than reconstructing everything from scratch. Bicubic interpolation provides a stable spatial baseline.',
  },
  {
    id: 'output',
    number: '07',
    label: 'RESTORED HR OUTPUT',
    sub: '1 × 256 × 256  ·  float32  ·  Restored HR',
    color: '#00ffcc',
    icon: ShieldCheck,
    note: 'Output is clipped to [0,1] for scoring and display. This is the final high-resolution reconstruction used by the validation pipeline.',
  },
]

const LOSSES = [
  {
    label: 'L_char',
    name: 'Charbonnier',
    weight: '1.0',
    formula: '√((X−Y)² + ε²)',
    desc: 'Robust pixel reconstruction loss that provides stable gradients while preserving accurate intensity reconstruction.',
    color: '#5d9eff',
  },
  {
    label: 'L_ssim',
    name: 'SSIM Loss',
    weight: '0.1  (λ₁)',
    formula: '1 − SSIM(X, Y)',
    desc: 'Encourages structural similarity and helps preserve the organization of semiconductor features.',
    color: '#a78bfa',
  },
  {
    label: 'L_grad',
    name: 'Gradient Loss',
    weight: '0.1  (λ₂)',
    formula: '‖∇X − ∇Y‖₁',
    desc: 'Explicitly penalizes gradient differences to preserve edges, boundaries and fine details.',
    color: '#39e58c',
  },
]

const SPECS = [
  ['Input Resolution', '1 × 128 × 128'],
  ['Output Resolution', '1 × 256 × 256'],
  ['Base Channels', '64'],
  ['DARC Blocks', '8'],
  ['Noise Embedding', '32 dimensions'],
  ['Trainable Parameters', '892,577'],
  ['Optimizer', 'AdamW'],
  ['Learning Rate', '2e-4'],
  ['Weight Decay', '1e-4'],
  ['Batch Size', '4'],
  ['Training Epochs', '10'],
  ['Validation Split', '12.5% · seed 42'],
  ['Augmentation', 'None'],
  ['Checkpoint', 'darc_losses_best.pth'],
]

function ArrowUpIcon(props) {
  return <ArrowRight {...props} />
}

/* =========================================================
   PARTICLE FIELD
========================================================= */

function CoreParticles() {
  const particles = Array.from({ length: 26 })

  return (
    <div className="core-particles" aria-hidden="true">
      {particles.map((_, index) => (
        <span
          key={index}
          className="core-particle"
          style={{
            '--i': index,
            '--angle': `${index * 13.846}deg`,
            '--delay': `${(index % 8) * 0.22}s`,
            '--distance': `${150 + (index % 5) * 32}px`,
            '--size': `${2 + (index % 3)}px`,
          }}
        />
      ))}
    </div>
  )
}

/* =========================================================
   CHIP TRACE
========================================================= */

function ChipTrace({ className = '' }) {
  return (
    <div className={`chip-trace ${className}`} aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </div>
  )
}

export default function Architecture() {
  return (
    <main className="arch-page">

      <style>{`

        /* =====================================================
           ROOT
        ===================================================== */

        .arch-page {
          --bg: #030712;
          --panel: rgba(9, 16, 29, 0.72);
          --panel-strong: rgba(12, 20, 36, 0.9);
          --line: rgba(148, 163, 184, 0.09);
          --muted: #64748b;
          --text: #e2e8f0;
          --blue: #5d9eff;

          position: relative;
          min-height: 100vh;
          overflow: hidden;
          padding: 0 0 100px;
          color: var(--text);

          background:
            radial-gradient(
              circle at 15% 5%,
              rgba(37,99,235,.13),
              transparent 28%
            ),
            radial-gradient(
              circle at 85% 18%,
              rgba(167,139,250,.10),
              transparent 25%
            ),
            radial-gradient(
              circle at 50% 70%,
              rgba(0,255,204,.045),
              transparent 30%
            ),
            #030712;

          font-family: Inter, system-ui, sans-serif;
        }

        .arch-page *,
        .arch-page *::before,
        .arch-page *::after {
          box-sizing: border-box;
        }

        /* =====================================================
           BACKGROUND GRID
        ===================================================== */

        .arch-page::before {
          content: "";
          position: fixed;
          inset: 0;
          pointer-events: none;
          opacity: .3;

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
              transparent 82%
            );

          z-index: 0;
        }

        .arch-page::after {
          content: "";
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;

          background:
            radial-gradient(
              circle at 50% 0%,
              rgba(93,158,255,.035),
              transparent 38%
            );
        }

        .arch-container {
          position: relative;
          z-index: 1;

          width: min(
            1180px,
            calc(100% - 40px)
          );

          margin: 0 auto;
        }

        /* =====================================================
           HERO
        ===================================================== */

        .arch-hero {
          min-height: 540px;

          display: grid;
          grid-template-columns: 1.15fr .85fr;

          align-items: center;
          gap: 70px;

          padding: 80px 0 55px;
        }

        .arch-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;

          padding: 7px 13px;

          border: 1px solid rgba(93,158,255,.25);
          border-radius: 999px;

          color: #7db5ff;

          background:
            linear-gradient(
              135deg,
              rgba(93,158,255,.08),
              rgba(0,255,204,.025)
            );

          box-shadow:
            0 0 25px rgba(93,158,255,.04);

          font-size: 10px;
          font-weight: 800;
          letter-spacing: .16em;

          animation:
            arch-fade .7s ease both,
            badge-pulse 4s ease-in-out infinite;
        }

        .arch-title {
          margin: 22px 0 20px;

          font-family:
            "Space Grotesk",
            system-ui,
            sans-serif;

          font-size:
            clamp(
              48px,
              7vw,
              82px
            );

          line-height: .92;
          letter-spacing: -.055em;
          font-weight: 750;
          color: #f8fafc;

          animation:
            arch-rise .8s ease .08s both;
        }

        .arch-title span {
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
            arch-gradient 5s ease infinite;
        }

        .arch-hero-copy {
          color: #64748b;
          max-width: 680px;

          font-size: 15px;
          line-height: 1.85;

          animation:
            arch-rise .8s ease .16s both;
        }

        .arch-hero-copy strong {
          color: #cbd5e1;
        }

        /* =====================================================
           HERO VISUAL
        ===================================================== */

        .arch-hero-visual {
          position: relative;

          height: 390px;

          display: flex;
          align-items: center;
          justify-content: center;

          animation:
            arch-rise .9s ease .2s both;
        }

        .core-scene {
          position: relative;

          width: 340px;
          height: 340px;

          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* ambient glow */

        .core-scene::before {
          content: "";
          position: absolute;

          width: 330px;
          height: 330px;

          border-radius: 50%;

          background:
            radial-gradient(
              circle,
              rgba(0,255,204,.09),
              rgba(93,158,255,.07) 35%,
              transparent 68%
            );

          filter: blur(14px);

          animation:
            core-glow 4s ease-in-out infinite;
        }

        /* =====================================================
           DARC CORE
        ===================================================== */

        .arch-core {
          position: relative;

          width: 230px;
          height: 230px;

          border:
            1px solid
            rgba(93,158,255,.34);

          border-radius: 50%;

          display: flex;
          align-items: center;
          justify-content: center;

          background:
            radial-gradient(
              circle,
              rgba(93,158,255,.17),
              rgba(3,7,18,.9) 62%
            );

          box-shadow:
            0 0 80px rgba(37,99,235,.14),
            0 0 130px rgba(0,255,204,.045),
            inset 0 0 50px rgba(93,158,255,.09);

          animation:
            arch-float 6s ease-in-out infinite;
        }

        .arch-core::before,
        .arch-core::after {
          content: "";
          position: absolute;

          border-radius: 50%;
          pointer-events: none;
        }

        .arch-core::before {
          inset: 20px;

          border:
            1px dashed
            rgba(93,158,255,.22);

          animation:
            arch-spin 20s linear infinite;
        }

        .arch-core::after {
          inset: -25px;

          border:
            1px dashed
            rgba(167,139,250,.15);

          animation:
            arch-spin-reverse 26s linear infinite;
        }

        /* =====================================================
           INNER CHIP
        ===================================================== */

        .arch-core-inner {
          position: relative;

          width: 105px;
          height: 105px;

          border-radius: 22px;

          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;

          border:
            1px solid
            rgba(0,255,204,.32);

          background:
            radial-gradient(
              circle at 50% 30%,
              rgba(0,255,204,.08),
              rgba(0,255,204,.025)
            );

          box-shadow:
            0 0 35px rgba(0,255,204,.10),
            inset 0 0 25px rgba(0,255,204,.04);

          z-index: 5;

          animation:
            chip-breathe 3s ease-in-out infinite;
        }

        .arch-core-inner::before {
          content: "";

          position: absolute;
          inset: 7px;

          border:
            1px solid
            rgba(0,255,204,.08);

          border-radius: 16px;

          pointer-events: none;
        }

        .arch-core-inner strong {
          color: #d9fff7;

          font-family:
            "Space Grotesk",
            sans-serif;

          font-size: 20px;
          letter-spacing: -.03em;
        }

        .arch-core-inner span {
          margin-top: 5px;

          color: #4c6c72;

          font-size: 8px;
          font-weight: 800;
          letter-spacing: .16em;
        }

        /* =====================================================
           CHIP CORNER PINS
        ===================================================== */

        .chip-pins {
          position: absolute;
          inset: -13px;

          pointer-events: none;
        }

        .chip-pin {
          position: absolute;

          width: 14px;
          height: 2px;

          background:
            linear-gradient(
              90deg,
              transparent,
              #00ffcc
            );

          box-shadow:
            0 0 8px rgba(0,255,204,.65);
        }

        .chip-pin:nth-child(1) {
          top: 25%;
          left: -12px;
        }

        .chip-pin:nth-child(2) {
          top: 45%;
          left: -12px;
        }

        .chip-pin:nth-child(3) {
          top: 65%;
          left: -12px;
        }

        .chip-pin:nth-child(4) {
          top: 25%;
          right: -12px;

          transform: rotate(180deg);
        }

        .chip-pin:nth-child(5) {
          top: 45%;
          right: -12px;

          transform: rotate(180deg);
        }

        .chip-pin:nth-child(6) {
          top: 65%;
          right: -12px;

          transform: rotate(180deg);
        }

        .chip-pin:nth-child(7) {
          top: -12px;
          left: 25%;

          transform:
            rotate(90deg);
        }

        .chip-pin:nth-child(8) {
          top: -12px;
          left: 65%;

          transform:
            rotate(90deg);
        }

        .chip-pin:nth-child(9) {
          bottom: -12px;
          left: 25%;

          transform:
            rotate(-90deg);
        }

        .chip-pin:nth-child(10) {
          bottom: -12px;
          left: 65%;

          transform:
            rotate(-90deg);
        }

        /* =====================================================
           ORBIT DOTS
        ===================================================== */

        .arch-orbit-dot {
          position: absolute;

          width: 8px;
          height: 8px;

          border-radius: 50%;

          background: #5d9eff;

          box-shadow:
            0 0 18px #5d9eff,
            0 0 35px rgba(93,158,255,.4);

          top: 7px;
          left: 50%;

          transform:
            translateX(-50%);

          animation:
            arch-orbit 5s linear infinite;

          transform-origin:
            0 108px;
        }

        .orbit-dot-two {
          position: absolute;

          width: 5px;
          height: 5px;

          border-radius: 50%;

          background: #00ffcc;

          box-shadow:
            0 0 15px #00ffcc;

          right: 15px;
          bottom: 42px;

          animation:
            orbit-small 4.5s linear infinite;
        }

        /* =====================================================
           PARTICLES
        ===================================================== */

        .core-particles {
          position: absolute;
          inset: 0;

          pointer-events: none;
          z-index: 3;
        }

        .core-particle {
          position: absolute;

          width: var(--size);
          height: var(--size);

          border-radius: 50%;

          background: #00ffcc;

          box-shadow:
            0 0 8px #00ffcc,
            0 0 18px rgba(0,255,204,.7);

          left: 50%;
          top: 50%;

          opacity: 0;

          animation:
            particle-out
            3.4s
            ease-out
            var(--delay)
            infinite;

          transform:
            rotate(var(--angle))
            translateX(0);
        }

        .core-particle:nth-child(3n) {
          background: #5d9eff;

          box-shadow:
            0 0 8px #5d9eff,
            0 0 18px rgba(93,158,255,.7);
        }

        .core-particle:nth-child(4n) {
          background: #a78bfa;

          box-shadow:
            0 0 8px #a78bfa,
            0 0 18px rgba(167,139,250,.7);
        }

        /* =====================================================
           TECH LABELS
        ===================================================== */

        .core-tech-label {
          position: absolute;

          padding: 7px 10px;

          border:
            1px solid
            rgba(93,158,255,.16);

          border-radius: 6px;

          background:
            rgba(3,7,18,.72);

          backdrop-filter: blur(10px);

          color: #61738d;

          font-family: monospace;

          font-size: 7px;
          font-weight: 800;
          letter-spacing: .12em;

          box-shadow:
            0 10px 30px rgba(0,0,0,.25);
        }

        .core-label-one {
          top: 20px;
          right: -4px;

          animation:
            label-float 4s ease-in-out infinite;
        }

        .core-label-two {
          bottom: 28px;
          left: -18px;

          animation:
            label-float 4s ease-in-out .7s infinite;
        }

        .core-label-three {
          top: 105px;
          left: -35px;

          animation:
            label-float 4s ease-in-out 1.2s infinite;
        }

        /* =====================================================
           CHIP TRACES
        ===================================================== */

        .chip-trace {
          position: absolute;

          width: 100px;
          height: 60px;

          pointer-events: none;
        }

        .chip-trace span {
          position: absolute;

          height: 1px;

          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(0,255,204,.6),
              transparent
            );

          box-shadow:
            0 0 7px rgba(0,255,204,.3);
        }

        .chip-trace span:nth-child(1) {
          width: 100px;
          top: 8px;
          left: 0;
        }

        .chip-trace span:nth-child(2) {
          width: 55px;
          top: 25px;
          left: 30px;
        }

        .chip-trace span:nth-child(3) {
          width: 75px;
          top: 42px;
          left: 5px;
        }

        .chip-trace span:nth-child(4) {
          width: 30px;
          top: 55px;
          left: 50px;
        }

        .chip-trace-left {
          left: -55px;
          top: 120px;
          transform: rotate(180deg);
        }

        .chip-trace-right {
          right: -55px;
          top: 130px;
        }

        .chip-trace-top {
          top: -35px;
          left: 120px;
          transform: rotate(90deg);
        }

        .chip-trace-bottom {
          bottom: -35px;
          left: 120px;
          transform: rotate(-90deg);
        }

        /* =====================================================
           HERO STATS
        ===================================================== */

        .arch-stat-strip {
          display: grid;

          grid-template-columns:
            repeat(3, 1fr);

          gap: 10px;

          margin-top: 30px;

          max-width: 570px;
        }

        .arch-stat {
          position: relative;
          overflow: hidden;

          padding: 13px 15px;

          border:
            1px solid
            var(--line);

          border-radius: 10px;

          background:
            rgba(255,255,255,.018);

          transition:
            transform .3s ease,
            border-color .3s ease,
            background .3s ease;
        }

        .arch-stat::before {
          content: "";

          position: absolute;

          left: 0;
          top: 0;

          width: 2px;
          height: 100%;

          background:
            linear-gradient(
              to bottom,
              #5d9eff,
              #00ffcc
            );

          opacity: .45;
        }

        .arch-stat:hover {
          transform:
            translateY(-4px);

          border-color:
            rgba(93,158,255,.22);

          background:
            rgba(93,158,255,.035);
        }

        .arch-stat span {
          display: block;

          color: #475569;

          font-size: 8px;
          font-weight: 800;
          letter-spacing: .14em;
        }

        .arch-stat strong {
          display: block;

          margin-top: 5px;

          color: #e2e8f0;

          font-family:
            "Space Grotesk",
            sans-serif;

          font-size: 15px;
        }

        /* =====================================================
           SECTION
        ===================================================== */

        .arch-section {
          margin-top: 82px;
        }

        .arch-section-heading {
          display: flex;

          align-items: flex-end;
          justify-content: space-between;

          gap: 30px;

          margin-bottom: 28px;
        }

        .arch-kicker {
          color: #5d9eff;

          font-size: 9px;
          font-weight: 800;
          letter-spacing: .2em;

          margin-bottom: 10px;
        }

        .arch-section-title {
          margin: 0;

          color: #f1f5f9;

          font-family:
            "Space Grotesk",
            sans-serif;

          font-size:
            clamp(
              27px,
              4vw,
              43px
            );

          letter-spacing: -.04em;
          line-height: 1;
        }

        .arch-section-desc {
          max-width: 470px;

          margin: 0;

          color: #475569;

          font-size: 12px;
          line-height: 1.75;

          text-align: right;
        }

        /* =====================================================
           FLOW
        ===================================================== */

        .arch-flow {
          position: relative;

          max-width: 900px;

          margin: 0 auto;
        }

        .arch-flow::before {
          content: "";

          position: absolute;

          top: 28px;
          bottom: 28px;

          left: 27px;

          width: 1px;

          background:
            linear-gradient(
              to bottom,
              rgba(93,158,255,.5),
              rgba(167,139,250,.25),
              rgba(0,255,204,.45)
            );

          box-shadow:
            0 0 10px rgba(93,158,255,.12);
        }

        .arch-flow-item {
          position: relative;

          display: grid;

          grid-template-columns:
            56px 1fr;

          gap: 18px;

          margin-bottom: 14px;

          animation:
            arch-rise .65s ease both;
        }

        .arch-flow-node {
          position: relative;
          z-index: 2;

          width: 56px;
          height: 56px;

          border-radius: 15px;

          display: flex;
          align-items: center;
          justify-content: center;

          background: #050b16;

          border: 1px solid;

          box-shadow:
            0 0 25px rgba(0,0,0,.25);

          transition:
            transform .3s ease,
            box-shadow .3s ease;
        }

        .arch-flow-item:hover .arch-flow-node {
          transform:
            scale(1.08)
            rotate(-3deg);

          box-shadow:
            0 0 35px rgba(93,158,255,.16);
        }

        .arch-flow-card {
          position: relative;
          overflow: hidden;

          padding: 20px 22px;

          border: 1px solid;

          border-radius: 15px;

          background:
            linear-gradient(
              145deg,
              rgba(15,23,42,.7),
              rgba(3,7,18,.88)
            );

          transition:
            transform .3s ease,
            border-color .3s ease,
            box-shadow .3s ease;
        }

        .arch-flow-card::after {
          content: "";

          position: absolute;
          inset: 0;

          background:
            linear-gradient(
              110deg,
              transparent 20%,
              rgba(255,255,255,.045) 50%,
              transparent 80%
            );

          transform:
            translateX(-120%);

          transition:
            transform .65s ease;

          pointer-events: none;
        }

        .arch-flow-card:hover {
          transform:
            translateX(6px);

          box-shadow:
            0 20px 50px rgba(0,0,0,.22);
        }

        .arch-flow-card:hover::after {
          transform:
            translateX(120%);
        }

        .arch-flow-top {
          display: flex;

          align-items: center;
          justify-content: space-between;

          gap: 12px;

          margin-bottom: 7px;
        }

        .arch-flow-label {
          font-size: 10px;
          font-weight: 850;
          letter-spacing: .14em;
        }

        .arch-flow-number {
          color: #334155;

          font-family: monospace;

          font-size: 9px;
        }

        .arch-flow-sub {
          color: #cbd5e1;

          font-family: monospace;

          font-size: 11px;
          line-height: 1.65;
        }

        .arch-flow-note {
          margin-top: 9px;

          max-width: 760px;

          color: #526176;

          font-size: 11px;
          line-height: 1.65;
        }

        .arch-mini-arrow {
          display: flex;

          justify-content: center;

          height: 16px;

          color: #253348;

          grid-column: 1;
        }

        /* =====================================================
           GRID PANELS
        ===================================================== */

        .arch-grid-2 {
          display: grid;

          grid-template-columns:
            1fr 1fr;

          gap: 18px;
        }

        .arch-panel {
          position: relative;
          overflow: hidden;

          padding: 26px;

          border:
            1px solid
            var(--line);

          border-radius: 17px;

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

        .arch-panel::before {
          content: "";

          position: absolute;

          top: 0;
          left: -100%;

          width: 60%;
          height: 1px;

          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(93,158,255,.7),
              transparent
            );

          transition:
            left .8s ease;
        }

        .arch-panel:hover::before {
          left: 140%;
        }

        .arch-panel:hover {
          transform:
            translateY(-4px);

          border-color:
            rgba(93,158,255,.2);

          box-shadow:
            0 24px 60px rgba(0,0,0,.25);
        }

        .arch-panel-label {
          display: flex;

          align-items: center;

          gap: 8px;

          color: #7daeff;

          font-size: 9px;
          font-weight: 850;
          letter-spacing: .16em;
        }

        /* =====================================================
           LAYERS
        ===================================================== */

        .arch-layer {
          display: flex;

          align-items: center;

          gap: 12px;

          padding: 11px 0;

          border-bottom:
            1px solid
            rgba(255,255,255,.045);

          transition:
            padding-left .25s ease;
        }

        .arch-layer:last-child {
          border-bottom: 0;
        }

        .arch-layer:hover {
          padding-left: 5px;
        }

        .arch-layer-dot {
          width: 6px;
          height: 6px;

          border-radius: 50%;

          background: #a78bfa;

          box-shadow:
            0 0 10px
            rgba(167,139,250,.45);

          flex-shrink: 0;
        }

        .arch-layer span {
          color: #94a3b8;

          font-family: monospace;

          font-size: 11px;
        }

        /* =====================================================
           FILM
        ===================================================== */

        .arch-film-visual {
          margin-top: 20px;

          padding: 20px;

          border-radius: 13px;

          border:
            1px solid
            rgba(93,158,255,.14);

          background:
            radial-gradient(
              circle at 50% 0%,
              rgba(93,158,255,.09),
              transparent 55%
            ),
            rgba(0,0,0,.22);
        }

        .arch-film-flow {
          display: flex;

          align-items: center;
          justify-content: center;

          gap: 10px;

          flex-wrap: wrap;
        }

        .arch-film-node {
          position: relative;

          padding: 10px 13px;

          border-radius: 8px;

          border:
            1px solid
            rgba(93,158,255,.2);

          background:
            rgba(93,158,255,.045);

          color: #9fc5ff;

          font-family: monospace;

          font-size: 10px;

          transition:
            transform .25s ease,
            background .25s ease;
        }

        .arch-film-node:hover {
          transform:
            translateY(-3px);

          background:
            rgba(93,158,255,.08);
        }

        .arch-code {
          margin-top: 14px;

          padding: 15px 17px;

          border-radius: 10px;

          border:
            1px solid
            rgba(93,158,255,.15);

          background:
            rgba(0,0,0,.28);

          color: #6da9ff;

          font-family:
            "JetBrains Mono",
            monospace;

          font-size: 10px;
          line-height: 1.9;

          overflow-x: auto;
        }

        /* =====================================================
           EQUATION
        ===================================================== */

        .arch-equation {
          position: relative;

          padding: 25px;

          border:
            1px solid
            rgba(255,255,255,.08);

          border-radius: 16px;

          background:
            rgba(255,255,255,.018);

          text-align: center;

          overflow: hidden;
        }

        .arch-equation::before {
          content: "";

          position: absolute;

          width: 300px;
          height: 300px;

          left: 50%;
          top: 50%;

          transform:
            translate(-50%, -50%);

          background:
            radial-gradient(
              circle,
              rgba(93,158,255,.07),
              transparent 65%
            );

          pointer-events: none;

          animation:
            equation-pulse 4s ease-in-out infinite;
        }

        .arch-equation-main {
          position: relative;

          color: #f1f5f9;

          font-family: monospace;

          font-size:
            clamp(
              14px,
              2vw,
              20px
            );

          font-weight: 700;
        }

        .arch-equation-sub {
          position: relative;

          margin-top: 9px;

          color: #475569;

          font-size: 9px;

          letter-spacing: .08em;
        }

        /* =====================================================
           LOSSES
        ===================================================== */

        .arch-loss-grid {
          display: grid;

          grid-template-columns:
            repeat(3, 1fr);

          gap: 14px;

          margin-top: 16px;
        }

        .arch-loss {
          position: relative;
          overflow: hidden;

          padding: 22px;

          border:
            1px solid
            var(--line);

          border-radius: 15px;

          background:
            rgba(255,255,255,.015);

          transition:
            transform .3s ease,
            border-color .3s ease,
            box-shadow .3s ease;
        }

        .arch-loss:hover {
          transform:
            translateY(-5px);

          box-shadow:
            0 20px 45px rgba(0,0,0,.22);
        }

        .arch-loss::before {
          content: "";

          position: absolute;

          top: 0;
          left: 0;

          width: 100%;
          height: 2px;

          background:
            var(--loss-color);

          box-shadow:
            0 0 18px
            var(--loss-color);
        }

        .arch-loss::after {
          content: "";

          position: absolute;

          width: 100px;
          height: 100px;

          right: -45px;
          bottom: -45px;

          border-radius: 50%;

          background:
            radial-gradient(
              circle,
              var(--loss-color),
              transparent 70%
            );

          opacity: .04;

          pointer-events: none;
        }

        .arch-loss-label {
          color: var(--loss-color);

          font-family: monospace;

          font-size: 10px;
          font-weight: 800;
        }

        .arch-loss-name {
          margin-top: 8px;

          color: #f1f5f9;

          font-family:
            "Space Grotesk",
            sans-serif;

          font-size: 16px;
          font-weight: 700;
        }

        .arch-loss-weight {
          margin-top: 5px;

          color: #475569;

          font-size: 8px;
          font-weight: 800;

          letter-spacing: .12em;
        }

        .arch-loss-formula {
          margin-top: 16px;

          padding: 10px;

          border-radius: 7px;

          background:
            rgba(0,0,0,.24);

          color: #94a3b8;

          font-family: monospace;

          font-size: 10px;

          text-align: center;
        }

        .arch-loss-desc {
          margin: 13px 0 0;

          color: #596579;

          font-size: 11px;

          line-height: 1.65;
        }

        /* =====================================================
           NOTE
        ===================================================== */

        .arch-note {
          display: flex;

          gap: 12px;

          align-items: flex-start;

          margin-top: 14px;

          padding: 15px 18px;

          border-radius: 11px;

          border:
            1px solid
            rgba(255,169,77,.15);

          background:
            rgba(255,169,77,.025);

          color: #667085;

          font-size: 11px;

          line-height: 1.7;
        }

        /* =====================================================
           SPECS
        ===================================================== */

        .arch-spec-grid {
          display: grid;

          grid-template-columns:
            repeat(4, 1fr);

          gap: 10px;
        }

        .arch-spec {
          position: relative;
          overflow: hidden;

          min-height: 92px;

          padding: 17px;

          border:
            1px solid
            var(--line);

          border-radius: 12px;

          background:
            rgba(255,255,255,.014);

          transition:
            transform .25s ease,
            border-color .25s ease,
            background .25s ease;
        }

        .arch-spec::after {
          content: "";

          position: absolute;

          right: -25px;
          bottom: -25px;

          width: 70px;
          height: 70px;

          border-radius: 50%;

          background:
            radial-gradient(
              circle,
              rgba(93,158,255,.12),
              transparent 70%
            );

          opacity: 0;

          transition:
            opacity .3s ease;
        }

        .arch-spec:hover {
          transform:
            translateY(-3px);

          border-color:
            rgba(93,158,255,.18);

          background:
            rgba(93,158,255,.025);
        }

        .arch-spec:hover::after {
          opacity: 1;
        }

        .arch-spec span {
          display: block;

          color: #475569;

          font-size: 8px;
          font-weight: 800;

          letter-spacing: .11em;
        }

        .arch-spec strong {
          display: block;

          margin-top: 8px;

          color: #dbe4f0;

          font-family: monospace;

          font-size: 11px;

          line-height: 1.5;
        }

        /* =====================================================
           SYSTEM SUMMARY
        ===================================================== */

        .summary-chip {
          padding: 8px 11px;

          border-radius: 7px;

          border:
            1px solid
            rgba(0,255,204,.12);

          background:
            rgba(0,255,204,.025);

          color: #4f817a;

          font-size: 8px;
          font-weight: 800;

          letter-spacing: .1em;

          transition:
            transform .25s ease,
            border-color .25s ease,
            background .25s ease,
            color .25s ease;
        }

        .summary-chip:hover {
          transform:
            translateY(-3px);

          border-color:
            rgba(0,255,204,.28);

          background:
            rgba(0,255,204,.055);

          color: #73cfc3;
        }

        /* =====================================================
           FOOTER
        ===================================================== */

        .arch-footer-line {
          height: 1px;

          margin-top: 75px;

          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(93,158,255,.22),
              rgba(0,255,204,.18),
              transparent
            );
        }

        .arch-footer {
          display: flex;

          align-items: center;
          justify-content: space-between;

          gap: 20px;

          padding-top: 22px;

          color: #334155;

          font-size: 9px;

          letter-spacing: .12em;
        }

        /* =====================================================
           ANIMATIONS
        ===================================================== */

        @keyframes arch-rise {
          from {
            opacity: 0;
            transform:
              translateY(22px);
          }

          to {
            opacity: 1;
            transform:
              translateY(0);
          }
        }

        @keyframes arch-fade {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        @keyframes arch-gradient {
          0%, 100% {
            background-position:
              0% 50%;
          }

          50% {
            background-position:
              100% 50%;
          }
        }

        @keyframes arch-float {
          0%, 100% {
            transform:
              translateY(0);
          }

          50% {
            transform:
              translateY(-10px);
          }
        }

        @keyframes arch-spin {
          to {
            transform:
              rotate(360deg);
          }
        }

        @keyframes arch-spin-reverse {
          to {
            transform:
              rotate(-360deg);
          }
        }

        @keyframes arch-orbit {
          from {
            transform:
              translateX(-50%)
              rotate(0deg);
          }

          to {
            transform:
              translateX(-50%)
              rotate(360deg);
          }
        }

        @keyframes orbit-small {
          0% {
            transform:
              rotate(0deg)
              translateX(0);
          }

          50% {
            transform:
              rotate(180deg)
              translateX(14px);
          }

          100% {
            transform:
              rotate(360deg)
              translateX(0);
          }
        }

        @keyframes particle-out {
          0% {
            opacity: 0;
            transform:
              rotate(var(--angle))
              translateX(70px)
              scale(.3);
          }

          15% {
            opacity: 1;
          }

          75% {
            opacity: .8;
          }

          100% {
            opacity: 0;

            transform:
              rotate(var(--angle))
              translateX(var(--distance))
              scale(.05);
          }
        }

        @keyframes core-glow {
          0%, 100% {
            opacity: .55;
            transform:
              scale(.95);
          }

          50% {
            opacity: .9;
            transform:
              scale(1.08);
          }
        }

        @keyframes chip-breathe {
          0%, 100% {
            box-shadow:
              0 0 35px rgba(0,255,204,.08),
              inset 0 0 25px rgba(0,255,204,.04);
          }

          50% {
            box-shadow:
              0 0 50px rgba(0,255,204,.16),
              inset 0 0 35px rgba(0,255,204,.07);
          }
        }

        @keyframes badge-pulse {
          0%, 100% {
            box-shadow:
              0 0 0 rgba(93,158,255,0);
          }

          50% {
            box-shadow:
              0 0 25px rgba(93,158,255,.08);
          }
        }

        @keyframes label-float {
          0%, 100% {
            transform:
              translateY(0);
          }

          50% {
            transform:
              translateY(-5px);
          }
        }

        @keyframes equation-pulse {
          0%, 100% {
            opacity: .5;
          }

          50% {
            opacity: 1;
          }
        }

        /* =====================================================
           RESPONSIVE
        ===================================================== */

        @media (max-width: 900px) {

          .arch-hero {
            grid-template-columns: 1fr;

            gap: 25px;

            padding-top: 60px;
          }

          .arch-hero-visual {
            height: 330px;
          }

          .core-scene {
            transform:
              scale(.88);
          }

          .arch-core {
            width: 190px;
            height: 190px;
          }

          .arch-grid-2 {
            grid-template-columns: 1fr;
          }

          .arch-spec-grid {
            grid-template-columns:
              repeat(2, 1fr);
          }
        }

        @media (max-width: 700px) {

          .arch-container {
            width:
              min(
                calc(100% - 28px),
                1180px
              );
          }

          .arch-title {
            font-size:
              clamp(
                44px,
                14vw,
                64px
              );
          }

          .arch-stat-strip {
            grid-template-columns:
              1fr;
          }

          .arch-section-heading {
            display: block;
          }

          .arch-section-desc {
            text-align: left;

            margin-top: 12px;
          }

          .arch-loss-grid {
            grid-template-columns:
              1fr;
          }

          .arch-flow-item {
            grid-template-columns:
              44px 1fr;

            gap: 12px;
          }

          .arch-flow-node {
            width: 44px;
            height: 44px;

            border-radius: 12px;
          }

          .arch-flow::before {
            left: 21px;
          }

          .arch-spec-grid {
            grid-template-columns:
              1fr 1fr;
          }

          .arch-panel {
            padding: 20px;
          }

          .core-scene {
            transform:
              scale(.72);
          }

          .arch-footer {
            flex-direction: column;
            align-items: flex-start;
          }
        }

        @media (max-width: 440px) {

          .arch-spec-grid {
            grid-template-columns:
              1fr;
          }

          .arch-core {
            width: 165px;
            height: 165px;
          }

          .arch-core-inner {
            width: 88px;
            height: 88px;
          }

          .arch-flow-card {
            padding: 17px;
          }

          .core-scene {
            transform:
              scale(.63);
          }

          .core-tech-label {
            display: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {

          .arch-page *,
          .arch-page *::before,
          .arch-page *::after {
            animation-duration:
              .01ms !important;

            animation-iteration-count:
              1 !important;

            transition-duration:
              .01ms !important;

            scroll-behavior:
              auto !important;
          }
        }

      `}</style>


      <div className="arch-container">

        {/* =====================================================
            HERO
        ===================================================== */}

        <section className="arch-hero">

          <div>

            <div className="arch-eyebrow">
              <Layers size={13} />
              DARC-NET · MODEL ARCHITECTURE
            </div>

            <h1 className="arch-title">
              Inside
              <br />
              <span>DARC-Net.</span>
            </h1>

            <p className="arch-hero-copy">
              <strong>
                Degradation-Aware Restoration and Consistency Network.
              </strong>{' '}
              A compact restoration architecture designed for joint denoising
              and 2× super-resolution of semiconductor inspection imagery,
              using degradation-aware FiLM conditioning to adapt feature
              processing to the estimated noise level.
            </p>

            <div className="arch-stat-strip">

              <div className="arch-stat">
                <span>PARAMETERS</span>
                <strong>892,577</strong>
              </div>

              <div className="arch-stat">
                <span>DARC BLOCKS</span>
                <strong>8</strong>
              </div>

              <div className="arch-stat">
                <span>SUPER-RES</span>
                <strong>2×</strong>
              </div>

            </div>

          </div>


          {/* =================================================
              DARC CORE VISUAL
          ================================================= */}

          <div className="arch-hero-visual">

            <div className="core-scene">

              <CoreParticles />

              <ChipTrace className="chip-trace-left" />
              <ChipTrace className="chip-trace-right" />
              <ChipTrace className="chip-trace-top" />
              <ChipTrace className="chip-trace-bottom" />

              <div className="core-tech-label core-label-one">
                64 CHANNELS
              </div>

              <div className="core-tech-label core-label-two">
                FILM × 8
              </div>

              <div className="core-tech-label core-label-three">
                2× SR
              </div>

              <div className="arch-core">

                <div className="arch-orbit-dot" />
                <div className="orbit-dot-two" />

                <div className="arch-core-inner">

                  <div className="chip-pins">
                    {Array.from({ length: 10 }).map((_, index) => (
                      <span
                        className="chip-pin"
                        key={index}
                      />
                    ))}
                  </div>

                  <Cpu
                    size={19}
                    color="#00ffcc"
                  />

                  <strong>
                    DARC
                  </strong>

                  <span>
                    CORE
                  </span>

                </div>

              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            FORWARD PASS
        ===================================================== */}

        <section className="arch-section">

          <div className="arch-section-heading">

            <div>

              <div className="arch-kicker">
                01 // NETWORK FLOW
              </div>

              <h2 className="arch-section-title">
                The Forward Pass
              </h2>

            </div>

            <p className="arch-section-desc">
              Seven computational stages transform the degraded
              128×128 sensor representation into a restored
              256×256 high-resolution output.
            </p>

          </div>


          <div className="arch-flow">

            {BLOCKS.map((block, index) => {

              const Icon = block.icon

              return (

                <div
                  className="arch-flow-item"
                  key={block.id}
                  style={{
                    animationDelay:
                      `${index * 0.08}s`,
                  }}
                >

                  <div
                    className="arch-flow-node"
                    style={{
                      borderColor:
                        `${block.color}55`,

                      color:
                        block.color,

                      boxShadow:
                        `0 0 28px ${block.color}0c`,
                    }}
                  >
                    <Icon size={19} />
                  </div>


                  <div
                    className="arch-flow-card"
                    style={{
                      borderColor:
                        `${block.color}28`,
                    }}
                  >

                    <div className="arch-flow-top">

                      <div
                        className="arch-flow-label"
                        style={{
                          color:
                            block.color,
                        }}
                      >
                        {block.label}
                      </div>

                      <div className="arch-flow-number">
                        {block.number}
                      </div>

                    </div>

                    <div className="arch-flow-sub">
                      {block.sub}
                    </div>

                    <div className="arch-flow-note">
                      {block.note}
                    </div>

                  </div>


                  {index < BLOCKS.length - 1 && (

                    <div className="arch-mini-arrow">
                      <ArrowDown size={13} />
                    </div>

                  )}

                </div>

              )

            })}

          </div>

        </section>


        {/* =====================================================
            DARC BLOCK
        ===================================================== */}

        <section className="arch-section">

          <div className="arch-section-heading">

            <div>

              <div className="arch-kicker">
                02 // DARC BLOCK
              </div>

              <h2 className="arch-section-title">
                Degradation-Aware
                <br />
                Residual Processing
              </h2>

            </div>

            <p className="arch-section-desc">
              The core restoration unit combines local convolutional
              processing with degradation-conditioned feature modulation
              and a residual shortcut.
            </p>

          </div>


          <div className="arch-grid-2">

            {/* INTERNAL LAYERS */}

            <div
              className="arch-panel"
              style={{
                borderColor:
                  'rgba(167,139,250,.18)',
              }}
            >

              <div className="arch-panel-label">
                <Workflow size={13} />
                BLOCK INTERNALS
              </div>

              <div style={{ marginTop: 18 }}>

                {[
                  'GroupNorm (groups = 8)',
                  'Conv 3×3',
                  'Depthwise Conv 3×3',
                  'GELU activation',
                  'Conv 3×3',
                  'FiLM conditioning (γ, β)',
                  'Residual connection (+)',
                ].map((layer, index) => (

                  <div
                    className="arch-layer"
                    key={layer}
                  >

                    <div className="arch-layer-dot" />

                    <span>
                      {String(index + 1).padStart(2, '0')}
                      {'  '}
                      {layer}
                    </span>

                  </div>

                ))}

              </div>

            </div>


            {/* FILM */}

            <div
              className="arch-panel"
              style={{
                borderColor:
                  'rgba(93,158,255,.18)',
              }}
            >

              <div className="arch-panel-label">
                <Binary size={13} />
                FILM CONDITIONING
              </div>

              <p
                style={{
                  color: '#8490a2',
                  fontSize: 12,
                  lineHeight: 1.8,
                  margin: '17px 0 0',
                }}
              >
                Feature-wise Linear Modulation allows the estimated
                degradation embedding to dynamically control how
                strongly each DARC block processes its features.
              </p>

              <div className="arch-film-visual">

                <div className="arch-film-flow">

                  <div className="arch-film-node">
                    NOISE EMBEDDING
                  </div>

                  <ArrowRight
                    size={13}
                    color="#334155"
                  />

                  <div className="arch-film-node">
                    LINEAR
                  </div>

                  <ArrowRight
                    size={13}
                    color="#334155"
                  />

                  <div className="arch-film-node">
                    γ , β
                  </div>

                </div>

                <div className="arch-code">
                  γ, β = Linear(noise_embedding)
                  <br />
                  γ = γ.unsqueeze(-1).unsqueeze(-1)
                  <br />
                  β = β.unsqueeze(-1).unsqueeze(-1)
                  <br />
                  h = h × (1.0 + γ) + β
                </div>

              </div>

              <p
                style={{
                  color: '#596579',
                  fontSize: 11,
                  lineHeight: 1.65,
                  margin: '14px 0 0',
                }}
              >
                Instead of applying fixed processing to every input,
                the restoration trunk adapts its feature modulation
                according to the estimated degradation level.
              </p>

            </div>

          </div>

        </section>


        {/* =====================================================
            LOSS FUNCTION
        ===================================================== */}

        <section className="arch-section">

          <div className="arch-section-heading">

            <div>

              <div className="arch-kicker">
                03 // TRAINING OBJECTIVE
              </div>

              <h2 className="arch-section-title">
                What the Model Optimizes
              </h2>

            </div>

            <p className="arch-section-desc">
              The submitted checkpoint was trained using a weighted
              combination of reconstruction, structural similarity,
              and gradient preservation losses.
            </p>

          </div>


          <div className="arch-equation">

            <div className="arch-equation-main">
              L_total = L_char + λ₁ · L_ssim + λ₂ · L_grad
            </div>

            <div className="arch-equation-sub">
              λ₁ = 0.1 · λ₂ = 0.1 · NO AUGMENTATION IN SUBMITTED RUN
            </div>

          </div>


          <div className="arch-loss-grid">

            {LOSSES.map((loss) => (

              <div
                className="arch-loss"
                key={loss.label}
                style={{
                  '--loss-color':
                    loss.color,

                  borderColor:
                    `${loss.color}20`,
                }}
              >

                <div className="arch-loss-label">
                  {loss.label}
                </div>

                <div className="arch-loss-name">
                  {loss.name}
                </div>

                <div className="arch-loss-weight">
                  WEIGHT · {loss.weight}
                </div>

                <div className="arch-loss-formula">
                  {loss.formula}
                </div>

                <p className="arch-loss-desc">
                  {loss.desc}
                </p>

              </div>

            ))}

          </div>


          <div className="arch-note">

            <Zap
              size={15}
              color="#ffa94d"
              style={{
                flexShrink: 0,
              }}
            />

            <div>

              <strong
                style={{
                  color: '#ffa94d',
                }}
              >
                Training note:
              </strong>{' '}

              The degradation-consistency loss term — predicted HR →
              blur → downsample → noise → comparison with the input
              NoisyLR — is part of the DARC-Net design but was

              <strong
                style={{
                  color: '#c8d4e8',
                }}
              >
                {' '}not used in the submitted training run.
              </strong>{' '}

              The submitted checkpoint

              <code
                style={{
                  color: '#aab5c5',
                }}
              >
                {' '}weights/darc_losses_best.pth
              </code>

              {' '}uses the three-loss combination shown above.

            </div>

          </div>

        </section>


        {/* =====================================================
            MODEL SPECIFICATIONS
        ===================================================== */}

        <section className="arch-section">

          <div className="arch-section-heading">

            <div>

              <div className="arch-kicker">
                04 // SPECIFICATIONS
              </div>

              <h2 className="arch-section-title">
                Model Configuration
              </h2>

            </div>

            <p className="arch-section-desc">
              Runtime and training configuration of the submitted
              DARC-Net model.
            </p>

          </div>


          <div className="arch-spec-grid">

            {SPECS.map(([label, value]) => (

              <div
                className="arch-spec"
                key={label}
              >

                <span>
                  {label.toUpperCase()}
                </span>

                <strong>
                  {value}
                </strong>

              </div>

            ))}

          </div>

        </section>


        {/* =====================================================
            FINAL SYSTEM SUMMARY
        ===================================================== */}

        <section className="arch-section">

          <div
            className="arch-panel"
            style={{
              padding: '32px',

              borderColor:
                'rgba(0,255,204,.13)',

              background:
                'linear-gradient(135deg, rgba(0,255,204,.035), rgba(3,7,18,.9) 55%, rgba(93,158,255,.035))',
            }}
          >

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 18,
              }}
            >

              <Gauge
                size={17}
                color="#00ffcc"
              />

              <span
                style={{
                  color: '#6dfff0',
                  fontSize: 9,
                  fontWeight: 850,
                  letterSpacing: '.18em',
                }}
              >
                SYSTEM SUMMARY
              </span>

            </div>


            <h3
              style={{
                margin: 0,
                color: '#f1f5f9',
                fontFamily:
                  'Space Grotesk, sans-serif',
                fontSize:
                  'clamp(24px, 3vw, 34px)',
                letterSpacing: '-.035em',
              }}
            >
              Adaptive restoration,
              <br />
              built for real inspection data.
            </h3>


            <p
              style={{
                maxWidth: 700,
                margin: '16px 0 0',
                color: '#596579',
                fontSize: 12,
                lineHeight: 1.8,
              }}
            >
              DARC-Net combines degradation estimation, FiLM-conditioned
              restoration, learned 2× upsampling, and global residual
              reconstruction into a compact restoration pipeline.
              The design is optimized around preserving meaningful
              semiconductor structure while removing degradation from
              the low-resolution input.
            </p>


            <div
              style={{
                display: 'flex',
                gap: 10,
                flexWrap: 'wrap',
                marginTop: 22,
              }}
            >

              {[
                'DEGRADATION-AWARE',
                '8 DARC BLOCKS',
                '2× SUPER-RESOLUTION',
                '892,577 PARAMETERS',
              ].map((item) => (

                <div
                  key={item}
                  className="summary-chip"
                >
                  {item}
                </div>

              ))}

            </div>

          </div>

        </section>


        <div className="arch-footer-line" />


        <footer className="arch-footer">

          <span>
            DARC-NET · SEMICONDUCTOR IMAGE RESTORATION
          </span>

          <span>
            MODEL ARCHITECTURE · 2026
          </span>

        </footer>

      </div>

    </main>
  )
}