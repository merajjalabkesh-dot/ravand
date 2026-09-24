import React, { useEffect, useRef } from 'react'

/**
 * Thunder Portal Ring — a glowing, swirling energy ring on a black starry sky,
 * animated with electric streaks. The word "Ravand" clips through it, so only
 * the letters show this scene.
 */
export default function Starfield({ className, style }) {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf = 0
    let W = 0, H = 0, dpr = 1

    const bgStars = []
    const N_BG = 180

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1)
      W = canvas.clientWidth
      H = canvas.clientHeight
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      seedBg()
    }
    const seedBg = () => {
      bgStars.length = 0
      for (let i = 0; i < N_BG; i++) {
        bgStars.push({
          x: Math.random() * W,
          y: Math.random() * H,
          size: 0.4 + Math.random() * 1.2,
          phase: Math.random() * Math.PI * 2,
          speed: 0.0004 + Math.random() * 0.001,
          bright: 0.3 + Math.random() * 0.7,
        })
      }
    }

    // noise helper (fast pseudo-noise)
    const noise1 = (x) => {
      const i = Math.floor(x) & 0xff
      const f = x - Math.floor(x)
      const u = f * f * (3 - 2 * f)
      const t = [0.138275, 0.763418, 0.492185, 0.927617, 0.293845, 0.682937, 0.109274, 0.837261]
      return t[i] * (1 - u) + t[(i + 1) & 7] * u
    }

    const frame = (t) => {
      raf = 0
      // black background
      ctx.fillStyle = '#040610'
      ctx.fillRect(0, 0, W, H)

      const cx = W / 2, cy = H / 2
      const R = Math.min(W, H) * 0.33 // ring radius

      // background stars
      for (const s of bgStars) {
        const tw = 0.5 + 0.5 * Math.sin(t * s.speed * 1000 + s.phase)
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.size * (0.6 + tw * 0.4), 0, Math.PI * 2)
        ctx.fillStyle = `rgba(180,200,255,${(0.25 + tw * 0.5) * s.bright})`
        ctx.fill()
      }

      // dark center disc
      const dg = ctx.createRadialGradient(cx, cy, R * 0.12, cx, cy, R * 0.92)
      dg.addColorStop(0, '#050811')
      dg.addColorStop(0.7, '#040610')
      dg.addColorStop(1, 'rgba(4,6,16,0)')
      ctx.fillStyle = dg
      ctx.fillRect(cx - R * 1.1, cy - R * 1.1, R * 2.2, R * 2.2)

      // THE THUNDER PORTAL RING
      // outer glow layers
      const layers = [
        { width: R * 0.55, alpha: 0.04, blur: 1 },
        { width: R * 0.35, alpha: 0.07, blur: 1 },
        { width: R * 0.22, alpha: 0.10, blur: 1 },
        { width: R * 0.14, alpha: 0.18, blur: 1 },
        { width: R * 0.07, alpha: 0.5, blur: 1 },
      ]
      const seg = 360
      const rot = t * 0.00012 // ring rotation speed

      for (const layer of layers) {
        ctx.beginPath()
        for (let i = 0; i <= seg; i++) {
          const a = (i / seg) * Math.PI * 2
          const aRot = a + rot
          // swirl distortion
          const n = noise1(aRot * 3 + t * 0.0008) * 0.5
            + noise1(aRot * 7 - t * 0.0013) * 0.25
            + noise1(aRot * 13 + t * 0.0006) * 0.12
          const drift = (n - 0.44) * layer.width * 0.45
          const r = R + drift
          const px = cx + Math.cos(a) * r
          const py = cy + Math.sin(a) * r
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
        }
        ctx.closePath()
        // color gradient around ring
        const cg = ctx.createLinearGradient(cx - R, cy, cx + R, cy)
        // blue → cyan → magenta → red-orange cycle
        const hueShift = (Math.sin(rot * 0.5) + 1) / 2
        const c1 = `rgba(70,130,255,${layer.alpha * 0.8})`
        const c2 = `rgba(130,80,255,${layer.alpha * 0.9})`
        const c3 = `rgba(255,80,140,${layer.alpha * 0.85})`
        const c4 = `rgba(255,120,60,${layer.alpha * 0.7})`
        cg.addColorStop(0, c1)
        cg.addColorStop(0.28, c2)
        cg.addColorStop(0.58, c3)
        cg.addColorStop(0.82, c4)
        cg.addColorStop(1, c1)
        ctx.strokeStyle = cg
        ctx.lineWidth = layer.width
        ctx.stroke()
      }

      // bright core ring (thin, vivid white/blue)
      ctx.beginPath()
      for (let i = 0; i <= seg; i++) {
        const a = (i / seg) * Math.PI * 2
        const n = noise1(a * 5 + rot * 2) * 0.4 + noise1(a * 11 - rot * 3) * 0.2
        const r = R + n * R * 0.02
        const px = cx + Math.cos(a) * r
        const py = cy + Math.sin(a) * r
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
      }
      ctx.closePath()
      const coreGrad = ctx.createLinearGradient(cx - R, cy, cx + R, cy)
      coreGrad.addColorStop(0, 'rgba(120,180,255,0.7)')
      coreGrad.addColorStop(0.3, 'rgba(200,140,255,0.8)')
      coreGrad.addColorStop(0.6, 'rgba(255,120,180,0.7)')
      coreGrad.addColorStop(0.85, 'rgba(255,150,90,0.6)')
      coreGrad.addColorStop(1, 'rgba(120,180,255,0.7)')
      ctx.strokeStyle = coreGrad
      ctx.lineWidth = Math.max(1.5, R * 0.014)
      ctx.stroke()

      // electric streaks / bolts along the ring
      const nBolts = 16
      for (let i = 0; i < nBolts; i++) {
        const a = (i / nBolts) * Math.PI * 2 + rot * 1.7
        const boltPhase = noise1(i * 7.3 + t * 0.002)
        if (boltPhase < 0.38) continue // not every frame fires
        const r0 = R
        const len = R * (0.06 + boltPhase * 0.12) * (boltPhase > 0.7 ? 1.5 : 1)
        const outward = boltPhase > 0.5 ? 1 : -1
        const pa = a + (Math.random() - 0.5) * 0.04
        const sx = cx + Math.cos(pa) * r0
        const sy = cy + Math.sin(pa) * r0
        const angle = pa + outward * (0.3 + boltPhase * 0.4)
        const ex = sx + Math.cos(angle) * len * outward
        const ey = sy + Math.sin(angle) * len * outward
        const mid1x = (sx + ex) / 2 + (Math.random() - 0.5) * len * 0.4
        const mid1y = (sy + ey) / 2 + (Math.random() - 0.5) * len * 0.4
        ctx.beginPath()
        ctx.moveTo(sx, sy)
        ctx.quadraticCurveTo(mid1x, mid1y, ex, ey)
        ctx.strokeStyle = `rgba(180,200,255,${0.25 + boltPhase * 0.3})`
        ctx.lineWidth = 1 + boltPhase * 1.2
        ctx.stroke()
      }

      // scattered energy sparks around ring
      for (let i = 0; i < 50; i++) {
        const a = noise1(i * 3.7 + t * 0.0003) * Math.PI * 2
        const sparkPhase = noise1(i * 5.1 + t * 0.0008)
        if (sparkPhase < 0.55) continue
        const rOff = R * (0.75 + sparkPhase * 0.5)
        const px = cx + Math.cos(a) * rOff
        const py = cy + Math.sin(a) * rOff
        ctx.beginPath()
        ctx.arc(px, py, 0.6 + sparkPhase * 1.2, 0, Math.PI * 2)
        const color = sparkPhase > 0.8 ? '200,160,255' : '160,190,255'
        ctx.fillStyle = `rgba(${color},${0.3 + sparkPhase * 0.4})`
        ctx.fill()
      }

      // vignette
      const vg = ctx.createRadialGradient(cx, cy, R * 0.6, cx, cy, Math.max(W, H) * 0.65)
      vg.addColorStop(0, 'rgba(0,0,0,0)')
      vg.addColorStop(1, 'rgba(0,0,0,.55)')
      ctx.fillStyle = vg
      ctx.fillRect(0, 0, W, H)

      raf = requestAnimationFrame(frame)
    }

    const onResize = () => resize()
    resize()
    raf = requestAnimationFrame(frame)
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <canvas ref={ref} className={className} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', background: '#040610', ...style }} />
  )
}