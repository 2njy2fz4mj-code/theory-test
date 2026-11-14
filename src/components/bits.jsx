import { useState } from 'react'
import { imgUrl } from '../lib/data.jsx'
import Mascot from './Mascot.jsx'
import { IC } from './Icons.jsx'

export function Photo({ q, small, lazy }) {
  const [err, setErr] = useState(false)
  const [zoom, setZoom] = useState(false)
  if (!q.img) return null
  if (err) return <div className={'visual photo err' + (small ? ' small' : '')}>התמונה לא נטענה. בדקו את החיבור לאינטרנט.</div>
  return (
    <>
      <button type="button" className={'visual photo' + (small ? ' small' : '')} aria-label="הגדלת התמונה" onClick={() => setZoom(true)}>
        <img src={imgUrl(q.img)} alt="תמונה לשאלה" loading={lazy ? 'lazy' : undefined} onError={() => setErr(true)} />
        {!small && <span className="zoom-hint">{IC.zoom}</span>}
      </button>
      {zoom && (
        <div className="zoomed" role="dialog" aria-label="תמונה מוגדלת" onClick={() => setZoom(false)}>
          <img src={imgUrl(q.img)} alt="תמונה לשאלה" />
          <span>הקישו כדי לסגור</span>
        </div>
      )}
    </>
  )
}

export function Ring({ p }) {
  const r = 28
  const c = 2 * Math.PI * r
  return (
    <svg className="ready-ring" viewBox="0 0 68 68">
      <circle cx="34" cy="34" r={r} fill="none" stroke="var(--line)" strokeWidth="8" />
      <circle cx="34" cy="34" r={r} fill="none" stroke="var(--blue)" strokeWidth="8" strokeLinecap="round"
        strokeDasharray={`${c * p} ${c}`} transform="rotate(-90 34 34)" />
      <text x="34" y="40" textAnchor="middle" fontFamily="Fredoka,Heebo,sans-serif" fontWeight="700" fontSize="17" fill="var(--ink)">
        {Math.round(p * 100)}%
      </text>
    </svg>
  )
}

export function Coach({ children }) {
  return (
    <div className="coach">
      <div className="bubble">{children}<small>תאוריה בקל</small></div>
      <Mascot size={64} />
    </div>
  )
}

export const mmss = (s) => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0')
