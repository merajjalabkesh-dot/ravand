import React, { useEffect, useRef, useState } from 'react'
import Starfield from './Starfield'
import PortalVideo from './PortalVideo'

// On phones use a lightweight navypage with the brand; on desktop keep the portal video.
// Keeps the landing light on mobile and still beautiful.
export default function PortalBackground({ className, style }) {
  const [isMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 700px)').matches)

  if (isMobile) {
    return (
      <div
        className={className}
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block',
          background: 'radial-gradient(circle at 50% 30%, #12203c 0%, #0a0f1f 55%, #05070f 100%)',
          overflow: 'hidden', ...style,
        }}
      >
        {/* soft glow accents */}
        <div style={{ position: 'absolute', left: '-10%', top: '8%', width: '60%', height: '34%', background: 'radial-gradient(circle, rgba(90,120,255,.22), transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', right: '-12%', bottom: '10%', width: '58%', height: '36%', background: 'radial-gradient(circle, rgba(120,80,250,.18), transparent 70%)', borderRadius: '50%' }} />
      </div>
    )
  }

  return <PortalVideo className={className} style={style} />
}

export { Starfield }