import { useEffect, useRef } from 'react'

export default function SemiconductorCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    let animationFrame

    let width = 0
    let height = 0

    const mouse = {
      x: -1000,
      y: -1000,
      active: false,
    }

    const nodes = []

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)

      width = window.innerWidth
      height = window.innerHeight

      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      nodes.length = 0

      const spacing = 48

      for (let y = -spacing; y < height + spacing; y += spacing) {
        for (let x = -spacing; x < width + spacing; x += spacing) {
          nodes.push({
            x,
            y,
            baseX: x,
            baseY: y,
            phase: Math.random() * Math.PI * 2,
            speed: 0.0005 + Math.random() * 0.001,
          })
        }
      }
    }

    const handleMouseMove = (event) => {
      mouse.x = event.clientX
      mouse.y = event.clientY
      mouse.active = true
    }

    const handleMouseLeave = () => {
      mouse.active = false
    }

    const draw = (time) => {
      ctx.clearRect(0, 0, width, height)

      /*
       * Subtle dark background atmosphere
       */
      const gradient = ctx.createRadialGradient(
        width * 0.65,
        height * 0.45,
        0,
        width * 0.65,
        height * 0.45,
        Math.max(width, height) * 0.8
      )

      gradient.addColorStop(0, 'rgba(0, 120, 150, 0.055)')
      gradient.addColorStop(0.5, 'rgba(0, 40, 70, 0.025)')
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)

      /*
       * Floating semiconductor lattice
       */
      for (const node of nodes) {
        const driftX =
          Math.sin(time * node.speed + node.phase) * 3

        const driftY =
          Math.cos(time * node.speed * 1.2 + node.phase) * 3

        let x = node.baseX + driftX
        let y = node.baseY + driftY

        /*
         * Mouse interaction
         */
        if (mouse.active) {
          const dx = x - mouse.x
          const dy = y - mouse.y

          const distance = Math.sqrt(dx * dx + dy * dy)
          const radius = 170

          if (distance < radius && distance > 0) {
            const force = (1 - distance / radius) * 24

            x += (dx / distance) * force
            y += (dy / distance) * force
          }
        }

        /*
         * Very subtle connecting lines
         */
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x + 48, y)

        ctx.strokeStyle = 'rgba(0, 255, 204, 0.035)'
        ctx.lineWidth = 1
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x, y + 48)

        ctx.strokeStyle = 'rgba(40, 120, 255, 0.025)'
        ctx.stroke()

        /*
         * Node
         */
        ctx.beginPath()
        ctx.arc(x, y, 1.25, 0, Math.PI * 2)

        const pulse =
          0.045 +
          Math.sin(time * 0.001 + node.phase) * 0.02

        ctx.fillStyle = `rgba(0, 255, 204, ${Math.max(
          0.02,
          pulse
        )})`

        ctx.fill()
      }

      /*
       * Horizontal scanner beam
       */
      const scanY =
        ((time * 0.045) % (height + 300)) - 150

      const scanGradient = ctx.createLinearGradient(
        0,
        scanY - 45,
        0,
        scanY + 45
      )

      scanGradient.addColorStop(
        0,
        'rgba(0, 255, 204, 0)'
      )

      scanGradient.addColorStop(
        0.5,
        'rgba(0, 255, 204, 0.08)'
      )

      scanGradient.addColorStop(
        1,
        'rgba(0, 255, 204, 0)'
      )

      ctx.fillStyle = scanGradient
      ctx.fillRect(0, scanY - 45, width, 90)

      ctx.beginPath()
      ctx.moveTo(0, scanY)
      ctx.lineTo(width, scanY)

      ctx.strokeStyle = 'rgba(0, 255, 204, 0.13)'
      ctx.lineWidth = 1
      ctx.shadowColor = '#00ffcc'
      ctx.shadowBlur = 10
      ctx.stroke()

      ctx.shadowBlur = 0

      animationFrame = requestAnimationFrame(draw)
    }

    resize()

    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)

    animationFrame = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animationFrame)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  )
}