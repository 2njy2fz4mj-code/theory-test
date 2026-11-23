import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

/* The floating "liquid glass" tab bar of iOS 26 and later.
   Press anywhere on the bar and a glass lens appears under the finger, magnifying the tab below it;
   slide to another tab and let go to open it. A plain tap does the same in one step. */

/* Only on iPhone with iOS 26 or later. From iOS 26 the system version written in the browser's
   description is frozen at 18, and an app opened from the home screen has no Safari version in it,
   so a feature that arrived with iOS 26 tells the two apart. ?glass=1 / ?glass=0 force it for testing. */
export function wantsGlassBar() {
  try {
    const q = new URLSearchParams(location.search).get('glass')
    if (q === '1' || q === '0') {
      try { sessionStorage.setItem('glass', q) } catch { /* private mode */ }
      return q === '1'
    }
    const saved = (() => { try { return sessionStorage.getItem('glass') } catch { return null } })()
    if (saved === '1' || saved === '0') return saved === '1'
    const ua = navigator.userAgent
    if (!/iPhone/.test(ua)) return false
    const os = +(ua.match(/iPhone OS (\d+)_/) || [])[1] || 0
    const safari = +(ua.match(/Version\/(\d+)/) || [])[1] || 0
    if (os >= 26 || safari >= 26) return true
    if (os !== 18) return false
    return CSS.supports('anchor-name: --a') || CSS.supports('color: contrast-color(red)')
  } catch { return false }
}

const LENS = 1.3   // the lens is this much wider than one tab
const MAG = 1.16   // and shows the tabs under it this much bigger
const SNAP_MS = 300
const HELD = 1.035 // the bar grows this much while pressed (see .gt.held)

export default function GlassTabs({ tabs, view, go }) {
  const bar = useRef(null)
  const lens = useRef(null)
  const mag = useRef(null)
  const geo = useRef(null)          // { left, w, items: [{ c, w }] }
  const drag = useRef(null)         // { id, moved, x0 }
  const timer = useRef(0)
  const [phase, setPhase] = useState('idle')   // idle | held | snap
  const [ind, setInd] = useState(null)         // { x, w } of the selected tab
  const sel = Math.max(0, tabs.findIndex(([k]) => k === view))

  const measure = useCallback(() => {
    const b = bar.current
    if (!b) return null
    // the bar grows a little while pressed: measure it at rest size
    const r = b.getBoundingClientRect()
    const k = b.offsetWidth ? r.width / b.offsetWidth : 1
    const items = [...b.querySelectorAll('.gt-row:not(.gt-mag) .gt-item')].map((e) => {
      const q = e.getBoundingClientRect()
      return { c: (q.left - r.left + q.width / 2) / k, w: q.width / k }
    })
    geo.current = { cx: r.left + r.width / 2, w: b.offsetWidth, h: b.offsetHeight, items }
    return geo.current
  }, [])

  // where the selected tab's pill sits; follows the view however it changed
  useLayoutEffect(() => {
    const g = measure()
    if (g && g.items[sel]) setInd({ x: g.items[sel].c, w: g.items[sel].w })
  }, [sel, measure])
  useEffect(() => {
    const b = bar.current
    const ro = new ResizeObserver(() => {
      const g = measure()
      if (g && g.items[sel]) setInd({ x: g.items[sel].c, w: g.items[sel].w })
    })
    ro.observe(b)
    return () => ro.disconnect()
  }, [sel, measure])
  useEffect(() => () => clearTimeout(timer.current), [])

  const place = (x) => {
    const g = geo.current
    if (!g || !lens.current) return
    const lw = (g.items[0]?.w || 60) * LENS
    const cx = Math.min(g.w - lw / 2 + 4, Math.max(lw / 2 - 4, x))
    const left = cx - lw / 2
    lens.current.style.width = lw + 'px'
    lens.current.style.transform = `translateX(${left}px)`
    if (mag.current) {
      mag.current.style.width = g.w + 'px'
      mag.current.style.left = -left + 'px'
      mag.current.style.transformOrigin = `${cx}px 50%`
      mag.current.style.transform = `scale(${MAG})`
    }
  }
  const nearest = (x) => {
    const items = geo.current?.items || []
    let best = 0
    items.forEach((it, i) => { if (Math.abs(it.c - x) < Math.abs(items[best].c - x)) best = i })
    return best
  }
  // finger position in the bar's own (unscaled) coordinates
  const localX = (e, k = HELD) => {
    const g = geo.current
    return g ? (e.clientX - g.cx) / k + g.w / 2 : 0
  }

  const down = (e) => {
    if (e.button > 0 || drag.current) return
    clearTimeout(timer.current)
    const g = measure()
    if (!g) return
    try { bar.current.setPointerCapture(e.pointerId) } catch { /* already gone */ }
    const x = localX(e, bar.current.getBoundingClientRect().width / bar.current.offsetWidth)
    drag.current = { id: e.pointerId }
    // start from the tab that was touched, then follow the finger
    place(g.items[nearest(x)].c)
    setPhase('held')
    requestAnimationFrame(() => { if (drag.current) place(x) })
  }
  const move = (e) => {
    if (!drag.current || drag.current.id !== e.pointerId) return
    place(localX(e))
  }
  const up = (e) => {
    if (!drag.current || drag.current.id !== e.pointerId) return
    drag.current = null
    const i = nearest(localX(e))
    setPhase('snap')
    requestAnimationFrame(() => place(geo.current.items[i].c))
    if (tabs[i][0] !== view) go(tabs[i][0])
    timer.current = setTimeout(() => setPhase('idle'), SNAP_MS)
  }
  const cancel = (e) => {
    if (!drag.current || drag.current.id !== e.pointerId) return
    drag.current = null
    setPhase('idle')
  }

  const row = (copy) => tabs.map(([k, label, icon], i) => {
    const on = copy || i === sel
    if (copy) return <div key={k} className="gt-item on" aria-hidden="true">{icon}<span>{label}</span></div>
    return (
      <button key={k} className={'gt-item' + (on ? ' on' : '')} aria-current={i === sel ? 'page' : undefined}
        // a pointer is handled by the bar; this is for the keyboard
        onClick={(e) => { if (e.detail === 0) go(k) }}>
        {icon}<span>{label}</span>
      </button>
    )
  })

  return (
    <nav ref={bar} className={'gt ' + phase} aria-label="ניווט"
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={cancel} onLostPointerCapture={cancel}
      onContextMenu={(e) => e.preventDefault()}>
      {ind && (
        <div className="gt-ind" style={{ width: ind.w + 4, transform: `translateX(${ind.x - ind.w / 2 - 2}px)` }} />
      )}
      <div className="gt-row">{row(false)}</div>
      <div ref={lens} className="gt-lens" aria-hidden="true">
        <div className="gt-lens-body">
          <div ref={mag} className="gt-row gt-mag">{row(true)}</div>
          <i className="gt-rim" />
        </div>
      </div>
    </nav>
  )
}
