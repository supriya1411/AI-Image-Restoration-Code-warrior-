
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Zap,
  Shield,
  Cpu,
  BarChart3,
  Layers,
  Play,
  Activity,
  ScanLine,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'


/* ═══════════════════════════════════════════════════════════════
   FULL-SCREEN MOUSE-REACTIVE SEMICONDUCTOR CANVAS
═══════════════════════════════════════════════════════════════ */

function SemiconductorCanvas() {
  const canvasRef = useRef(null)
  const mouseRef = useRef({
    x: -1000,
    y: -1000,
  })

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) return

    const ctx = canvas.getContext('2d')

    if (!ctx) return

    let animationId = null
    let width = 0
    let height = 0
    let dpr = 1

    const mouse = mouseRef.current

    const NODE_COUNT =
      window.innerWidth < 800 ? 130 : 280

    const CONNECTION_DISTANCE = 125

    const nodes = []

    function resize() {
      width = window.innerWidth
      height = window.innerHeight

      dpr = Math.min(
        window.devicePixelRatio || 1,
        2
      )

      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)

      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`

      ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
      )
    }

    function createNodes() {
      nodes.length = 0

      for (let i = 0; i < NODE_COUNT; i += 1) {
        const x = Math.random() * width
        const y = Math.random() * height

        nodes.push({
          x,
          y,
          baseX: x,
          baseY: y,
          vx: (Math.random() - 0.5) * 0.12,
          vy: (Math.random() - 0.5) * 0.12,
          size: Math.random() * 1.25 + 0.35,
          phase: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.012 + 0.004,
        })
      }
    }

    function drawGrid(time) {
      const spacing = 58
      const offset = (time * 0.003) % spacing

      ctx.save()

      ctx.strokeStyle =
        'rgba(0,255,204,0.028)'

      ctx.lineWidth = 1

      for (
        let x = -spacing + offset;
        x < width + spacing;
        x += spacing
      ) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
      }

      for (
        let y = -spacing + offset;
        y < height + spacing;
        y += spacing
      ) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }

      ctx.restore()
    }

    function drawConnections() {
      for (let i = 0; i < nodes.length; i += 1) {
        for (
          let j = i + 1;
          j < nodes.length;
          j += 1
        ) {
          const a = nodes[i]
          const b = nodes[j]

          const dx = a.x - b.x
          const dy = a.y - b.y

          const distance = Math.sqrt(
            dx * dx + dy * dy
          )

          if (distance < CONNECTION_DISTANCE) {
            const alpha =
              (1 - distance / CONNECTION_DISTANCE) *
              0.045

            ctx.strokeStyle =
              `rgba(93,158,255,${alpha})`

            ctx.lineWidth = 0.55

            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }
    }

    function drawNodes(time) {
      for (const node of nodes) {
        const dx = mouse.x - node.x
        const dy = mouse.y - node.y

        const distance = Math.sqrt(
          dx * dx + dy * dy
        )

        let targetX = node.baseX
        let targetY = node.baseY

        if (distance < 190) {
          const force =
            (1 - distance / 190) * 26

          if (distance > 0) {
            targetX -=
              (dx / distance) * force

            targetY -=
              (dy / distance) * force
          }
        }

        node.x +=
          (targetX - node.x) * 0.012 +
          node.vx

        node.y +=
          (targetY - node.y) * 0.012 +
          node.vy

        const pulse =
          0.45 +
          Math.sin(
            time * node.speed + node.phase
          ) *
            0.25

        ctx.beginPath()

        ctx.arc(
          node.x,
          node.y,
          node.size,
          0,
          Math.PI * 2
        )

        ctx.fillStyle =
          `rgba(0,255,204,${Math.max(
            0.06,
            pulse * 0.2
          )})`

        ctx.fill()

        if (node.size > 1.05) {
          const glow =
            ctx.createRadialGradient(
              node.x,
              node.y,
              0,
              node.x,
              node.y,
              node.size * 5
            )

          glow.addColorStop(
            0,
            'rgba(0,255,204,0.13)'
          )

          glow.addColorStop(
            1,
            'rgba(0,255,204,0)'
          )

          ctx.fillStyle = glow

          ctx.beginPath()

          ctx.arc(
            node.x,
            node.y,
            node.size * 5,
            0,
            Math.PI * 2
          )

          ctx.fill()
        }
      }
    }

    function drawScanWave(time) {
      const period = 7200

      const progress =
        (time % period) / period

      const y =
        progress * (height + 400) - 200

      const gradient =
        ctx.createLinearGradient(
          0,
          y - 100,
          0,
          y + 100
        )

      gradient.addColorStop(
        0,
        'rgba(0,255,204,0)'
      )

      gradient.addColorStop(
        0.5,
        'rgba(0,255,204,0.025)'
      )

      gradient.addColorStop(
        1,
        'rgba(0,255,204,0)'
      )

      ctx.fillStyle = gradient

      ctx.fillRect(
        0,
        y - 100,
        width,
        200
      )

      ctx.strokeStyle =
        'rgba(0,255,204,0.045)'

      ctx.lineWidth = 1

      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    function animate(time) {
      ctx.clearRect(
        0,
        0,
        width,
        height
      )

      drawGrid(time)
      drawConnections()
      drawNodes(time)
      drawScanWave(time)

      animationId =
        requestAnimationFrame(animate)
    }

    function handleMouseMove(event) {
      mouse.x = event.clientX
      mouse.y = event.clientY
    }

    function handleMouseLeave() {
      mouse.x = -1000
      mouse.y = -1000
    }

    resize()
    createNodes()

    window.addEventListener(
      'resize',
      resize
    )

    window.addEventListener(
      'mousemove',
      handleMouseMove
    )

    window.addEventListener(
      'mouseleave',
      handleMouseLeave
    )

    animationId =
      requestAnimationFrame(animate)

    return () => {
      if (animationId !== null) {
        cancelAnimationFrame(animationId)
      }

      window.removeEventListener(
        'resize',
        resize
      )

      window.removeEventListener(
        'mousemove',
        handleMouseMove
      )

      window.removeEventListener(
        'mouseleave',
        handleMouseLeave
      )
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="darc-semiconductor-canvas"
      aria-hidden="true"
    />
  )
}


/* ═══════════════════════════════════════════════════════════════
   RESULT CARD
═══════════════════════════════════════════════════════════════ */

function ResultCard({
  filename,
  tag,
  type = 'best',
  delay = 0,
}) {
  const [hovered, setHovered] = useState(false)

  const isBest = type === 'best'

  const borderColor = isBest
    ? 'rgba(57,229,140,0.45)'
    : 'rgba(255,107,107,0.45)'

  const labelColor = isBest
    ? '#39e58c'
    : '#ff6b6b'

  const labelBackground = isBest
    ? 'rgba(57,229,140,0.12)'
    : 'rgba(255,107,107,0.12)'

  const labelBorder = isBest
    ? 'rgba(57,229,140,0.25)'
    : 'rgba(255,107,107,0.25)'

  const glowColor = isBest
    ? 'rgba(57,229,140,0.08)'
    : 'rgba(255,107,107,0.08)'

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: hovered
          ? `1px solid ${borderColor}`
          : '1px solid rgba(255,255,255,0.08)',

        borderRadius: 16,
        overflow: 'hidden',
        background: 'rgba(8,11,18,0.96)',

        transform: hovered
          ? 'translateY(-5px)'
          : 'translateY(0)',

        boxShadow: hovered
          ? `0 24px 70px rgba(0,0,0,0.5), 0 0 40px ${glowColor}`
          : '0 4px 20px rgba(0,0,0,0.3)',

        transition: 'all 0.3s ease',

        animation:
          `hw-fadeup 0.6s ease ${delay}s both`,
      }}
    >

      {/* IMAGE */}

      <div
        style={{
          position: 'relative',
          background:
            'linear-gradient(135deg, #07101d, #02060c)',
          minHeight: 120,
        }}
      >
        <img 
  src={`/data/examples/${filename}`}
  alt={filename}
  style={{ 
    width: '100%',
    display: 'block',
    aspectRatio: '16 / 9',
    objectFit: 'cover',
  }}
  onError={(event) => {
    event.currentTarget.style.display = 'none'
  }}
/>

        {/* TYPE BADGE */}

        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            padding: '5px 9px',
            borderRadius: 6,
            background: labelBackground,
            border: `1px solid ${labelBorder}`,
            color: labelColor,
            fontSize: 8,
            fontWeight: 800,
            letterSpacing: '0.12em',
          }}
        >
          {isBest
            ? 'RESTORED OUTPUT'
            : 'CHALLENGING INPUT'}
        </div>

        {/* IMAGE STATUS */}

        <div
          style={{
            position: 'absolute',
            right: 12,
            bottom: 12,
            padding: '5px 8px',
            borderRadius: 6,
            background:
              'rgba(2,6,13,0.78)',
            border:
              '1px solid rgba(255,255,255,0.08)',
            color: '#64748b',
            fontSize: 8,
            fontFamily: 'monospace',
            backdropFilter: 'blur(8px)',
          }}
        >
          {isBest
            ? 'VALIDATED'
            : 'DIFFICULT'}
        </div>
      </div>

      {/* CARD CONTENT */}

      <div
        style={{
          padding: '16px 18px',
        }}
      >

        {/* TAG + FILENAME */}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            marginBottom: 10,
          }}
        >
          <span
            style={{
              color: labelColor,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.12em',
            }}
          >
            {tag}
          </span>

          <span
            style={{
              color: '#334155',
              fontSize: 9,
              fontFamily: 'monospace',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {filename}
          </span>
        </div>

        {/* DESCRIPTION */}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {isBest ? (
            <CheckCircle2
              size={14}
              color="#39e58c"
              strokeWidth={2}
            />
          ) : (
            <AlertTriangle
              size={14}
              color="#ff6b6b"
              strokeWidth={2}
            />
          )}

          <span
            style={{
              color: '#64748b',
              fontSize: 10,
              lineHeight: 1.5,
            }}
          >
            {isBest
              ? 'High-quality restoration example'
              : 'Difficult degradation case'}
          </span>
        </div>
      </div>
    </div>
  )
}


/* ═══════════════════════════════════════════════════════════════
   METRIC PILL
═══════════════════════════════════════════════════════════════ */

function MetricPill({
  label,
  value,
  unit,
  color,
  dir,
}) {
  const [visible, setVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer =
      new IntersectionObserver(
        (entries) => {
          const entry = entries[0]

          if (
            entry &&
            entry.isIntersecting
          ) {
            setVisible(true)
          }
        },
        {
          threshold: 0.3,
        }
      )

    const element = ref.current

    if (element) {
      observer.observe(element)
    }

    return () => {
      observer.disconnect()
    }
  }, [])

  return (
    <div
      ref={ref}
      style={{
        padding: '28px 24px',
        borderRadius: 14,
        border: `1px solid ${color}25`,
        background:
          `linear-gradient(
            135deg,
            ${color}0a 0%,
            rgba(5,8,14,0.98) 100%
          )`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >

      <div
        style={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 90,
          height: 90,
          borderRadius: '50%',
          background: `${color}0a`,
        }}
      />

      <div
        style={{
          color: '#4a5568',
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.15em',
          marginBottom: 14,
        }}
      >
        {label}
      </div>

      <div
        style={{
          color,
          fontSize: 38,
          fontFamily:
            'Space Grotesk, sans-serif',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        {visible ? value : '—'}

        {unit ? (
          <span
            style={{
              fontSize: 14,
              color: '#4a5568',
              marginLeft: 5,
              fontFamily:
                'Inter, sans-serif',
            }}
          >
            {unit}
          </span>
        ) : null}
      </div>

      <div
        style={{
          color: '#2d3d52',
          fontSize: 9,
          marginTop: 12,
          letterSpacing: '0.1em',
          fontWeight: 600,
        }}
      >
        {dir}
      </div>
    </div>
  )
}


/* ═══════════════════════════════════════════════════════════════
   MAIN HOME PAGE
═══════════════════════════════════════════════════════════════ */

export default function Home() {
  const nav = useNavigate()

  const bestImages = [
    'best_002217.png',
    'best_002226.png',
    'best_002359.png',
    'best_003119.png',
    'best_002227.png',
  ]

  const worstImages = [
    'worst_000407.png',
    'worst_001605.png',
    'worst_002637.png',
    'worst_002973.png',
    'worst_002975.png',
  ]

  const features = [
    {
      icon: <Layers size={26} />,
      color: '#a78bfa',
      title: 'DARC-Net Architecture',
      desc:
        '8 Degradation-Aware Residual Blocks with FiLM conditioning. Noise estimator adapts restoration strength per block. PixelShuffle 2× super-resolution.',
      stat: '892,577 parameters',
    },
    {
      icon: <Zap size={26} />,
      color: '#5d9eff',
      title: 'Combined Loss Training',
      desc:
        'Charbonnier + SSIM + Gradient loss combination. AdamW optimizer. 10 epochs on 2,800 paired semiconductor image samples.',
      stat: 'PSNR +1.77 dB vs baseline',
    },
    {
      icon: <Shield size={26} />,
      color: '#39e58c',
      title: 'Defect Preservation',
      desc:
        'Avoids hallucinating non-existent structures. Degradation-consistency principle prevents accidental removal of real semiconductor defects.',
      stat: 'No hallucination bias',
    },
    {
      icon: <BarChart3 size={26} />,
      color: '#ffa94d',
      title: 'Rigorous Evaluation',
      desc:
        '400-image held-out validation set with identical metric code for baseline and DARC-Net. Full PSNR, SSIM and LPIPS reporting.',
      stat: 'n=400 · no data leakage',
    },
    {
      icon: <Cpu size={26} />,
      color: '#f7c948',
      title: 'GPU-Optimised Pipeline',
      desc:
        'Full end-to-end timing: disk → GPU → model → save. Batch processing with synchronized timing.',
      stat: '58.8 img/sec end-to-end',
    },
    {
      icon: <ArrowRight size={26} />,
      color: '#ff6b6b',
      title: 'Submission-Ready',
      desc:
        'Standalone inference pipeline with configurable input and output directories. Reproducible training and packaged deployment.',
      stat: 'KLA submission-ready',
    },
  ]

  const pipeline = [
    ['DEGRADED\nINPUT', '128×128', '#ff6b6b'],
    ['FEATURE\nEXTRACTOR', 'Conv 3×3\nC=64', '#ffa94d'],
    ['NOISE\nESTIMATOR', 'Embed Cₙ=32', '#f7c948'],
    ['8 DARC\nBLOCKS', 'FiLM conditioned', '#a78bfa'],
    ['PIXEL\nSHUFFLE ×2', 'Learned SR', '#5d9eff'],
    ['RESIDUAL\nRECON', '+ Bicubic', '#39e58c'],
    ['RESTORED\nOUTPUT', '256×256', '#39e58c'],
  ]


  return (
    <>
      <SemiconductorCanvas />

      <style>{`
        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          margin: 0;
          background: #04060c;
        }

        .darc-semiconductor-canvas {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100vh;
          z-index: 0;
          pointer-events: none;
          opacity: 1;
        }

        .hw-page {
          position: relative;
          z-index: 1;
          min-height: 100vh;
          color: #e2e8f0;
          background:
            radial-gradient(
              circle at 75% 20%,
              rgba(37, 99, 235, 0.09),
              transparent 34%
            ),
            radial-gradient(
              circle at 20% 45%,
              rgba(0, 255, 204, 0.045),
              transparent 30%
            ),
            rgba(4, 6, 12, 0.91);
          overflow: hidden;
        }

        @keyframes hw-fadeup {
          from {
            opacity: 0;
            transform: translateY(28px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes hw-fadein {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        @keyframes hw-float {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-8px);
          }
        }

        @keyframes hw-pulse {
          0%,
          100% {
            box-shadow: 0 0 0 0 rgba(57, 229, 140, 0.35);
          }

          70% {
            box-shadow: 0 0 0 8px rgba(57, 229, 140, 0);
          }
        }

        @keyframes hw-gradshift {
          0%,
          100% {
            background-position: 0% 50%;
          }

          50% {
            background-position: 100% 50%;
          }
        }

        @keyframes hw-scanline {
          0% {
            transform: translateY(-120%);
          }

          100% {
            transform: translateY(120%);
          }
        }

        .hw-section {
          width: min(1280px, calc(100% - 48px));
          margin: 0 auto;
        }

        .hw-hero {
          position: relative;
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          align-items: center;
          gap: 50px;
          padding: 72px 0 55px;
        }

        
        .hw-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 15px 32px;
          background:
            linear-gradient(
              135deg,
              #1d4ed8,
              #2563eb,
              #3b82f6
            );
          border: 1px solid rgba(147, 197, 253, 0.4);
          border-radius: 10px;
          color: #fff;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.09em;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow:
            0 0 50px rgba(37, 99, 235, 0.3),
            0 8px 30px rgba(0, 0, 0, 0.4);
          font-family: inherit;
        }

        .hw-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow:
            0 0 70px rgba(37, 99, 235, 0.5),
            0 12px 40px rgba(0, 0, 0, 0.5);
        }

        .hw-btn-ghost {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 15px 26px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 10px;
          color: #94a3b8;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
        }

        .hw-btn-ghost:hover {
          border-color: rgba(255, 255, 255, 0.28);
          color: #e2e8f0;
          background: rgba(255, 255, 255, 0.05);
        }

        .hw-feature-card {
          transition: all 0.25s ease !important;
        }

        .hw-feature-card:hover {
          transform: translateY(-4px) !important;
        }

        .hw-result-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        .hw-stats-row {
          display: flex;
          gap: 36px;
          margin-top: 45px;
          padding-top: 30px;
          border-top: 1px solid rgba(255, 255, 255, 0.07);
        }

        .hw-pipeline {
          display: flex;
          align-items: stretch;
          gap: 0;
          overflow-x: auto;
          padding-bottom: 12px;
        }

        @media (max-width: 1000px) {
          .hw-hero {
            grid-template-columns: 1fr;
            padding-top: 90px;
          }

          .hw-hero-visual {
            height: 500px;
          }

          .hw-hero-copy {
            text-align: center;
          }

          .hw-badge {
            margin-left: auto;
            margin-right: auto;
          }

          .hw-hero-copy p {
            margin-left: auto !important;
            margin-right: auto !important;
          }

          .hw-stats-row {
            justify-content: center;
            flex-wrap: wrap;
          }

          .hw-result-grid {
            grid-template-columns: 1fr 1fr;
          }

          .hw-feature-grid {
            grid-template-columns: 1fr 1fr !important;
          }

          .hw-metrics-grid {
            grid-template-columns: 1fr !important;
            gap: 50px !important;
          }
        }

        @media (max-width: 650px) {
          .hw-section {
            width: min(100% - 28px, 1280px);
          }

          .hw-hero {
            min-height: auto;
            padding: 90px 0 60px;
          }

          

          .hw-result-grid {
            grid-template-columns: 1fr;
          }

          .hw-feature-grid {
            grid-template-columns: 1fr !important;
          }

          .hw-stats-row {
            gap: 20px;
          }
          .hw-hero-visual {
  height: 900px;
  transform: translateY(-100px);
}

.hw-hero-image-wrap {
  position: relative;
  width: min(680px, 110%);
  border-radius: 24px;
  overflow: hidden;
  border: 1px solid rgba(93, 158, 255, 0.22);
  background: #02060d;
  box-shadow:
    0 40px 100px rgba(0, 0, 0, 0.55),
    0 0 100px rgba(37, 99, 235, 0.13);

  transform: perspective(1200px) rotateY(-4deg) translateY(-80px);

  transition: transform 0.5s ease;
  animation: hw-float 7s ease-in-out infinite;
}
          

          .hw-hero-image {
            aspect-ratio: 1.6 / 1;
      }
        }
      `}</style>

      <main className="hw-page">

        {/* HERO */}
        <section>
          <div className="hw-section">
            <div className="hw-hero">

              <div className="hw-hero-copy">

                <div className="hw-badge">
                  <div
                    className="hw-status-dot"
                    style={{
                      width: 7,
                      height: 7,
                    }}
                  />

                  <span
                    style={{
                      color: '#60a5fa',
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '.16em',
                    }}
                  >
                    KLA HACKATHON 2026 · SEMICON INDIA
                  </span>
                </div>

                <h1
                  style={{
                    margin: '0 0 26px',
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontSize: 'clamp(45px, 5.5vw, 78px)',
                    lineHeight: 0.94,
                    letterSpacing: '-.045em',
                    fontWeight: 700,
                  }}
                >
                  <span className="hw-grad">
                    Restoring
                    <br />
                    the Signal.
                  </span>

                  <br />

                  <span
                    style={{
                      color: '#fff',
                      opacity: 0.13,
                      fontSize: '.82em',
                    }}
                  >
                    Reconstructing
                  </span>

                  <br />

                  <span style={{ color: '#94a3b8' }}>
                    the Defect.
                  </span>
                </h1>

                <p
                  style={{
                    color: '#64748b',
                    fontSize: 16,
                    lineHeight: 1.85,
                    maxWidth: 530,
                    margin: '0 0 38px',
                  }}
                >
                  DARC-Net reconstructs{' '}
                  <strong style={{ color: '#bfdbfe' }}>
                    256×256 high-resolution
                  </strong>{' '}
                  semiconductor inspection imagery from
                  degraded 128×128 noisy inputs —
                  preserving real defect structure with
                  measurable accuracy.
                </p>

                <div
                  style={{
                    display: 'flex',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <button
                    className="hw-btn-primary"
                    onClick={() => nav('/workbench')}
                  >
                    <Play size={14} fill="white" />
                    LAUNCH RESTORATION
                  </button>

                  <button
                    className="hw-btn-ghost"
                    onClick={() => nav('/validation')}
                  >
                    VIEW RESULTS
                    <ArrowRight size={14} />
                  </button>

                  <button
                    className="hw-btn-ghost"
                    onClick={() => nav('/architecture')}
                  >
                    EXPLORE MODEL
                  </button>
                </div>

                <div className="hw-stats-row">
                  {[
                    ['3,200', 'TRAINING PAIRS'],
                    ['+1.77dB', 'PSNR GAIN'],
                    ['58.8', 'IMAGES / SEC'],
                    ['892K', 'PARAMETERS'],
                  ].map(([number, label]) => (
                    <div key={label}>
                      <div
                        style={{
                          color: '#f1f5f9',
                          fontSize: 20,
                          fontFamily: 'Space Grotesk, sans-serif',
                          fontWeight: 700,
                        }}
                      >
                        {number}
                      </div>

                      <div
                        style={{
                          color: '#334155',
                          fontSize: 9,
                          letterSpacing: '.1em',
                          marginTop: 4,
                          fontWeight: 600,
                        }}
                      >
                        {label}
                      </div>
                    </div>
                  ))}
                </div>

              </div>

              <div className="hw-hero-visual">

                <div className="hw-glow-orb" />

                <div className="hw-hero-image-wrap">

                  <img
                    src="/data/examples/semiconductor-hero.jpg"
                    alt="Semiconductor inspection"
                    className="hw-hero-image"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none'
                    }}
                  />

                  <div className="hw-hero-image-overlay" />
                  <div className="hw-image-scan" />

                  <div className="hw-corner tl" />
                  <div className="hw-corner tr" />
                  <div className="hw-corner bl" />
                  <div className="hw-corner br" />

                  <div className="hw-image-status">
                    <span className="hw-status-dot" />
                    LIVE INSPECTION
                  </div>

                  <div className="hw-image-label">
                    <ScanLine size={12} />
                    SEMICONDUCTOR ANALYSIS
                  </div>

                </div>
              </div>

            </div>
          </div>
        </section>

        {/* VALIDATION OUTPUTS */}
        <section
          style={{
            padding: '100px 0',
            background:
              'linear-gradient(180deg, rgba(10,16,28,.94), rgba(4,6,12,.98))',
          }}
        >
          <div className="hw-section">

            <div
              style={{
                textAlign: 'center',
                marginBottom: 58,
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  color: '#60a5fa',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '.2em',
                  marginBottom: 18,
                }}
              >
                <Activity size={12} />
                REAL VALIDATION OUTPUTS
              </div>

              <h2
                style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: 'clamp(30px, 4vw, 52px)',
                  margin: 0,
                  fontWeight: 700,
                  letterSpacing: '-.035em',
                  color: '#f1f5f9',
                }}
              >
                What DARC-Net Actually Produces
              </h2>

              <p
                style={{
                  color: '#475569',
                  fontSize: 14,
                  margin: '18px auto 0',
                  maxWidth: 620,
                  lineHeight: 1.8,
                }}
              >
                Real examples selected from the validation
                outputs — showing both strong restorations
                and challenging degradation cases.
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 22,
              }}
            >
              <Sparkles size={18} color="#39e58c" />

              <div>
                <div
                  style={{
                    color: '#39e58c',
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '.16em',
                  }}
                >
                  BEST RESTORATION CASES
                </div>

                <div
                  style={{
                    color: '#334155',
                    fontSize: 11,
                    marginTop: 4,
                  }}
                >
                  Selected high-quality DARC-Net outputs
                </div>
              </div>
            </div>

            <div
              className="hw-result-grid"
              style={{ marginBottom: 70 }}
            >
              {bestImages.map((filename, index) => (
                <ResultCard
                  key={filename}
                  filename={filename}
                  tag={
                    index === 2
                      ? '✓ BEST CASE'
                      : '✓ HIGH QUALITY'
                  }
                  type="best"
                  delay={index * 0.08}
                />
              ))}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 22,
              }}
            >
              <AlertTriangle size={18} color="#ff6b6b" />

              <div>
                <div
                  style={{
                    color: '#ff6b6b',
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '.16em',
                  }}
                >
                  CHALLENGING CASES
                </div>

                <div
                  style={{
                    color: '#334155',
                    fontSize: 11,
                    marginTop: 4,
                  }}
                >
                  Difficult degraded samples from the
                  evaluation set
                </div>
              </div>
            </div>

            <div className="hw-result-grid">
              {worstImages.map((filename, index) => (
                <ResultCard
                  key={filename}
                  filename={filename}
                  tag="⚠ CHALLENGING"
                  type="worst"
                  delay={index * 0.08}
                />
              ))}
            </div>

          </div>
        </section>

        {/* METRICS */}
        <section style={{ padding: '100px 0' }}>
          <div className="hw-section">

            <div
              className="hw-metrics-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 80,
                alignItems: 'center',
              }}
            >

              <div>

                <div
                  style={{
                    color: '#60a5fa',
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '.2em',
                    marginBottom: 18,
                  }}
                >
                  VALIDATED PERFORMANCE
                </div>

                <h2
                  style={{
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontSize: 'clamp(28px, 3.5vw, 46px)',
                    margin: '0 0 22px',
                    fontWeight: 700,
                    letterSpacing: '-.035em',
                    color: '#f1f5f9',
                  }}
                >
                  Numbers That
                  <br />
                  Actually Matter
                </h2>

                <p
                  style={{
                    color: '#475569',
                    fontSize: 14,
                    lineHeight: 1.85,
                    maxWidth: 440,
                    margin: '0 0 32px',
                  }}
                >
                  Evaluated on 400 held-out images with paired
                  ground truth — never used during training or
                  model selection. Same metric code for both
                  models, ensuring a fair comparison.
                </p>

                <div
                  style={{
                    padding: '18px 22px',
                    background: 'rgba(52,211,153,.06)',
                    border: '1px solid rgba(52,211,153,.2)',
                    borderRadius: 12,
                  }}
                >
                  <div
                    style={{
                      color: '#34d399',
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '.12em',
                      marginBottom: 6,
                    }}
                  >
                    ▲ DARC-NET VS BASELINE CNN
                  </div>

                  <div
                    style={{
                      color: '#64748b',
                      fontSize: 13,
                      lineHeight: 1.8,
                    }}
                  >
                    +1.77 dB PSNR · +0.10 SSIM ·{' '}
                    <strong style={{ color: '#34d399' }}>
                      ~48% better perceptual quality
                    </strong>
                  </div>
                </div>

              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 14,
                }}
              >
                <MetricPill
                  label="PSNR"
                  value="25.43"
                  unit="dB"
                  color="#60a5fa"
                  dir="↑ HIGHER IS BETTER"
                />

                <MetricPill
                  label="SSIM"
                  value="0.7710"
                  unit=""
                  color="#a78bfa"
                  dir="↑ HIGHER IS BETTER"
                />

                <MetricPill
                  label="LPIPS"
                  value="0.2565"
                  unit=""
                  color="#34d399"
                  dir="↓ LOWER IS BETTER"
                />

                <MetricPill
                  label="THROUGHPUT"
                  value="58.8"
                  unit="img/s"
                  color="#fb923c"
                  dir="RTX 3050 · E2E"
                />
              </div>

            </div>
          </div>
        </section>

        {/* SYSTEM FEATURES */}
        <section
          style={{
            padding: '100px 0',
            background: 'rgba(4,6,12,.8)',
          }}
        >
          <div className="hw-section">

            <div
              style={{
                textAlign: 'center',
                marginBottom: 68,
              }}
            >
              <div
                style={{
                  color: '#60a5fa',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '.2em',
                  marginBottom: 18,
                }}
              >
                THE SYSTEM
              </div>

              <h2
                style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: 'clamp(28px, 3.5vw, 50px)',
                  margin: 0,
                  fontWeight: 700,
                  letterSpacing: '-.035em',
                  color: '#f1f5f9',
                }}
              >
                What We Built
              </h2>

              <p
                style={{
                  color: '#475569',
                  fontSize: 14,
                  margin: '16px auto 0',
                  maxWidth: 560,
                  lineHeight: 1.8,
                }}
              >
                A complete end-to-end semiconductor image
                restoration system built around
                degradation-aware reconstruction.
              </p>
            </div>

            <div
              className="hw-feature-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3,1fr)',
                gap: 18,
              }}
            >
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="hw-feature-card"
                  style={{
                    padding: '30px 26px',
                    borderRadius: 16,
                    background: `linear-gradient(
                      145deg,
                      ${feature.color}09 0%,
                      rgba(4,6,12,.98) 100%
                    )`,
                    border: `1px solid ${feature.color}20`,
                    animation: `hw-fadeup .5s ease ${
                      index * 0.08
                    }s both`,
                  }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.borderColor =
                      `${feature.color}50`
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.borderColor =
                      `${feature.color}20`
                  }}
                >
                  <div
                    style={{
                      color: feature.color,
                      marginBottom: 20,
                      opacity: 0.9,
                    }}
                  >
                    {feature.icon}
                  </div>

                  <div
                    style={{
                      color: '#e2e8f0',
                      fontFamily: 'Space Grotesk, sans-serif',
                      fontSize: 15,
                      fontWeight: 600,
                      marginBottom: 14,
                    }}
                  >
                    {feature.title}
                  </div>

                  <p
                    style={{
                      color: '#475569',
                      fontSize: 12,
                      lineHeight: 1.85,
                      margin: '0 0 18px',
                    }}
                  >
                    {feature.desc}
                  </p>

                  <div
                    style={{
                      display: 'inline-block',
                      padding: '5px 11px',
                      background: `${feature.color}14`,
                      borderRadius: 6,
                      color: feature.color,
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: '.1em',
                    }}
                  >
                    {feature.stat}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* PIPELINE */}
        <section style={{ padding: '80px 0' }}>
          <div className="hw-section">

            <div
              style={{
                textAlign: 'center',
                marginBottom: 52,
              }}
            >
              <div
                style={{
                  color: '#60a5fa',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '.2em',
                  marginBottom: 14,
                }}
              >
                END-TO-END PIPELINE
              </div>

              <h2
                style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: 'clamp(24px, 3vw, 40px)',
                  margin: 0,
                  fontWeight: 700,
                  letterSpacing: '-.035em',
                  color: '#f1f5f9',
                }}
              >
                From Degraded Input to Restored Output
              </h2>
            </div>

            <div className="hw-pipeline">

              {pipeline.map(
                ([label, sub, color], index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        padding: '22px 10px',
                        textAlign: 'center',
                        border: `1px solid ${color}30`,
                        borderRadius: 12,
                        background: `linear-gradient(
                          180deg,
                          ${color}0c 0%,
                          rgba(4,6,12,.9) 100%
                        )`,
                        minWidth: 100,
                        transition: 'all .2s',
                      }}
                      onMouseEnter={(event) => {
                        event.currentTarget.style.borderColor =
                          `${color}60`

                        event.currentTarget.style.transform =
                          'translateY(-2px)'
                      }}
                      onMouseLeave={(event) => {
                        event.currentTarget.style.borderColor =
                          `${color}30`

                        event.currentTarget.style.transform =
                          'none'
                      }}
                    >
                      <div
                        style={{
                          color,
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: '.1em',
                          lineHeight: 1.6,
                          whiteSpace: 'pre-line',
                        }}
                      >
                        {label}
                      </div>

                      <div
                        style={{
                          color: '#1e293b',
                          fontSize: 9,
                          marginTop: 8,
                          lineHeight: 1.5,
                          whiteSpace: 'pre-line',
                          fontFamily: 'monospace',
                        }}
                      >
                        {sub}
                      </div>
                    </div>

                    {index < pipeline.length - 1 && (
                      <ArrowRight
                        size={13}
                        style={{
                          color: '#1e293b',
                          flexShrink: 0,
                          margin: '0 3px',
                        }}
                      />
                    )}
                  </div>
                )
              )}

            </div>
          </div>
        </section>

        {/* CTA */}
        <section
          style={{
            padding: '90px 0',
            background:
              'linear-gradient(135deg,rgba(14,26,52,.95),rgba(4,6,18,.98))',
            borderTop: '1px solid rgba(93,158,255,.12)',
            borderBottom: '1px solid rgba(93,158,255,.12)',
          }}
        >
          <div
            style={{
              width: 'min(820px, calc(100% - 48px))',
              margin: '0 auto',
              textAlign: 'center',
            }}
          >

            <div
              style={{
                color: '#60a5fa',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '.2em',
                marginBottom: 22,
              }}
            >
              READY TO INSPECT
            </div>

            <h2
              style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: 'clamp(28px, 4vw, 56px)',
                margin: '0 0 22px',
                fontWeight: 700,
                letterSpacing: '-.04em',
                lineHeight: 0.95,
              }}
            >
              <span className="hw-grad">
                Run DARC-Net
                <br />
                on your images.
              </span>
            </h2>

            <p
              style={{
                color: '#475569',
                fontSize: 15,
                lineHeight: 1.85,
                maxWidth: 540,
                margin: '0 auto 44px',
              }}
            >
              Upload a degraded semiconductor inspection
              image and let DARC-Net reconstruct the
              high-resolution output in a single forward pass.
            </p>

            <div
              style={{
                display: 'flex',
                gap: 16,
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <button
                className="hw-btn-primary"
                onClick={() => nav('/workbench')}
                style={{
                  padding: '16px 40px',
                  fontSize: 13,
                }}
              >
                LAUNCH WORKBENCH
                <ArrowRight size={16} />
              </button>

              <button
                className="hw-btn-ghost"
                onClick={() => nav('/validation')}
                style={{
                  padding: '16px 30px',
                  fontSize: 13,
                }}
              >
                SEE VALIDATION RESULTS
              </button>
            </div>

          </div>
        </section>


        {/* ═══════════════════════════════════════════════════════
            HERO
        ═══════════════════════════════════════════════════════ */}

        <section>
          <div className="hw-section">
            <div className="hw-hero">

              <div className="hw-hero-copy">

                <div className="hw-badge">
                  <div
                    className="hw-status-dot"
                    style={{
                      width: 7,
                      height: 7,
                    }}
                  />

                  <span
                    style={{
                      color: '#60a5fa',
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '.16em',
                    }}
                  >
                    KLA HACKATHON 2026 · SEMICON INDIA
                  </span>
                </div>

                <h1
                  style={{
                    margin: '0 0 26px',
                    fontFamily:
                      'Space Grotesk,sans-serif',
                    fontSize:
                      'clamp(45px,5.5vw,78px)',
                    lineHeight: .94,
                    letterSpacing: '-.045em',
                    fontWeight: 700,
                  }}
                >
                  <span className="hw-grad">
                    Restoring
                    <br />
                    the Signal.
                  </span>

                  <br />

                  <span
                    style={{
                      color: '#fff',
                      opacity: .13,
                      fontSize: '.82em',
                    }}
                  >
                    Reconstructing
                  </span>

                  <br />

                  <span
                    style={{
                      color: '#94a3b8',
                    }}
                  >
                    the Defect.
                  </span>
                </h1>

                <p
                  style={{
                    color: '#64748b',
                    fontSize: 16,
                    lineHeight: 1.85,
                    maxWidth: 530,
                    margin: '0 0 38px',
                  }}
                >
                  DARC-Net reconstructs{' '}
                  <strong
                    style={{
                      color: '#bfdbfe',
                    }}
                  >
                    256×256 high-resolution
                  </strong>{' '}
                  semiconductor inspection imagery from
                  degraded 128×128 noisy inputs —
                  preserving real defect structure with
                  measurable accuracy.
                </p>

                <div
                  style={{
                    display: 'flex',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <button
                    className="hw-btn-primary"
                    onClick={() =>
                      nav('/workbench')
                    }
                  >
                    <Play
                      size={14}
                      fill="white"
                    />
                    LAUNCH RESTORATION
                  </button>

                  <button
                    className="hw-btn-ghost"
                    onClick={() =>
                      nav('/validation')
                    }
                  >
                    VIEW RESULTS
                    <ArrowRight size={14} />
                  </button>

                  <button
                    className="hw-btn-ghost"
                    onClick={() =>
                      nav('/architecture')
                    }
                  >
                    EXPLORE MODEL
                  </button>
                </div>

                <div className="hw-stats-row">
                  {[
                    ['3,200', 'TRAINING PAIRS'],
                    ['+1.77dB', 'PSNR GAIN'],
                    ['58.8', 'IMAGES / SEC'],
                    ['892K', 'PARAMETERS'],
                  ].map(([number, label]) => (
                    <div key={label}>
                      <div
                        style={{
                          color: '#f1f5f9',
                          fontSize: 20,
                          fontFamily:
                            'Space Grotesk,sans-serif',
                          fontWeight: 700,
                        }}
                      >
                        {number}
                      </div>

                      <div
                        style={{
                          color: '#334155',
                          fontSize: 9,
                          letterSpacing: '.1em',
                          marginTop: 4,
                          fontWeight: 600,
                        }}
                      >
                        {label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>


              {/* ═══════════════════════════════════════════════
                  REAL SEMICONDUCTOR HERO IMAGE
              ═══════════════════════════════════════════════ */}

              <div className="hw-hero-visual">

                <div className="hw-glow-orb" />

                <div className="hw-hero-image-wrap">

                  <img
                    src="/data/examples/semiconductor-hero.jpg"
                    alt="Semiconductor inspection"
                    className="hw-hero-image"
                    onError={(e) => {
                      e.currentTarget.style.display =
                        'none'
                    }}
                  />

                  <div className="hw-hero-image-overlay" />

                  <div className="hw-image-scan" />

                  <div className="hw-corner tl" />
                  <div className="hw-corner tr" />
                  <div className="hw-corner bl" />
                  <div className="hw-corner br" />

                  <div className="hw-image-status">
                    <span className="hw-status-dot" />
                    LIVE INSPECTION
                  </div>

                  <div className="hw-image-label">
                    <ScanLine size={12} />
                    SEMICONDUCTOR ANALYSIS
                  </div>

                </div>
              </div>

            </div>
          </div>
        </section>


        {/* ═══════════════════════════════════════════════════════
            REAL VALIDATION OUTPUTS
        ═══════════════════════════════════════════════════════ */}

        <section
          style={{
            padding: '100px 0',
            background:
              'linear-gradient(180deg,rgba(10,16,28,.94),rgba(4,6,12,.98))',
          }}
        >
          <div className="hw-section">

            <div
              style={{
                textAlign: 'center',
                marginBottom: 58,
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  color: '#60a5fa',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '.2em',
                  marginBottom: 18,
                }}
              >
                <Activity size={12} />
                REAL VALIDATION OUTPUTS
              </div>

              <h2
                style={{
                  fontFamily:
                    'Space Grotesk,sans-serif',
                  fontSize:
                    'clamp(30px,4vw,52px)',
                  margin: 0,
                  fontWeight: 700,
                  letterSpacing: '-.035em',
                  color: '#f1f5f9',
                }}
              >
                What DARC-Net Actually Produces
              </h2>

              <p
                style={{
                  color: '#475569',
                  fontSize: 14,
                  margin: '18px auto 0',
                  maxWidth: 620,
                  lineHeight: 1.8,
                }}
              >
                Real examples selected from the
                validation outputs — showing both
                strong restorations and challenging
                degradation cases.
              </p>
            </div>


            {/* BEST RESULTS */}

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 22,
              }}
            >
              <Sparkles
                size={18}
                color="#39e58c"
              />

              <div>
                <div
                  style={{
                    color: '#39e58c',
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '.16em',
                  }}
                >
                  BEST RESTORATION CASES
                </div>

                <div
                  style={{
                    color: '#334155',
                    fontSize: 11,
                    marginTop: 4,
                  }}
                >
                  Selected high-quality DARC-Net outputs
                </div>
              </div>
            </div>

            <div
              className="hw-result-grid"
              style={{
                marginBottom: 70,
              }}
            >
              {bestImages.map((filename, index) => (
                <ResultCard
                  key={filename}
                  filename={filename}
                  tag={
                    index === 2
                      ? '✓ BEST CASE'
                      : '✓ HIGH QUALITY'
                  }
                  type="best"
                  delay={index * 0.08}
                />
              ))}
            </div>


            {/* WORST / CHALLENGING RESULTS */}

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 22,
              }}
            >
              <AlertTriangle
                size={18}
                color="#ff6b6b"
              />

              <div>
                <div
                  style={{
                    color: '#ff6b6b',
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '.16em',
                  }}
                >
                  CHALLENGING CASES
                </div>

                <div
                  style={{
                    color: '#334155',
                    fontSize: 11,
                    marginTop: 4,
                  }}
                >
                  Difficult degraded samples from the
                  evaluation set
                </div>
              </div>
            </div>

            <div className="hw-result-grid">
              {worstImages.map((filename, index) => (
                <ResultCard
                  key={filename}
                  filename={filename}
                  tag="⚠ CHALLENGING"
                  type="worst"
                  delay={index * 0.08}
                />
              ))}
            </div>

          </div>
        </section>


        {/* ═══════════════════════════════════════════════════════
            METRICS
        ═══════════════════════════════════════════════════════ */}

        <section style={{ padding: '100px 0' }}>
          <div className="hw-section">

            <div
              className="hw-metrics-grid"
              style={{
                display: 'grid',
                gridTemplateColumns:
                  '1fr 1fr',
                gap: 80,
                alignItems: 'center',
              }}
            >

              <div>
                <div
                  style={{
                    color: '#60a5fa',
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '.2em',
                    marginBottom: 18,
                  }}
                >
                  VALIDATED PERFORMANCE
                </div>

                <h2
                  style={{
                    fontFamily:
                      'Space Grotesk,sans-serif',
                    fontSize:
                      'clamp(28px,3.5vw,46px)',
                    margin: '0 0 22px',
                    fontWeight: 700,
                    letterSpacing: '-.035em',
                    color: '#f1f5f9',
                  }}
                >
                  Numbers That
                  <br />
                  Actually Matter
                </h2>

                <p
                  style={{
                    color: '#475569',
                    fontSize: 14,
                    lineHeight: 1.85,
                    maxWidth: 440,
                    margin: '0 0 32px',
                  }}
                >
                  Evaluated on 400 held-out images
                  with paired ground truth — never
                  used during training or model
                  selection. Same metric code for
                  both models, ensuring a fair
                  comparison.
                </p>

                <div
                  style={{
                    padding: '18px 22px',
                    background:
                      'rgba(52,211,153,.06)',
                    border:
                      '1px solid rgba(52,211,153,.2)',
                    borderRadius: 12,
                  }}
                >
                  <div
                    style={{
                      color: '#34d399',
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '.12em',
                      marginBottom: 6,
                    }}
                  >
                    ▲ DARC-NET VS BASELINE CNN
                  </div>

                  <div
                    style={{
                      color: '#64748b',
                      fontSize: 13,
                      lineHeight: 1.8,
                    }}
                  >
                    +1.77 dB PSNR · +0.10 SSIM ·{' '}
                    <strong
                      style={{
                        color: '#34d399',
                      }}
                    >
                      ~48% better perceptual
                      quality
                    </strong>
                  </div>
                </div>
              </div>


              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    '1fr 1fr',
                  gap: 14,
                }}
              >
                <MetricPill
                  label="PSNR"
                  value="25.43"
                  unit="dB"
                  color="#60a5fa"
                  dir="↑ HIGHER IS BETTER"
                />

                <MetricPill
                  label="SSIM"
                  value="0.7710"
                  unit=""
                  color="#a78bfa"
                  dir="↑ HIGHER IS BETTER"
                />

                <MetricPill
                  label="LPIPS"
                  value="0.2565"
                  unit=""
                  color="#34d399"
                  dir="↓ LOWER IS BETTER"
                />

                <MetricPill
                  label="THROUGHPUT"
                  value="58.8"
                  unit="img/s"
                  color="#fb923c"
                  dir="RTX 3050 · E2E"
                />
              </div>

            </div>
          </div>
        </section>


        {/* ═══════════════════════════════════════════════════════
            SYSTEM FEATURES
        ═══════════════════════════════════════════════════════ */}

        <section
          style={{
            padding: '100px 0',
            background:
              'rgba(4,6,12,.8)',
          }}
        >
          <div className="hw-section">

            <div
              style={{
                textAlign: 'center',
                marginBottom: 68,
              }}
            >
              <div
                style={{
                  color: '#60a5fa',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '.2em',
                  marginBottom: 18,
                }}
              >
                THE SYSTEM
              </div>

              <h2
                style={{
                  fontFamily:
                    'Space Grotesk,sans-serif',
                  fontSize:
                    'clamp(28px,3.5vw,50px)',
                  margin: 0,
                  fontWeight: 700,
                  letterSpacing: '-.035em',
                  color: '#f1f5f9',
                }}
              >
                What We Built
              </h2>

              <p
                style={{
                  color: '#475569',
                  fontSize: 14,
                  margin: '16px auto 0',
                  maxWidth: 560,
                  lineHeight: 1.8,
                }}
              >
                A complete end-to-end semiconductor
                image restoration system built around
                degradation-aware reconstruction.
              </p>
            </div>

            <div
              className="hw-feature-grid"
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(3,1fr)',
                gap: 18,
              }}
            >
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="hw-feature-card"
                  style={{
                    padding: '30px 26px',
                    borderRadius: 16,
                    background:
                      `linear-gradient(
                        145deg,
                        ${feature.color}09 0%,
                        rgba(4,6,12,.98) 100%
                      )`,
                    border:
                      `1px solid ${feature.color}20`,
                    animation:
                      `hw-fadeup .5s ease ${
                        index * .08
                      }s both`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor =
                      `${feature.color}50`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor =
                      `${feature.color}20`
                  }}
                >
                  <div
                    style={{
                      color: feature.color,
                      marginBottom: 20,
                      opacity: .9,
                    }}
                  >
                    {feature.icon}
                  </div>

                  <div
                    style={{
                      color: '#e2e8f0',
                      fontFamily:
                        'Space Grotesk,sans-serif',
                      fontSize: 15,
                      fontWeight: 600,
                      marginBottom: 14,
                    }}
                  >
                    {feature.title}
                  </div>

                  <p
                    style={{
                      color: '#475569',
                      fontSize: 12,
                      lineHeight: 1.85,
                      margin: '0 0 18px',
                    }}
                  >
                    {feature.desc}
                  </p>

                  <div
                    style={{
                      display: 'inline-block',
                      padding: '5px 11px',
                      background:
                        `${feature.color}14`,
                      borderRadius: 6,
                      color: feature.color,
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: '.1em',
                    }}
                  >
                    {feature.stat}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* ═══════════════════════════════════════════════════════
            PIPELINE
        ═══════════════════════════════════════════════════════ */}

        <section style={{ padding: '80px 0' }}>
          <div className="hw-section">

            <div
              style={{
                textAlign: 'center',
                marginBottom: 52,
              }}
            >
              <div
                style={{
                  color: '#60a5fa',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '.2em',
                  marginBottom: 14,
                }}
              >
                END-TO-END PIPELINE
              </div>

              <h2
                style={{
                  fontFamily:
                    'Space Grotesk,sans-serif',
                  fontSize:
                    'clamp(24px,3vw,40px)',
                  margin: 0,
                  fontWeight: 700,
                  letterSpacing: '-.035em',
                  color: '#f1f5f9',
                }}
              >
                From Degraded Input to Restored Output
              </h2>
            </div>

            <div className="hw-pipeline">

              {pipeline.map(
                ([label, sub, color], index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        padding: '22px 10px',
                        textAlign: 'center',
                        border:
                          `1px solid ${color}30`,
                        borderRadius: 12,
                        background:
                          `linear-gradient(
                            180deg,
                            ${color}0c 0%,
                            rgba(4,6,12,.9) 100%
                          )`,
                        minWidth: 100,
                        transition: 'all .2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor =
                          `${color}60`

                        e.currentTarget.style.transform =
                          'translateY(-2px)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor =
                          `${color}30`

                        e.currentTarget.style.transform =
                          'none'
                      }}
                    >
                      <div
                        style={{
                          color,
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: '.1em',
                          lineHeight: 1.6,
                          whiteSpace: 'pre-line',
                        }}
                      >
                        {label}
                      </div>

                      <div
                        style={{
                          color: '#1e293b',
                          fontSize: 9,
                          marginTop: 8,
                          lineHeight: 1.5,
                          whiteSpace: 'pre-line',
                          fontFamily: 'monospace',
                        }}
                      >
                        {sub}
                      </div>
                    </div>

                    {index < 6 && (
                      <ArrowRight
                        size={13}
                        style={{
                          color: '#1e293b',
                          flexShrink: 0,
                          margin: '0 3px',
                        }}
                      />
                    )}
                  </div>
                )
              )}

            </div>
          </div>
        </section>


        {/* ═══════════════════════════════════════════════════════
            CTA
        ═══════════════════════════════════════════════════════ */}

        <section
          style={{
            padding: '90px 0',
            background:
              'linear-gradient(135deg,rgba(14,26,52,.95),rgba(4,6,18,.98))',
            borderTop:
              '1px solid rgba(93,158,255,.12)',
            borderBottom:
              '1px solid rgba(93,158,255,.12)',
          }}
        >
          <div
            style={{
              width:
                'min(820px,calc(100% - 48px))',
              margin: '0 auto',
              textAlign: 'center',
            }}
          >

            <div
              style={{
                color: '#60a5fa',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '.2em',
                marginBottom: 22,
              }}
            >
              READY TO INSPECT
            </div>

            <h2
              style={{
                fontFamily:
                  'Space Grotesk,sans-serif',
                fontSize:
                  'clamp(28px,4vw,56px)',
                margin: '0 0 22px',
                fontWeight: 700,
                letterSpacing: '-.04em',
                lineHeight: .95,
              }}
            >
              <span className="hw-grad">
                Run DARC-Net
                <br />
                on your images.
              </span>
            </h2>

            <p
              style={{
                color: '#475569',
                fontSize: 15,
                lineHeight: 1.85,
                maxWidth: 540,
                margin: '0 auto 44px',
              }}
            >
              Upload a degraded semiconductor
              inspection image and let DARC-Net
              reconstruct the high-resolution output
              in a single forward pass.
            </p>

            <div
              style={{
                display: 'flex',
                gap: 16,
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <button
                className="hw-btn-primary"
                onClick={() =>
                  nav('/workbench')
                }
                style={{
                  padding: '16px 40px',
                  fontSize: 13,
                }}
              >
                LAUNCH WORKBENCH
                <ArrowRight size={16} />
              </button>

              <button
                className="hw-btn-ghost"
                onClick={() =>
                  nav('/validation')
                }
                style={{
                  padding: '16px 30px',
                  fontSize: 13,
                }}
              >
                SEE VALIDATION RESULTS
              </button>
            </div>

          </div>
        </section>
      </main>
    </>
  )
}