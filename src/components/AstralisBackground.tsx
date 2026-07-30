import { useEffect, useRef } from 'react'

interface Wave {
  freq: number
  amp: number
  phase: number
  speed: number
  opacity: number
  yOffset: number
}

export default function AstralisBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const waves: Wave[] = [
      { freq: 0.008, amp: 100, phase: 0, speed: 0.004, opacity: 0.18, yOffset: 0 },
      { freq: 0.014, amp: 65, phase: 2.1, speed: 0.006, opacity: 0.13, yOffset: 0.15 },
      { freq: 0.005, amp: 140, phase: 4.3, speed: 0.002, opacity: 0.10, yOffset: -0.1 },
      { freq: 0.02, amp: 50, phase: 1, speed: 0.009, opacity: 0.15, yOffset: 0.25 },
      { freq: 0.011, amp: 85, phase: 3.5, speed: 0.003, opacity: 0.09, yOffset: -0.2 },
      { freq: 0.017, amp: 60, phase: 0.7, speed: 0.007, opacity: 0.12, yOffset: 0.05 },
    ]

    let animId = 0
    let width = 0
    let height = 0
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    function draw() {
      ctx.clearRect(0, 0, width, height)

      waves.forEach((wave) => {
        ctx.beginPath()
        ctx.lineWidth = 1.5
        ctx.strokeStyle = `rgba(128,128,128,${wave.opacity})`
        const baseY = height * (0.5 + wave.yOffset)

        for (let x = 0; x <= width; x += 2) {
          const y = baseY + Math.sin(x * wave.freq + wave.phase) * wave.amp
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }

        ctx.stroke()
        if (!reducedMotion) wave.phase += wave.speed
      })

      if (!reducedMotion) animId = requestAnimationFrame(draw)
    }

    function handleVisibility() {
      cancelAnimationFrame(animId)
      if (!document.hidden && !reducedMotion) animId = requestAnimationFrame(draw)
    }

    resize()
    draw()
    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full bg-black"
    />
  )
}
