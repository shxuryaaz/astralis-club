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
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const waves: Wave[] = [
      { freq: 0.008, amp: 100, phase: 0,   speed: 0.004, opacity: 0.18, yOffset: 0    },
      { freq: 0.014, amp: 65,  phase: 2.1, speed: 0.006, opacity: 0.13, yOffset: 0.15 },
      { freq: 0.005, amp: 140, phase: 4.3, speed: 0.002, opacity: 0.10, yOffset: -0.1 },
      { freq: 0.02,  amp: 50,  phase: 1.0, speed: 0.009, opacity: 0.15, yOffset: 0.25 },
      { freq: 0.011, amp: 85,  phase: 3.5, speed: 0.003, opacity: 0.09, yOffset: -0.2 },
      { freq: 0.017, amp: 60,  phase: 0.7, speed: 0.007, opacity: 0.12, yOffset: 0.05 },
    ]

    let animId: number
    let startTime: number | null = null
    const FADE_DURATION = 3000 // ms

    function resize() {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }

    function draw(timestamp: number) {
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime
      const fadeIn  = Math.min(elapsed / FADE_DURATION, 1)

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      waves.forEach((w) => {
        ctx.beginPath()
        ctx.lineWidth = 1.5
        ctx.strokeStyle = `rgba(255,255,255,${w.opacity * fadeIn})`

        const baseY = canvas.height * (0.5 + w.yOffset)

        for (let x = 0; x <= canvas.width; x += 2) {
          const y = baseY + Math.sin(x * w.freq + w.phase) * w.amp
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }

        ctx.stroke()
        w.phase += w.speed
      })

      animId = requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener('resize', resize)
    animId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 bg-black w-full h-full"
    />
  )
}
