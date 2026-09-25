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
          background: 'radial-gradient(circle at 50% 30%, #10233f 0%, #0a0f1f 45%, #04060d 100%)',
          overflow: 'hidden', ...style,
        }}
      >
        {/* soft glow accents — kept subtle so the bright brand pops */}
        <div style={{ position: 'absolute', left: '-14%', top: '6%', width: '64%', height: '36%', background: 'radial-gradient(circle, rgba(90,130,255,.16), transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', right: '-16%', bottom: '8%', width: '60%', height: '38%', background: 'radial-gradient(circle, rgba(130,90,255,.12), transparent 70%)', borderRadius: '50%' }} />
      </div>
    )
  }

  return <PortalVideo className={className} style={style} />
}

export { Starfield }