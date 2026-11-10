import { useEffect, useRef, useState } from 'react'
import { Hl, QBY, optionOrder, pickOne, shuffle } from '../lib/data.jsx'
import { useStore } from '../lib/store.jsx'
import { useUI } from '../lib/ui.jsx'
import { buzz, confetti, sfx, speak, stopSpeaking } from '../lib/fx.js'
import { IC } from '../components/Icons.jsx'
import { Photo, mmss } from '../components/bits.jsx'
import Mascot from '../components/Mascot.jsx'

const PRAISE = ['מעולה!', 'בדיוק!', 'יפה מאוד!', 'כל הכבוד!', 'תשובה נכונה!', 'בול!']
const card = (id) => ({ id, order: optionOrder(QBY[id]) })

/* One lesson or practice set. Wrong answers go back to the end of the queue until answered correctly. */
export default function Lesson({ cfg, onClose }) {
  const { act } = useStore()
  const ui = useUI()
  const total = cfg.ids.length
  const [st, setSt] = useState(() => {
    const queue = cfg.shuffle ? shuffle(cfg.ids) : cfg.ids.slice()
    const first = queue.shift()
    return { queue, cur: card(first), sel: null, checked: false, ok: null, removed: [], solved: 0, wrong: [], combo: 0, praise: '', more: false, result: null }
  })
  const [t0] = useState(() => Date.now())
  const bodyRef = useRef(null)
  const contRef = useRef(null)
  const q = QBY[st.cur.id]

  useEffect(() => { if (bodyRef.current) bodyRef.current.scrollTop = 0 }, [st.cur])
  useEffect(() => { if (st.checked) contRef.current?.focus({ preventScroll: true }) }, [st.checked])
  useEffect(() => stopSpeaking, [])

  const pick = (i) => {
    if (st.checked || st.removed.includes(i)) return
    sfx.tap()
    setSt((s) => ({ ...s, sel: i }))
  }

  const check = () => {
    if (st.sel == null || st.checked) return
    const ok = st.sel === q.a
    act.answer(q.id, ok)
    if (ok) { sfx.ok(); buzz(15) } else { sfx.bad(); buzz([40, 40, 40]) }
    setSt((s) => ({
      ...s, checked: true, ok, more: false,
      solved: s.solved + (ok ? 1 : 0),
      combo: ok ? s.combo + 1 : 0,
      wrong: ok || s.wrong.includes(q.id) ? s.wrong : [...s.wrong, q.id],
      queue: ok ? s.queue : [...s.queue, q.id],
      praise: pickOne(PRAISE)
    }))
  }

  const finish = () => {
    const secs = Math.round((Date.now() - t0) / 1000)
    const acc = Math.round(((total - st.wrong.length) / total) * 100)
    const xp = cfg.mode === 'lesson' ? 10 + (st.wrong.length ? 0 : 5) : total
    act.addXP(xp)
    if (cfg.mode === 'lesson') act.markDone(cfg.lesson.id)
    sfx.win(); buzz([20, 60, 20]); confetti()
    setSt((s) => ({ ...s, result: { secs, acc, xp, perfect: !s.wrong.length } }))
  }

  const next = () => {
    if (!st.queue.length) return finish()
    setSt((s) => {
      const [h, ...rest] = s.queue
      return { ...s, queue: rest, cur: card(h), sel: null, checked: false, ok: null, removed: [], more: false }
    })
  }

  const hint = () => {
    const wrongs = st.cur.order.filter((i) => i !== q.a && !st.removed.includes(i) && i !== st.sel)
    if (st.removed.length || !wrongs.length) return
    sfx.tap()
    setSt((s) => ({ ...s, removed: [...s.removed, pickOne(wrongs)] }))
  }

  const readAloud = () => {
    const text = q.q + '. ' + st.cur.order.map((oi, k) => `${k + 1}. ${q.o[oi]}`).join('. ')
    if (!speak(text)) ui.toast('הקראה לא זמינה במכשיר הזה')
  }

  const askClose = () => ui.confirm({
    title: 'לצאת מהשיעור?', text: 'ההתקדמות בשיעור הזה לא תישמר.',
    cancel: 'להמשיך ללמוד', ok: 'יציאה', onOk: onClose
  })

  // keyboard: 1-4 choose, Enter checks / continues
  const keys = useRef(null)
  keys.current = (e) => {
    if (document.getElementById('modal') || st.result) return
    const n = +e.key
    if (n >= 1 && n <= 4 && !st.checked && st.cur.order[n - 1] != null) pick(st.cur.order[n - 1])
    else if (e.key === 'Enter') { e.preventDefault(); st.checked ? next() : check() }
  }
  useEffect(() => {
    const f = (e) => keys.current(e)
    document.addEventListener('keydown', f)
    return () => document.removeEventListener('keydown', f)
  }, [])

  if (st.result) {
    const r = st.result
    return (
      <div className="sheet-screen">
        <div className="sheet-inner gut">
          <div className="done-screen">
            <div className="bob"><Mascot mood="cheer" size={140} /></div>
            <h1>{cfg.mode === 'lesson' ? 'השיעור הושלם!' : 'התרגול הושלם!'}</h1>
            <p className="muted" style={{ margin: 0, fontSize: 17 }}>
              {r.perfect ? 'בלי אף טעות. מושלם.' : 'כל טעות שתיקנתם היום היא שאלה שתדעו במבחן.'}
            </p>
            <div className="done-tiles">
              <div className="dt" style={{ '--tc': 'var(--amber)' }}><b>XP</b><div dir="ltr">+{r.xp}</div></div>
              <div className="dt" style={{ '--tc': 'var(--green)' }}><b>דיוק</b><div>{r.acc}%</div></div>
              <div className="dt" style={{ '--tc': 'var(--blue)' }}><b>זמן</b><div>{mmss(r.secs)}</div></div>
            </div>
          </div>
          <div className="foot-pad"><button className="btn btn-primary" autoFocus onClick={onClose}>המשך</button></div>
        </div>
      </div>
    )
  }

  const again = st.wrong.includes(q.id) && !st.checked
  const n = Math.min(st.solved + (st.checked && st.ok ? 0 : 1), total)

  return (
    <div className="sheet-screen">
      <div className="sheet-inner">
        <div className="ls-top gut">
          <button className="icon-btn" aria-label="יציאה מהשיעור" onClick={askClose}>{IC.x}</button>
          <div className="bar"><div className="fill" style={{ width: (st.solved / total) * 100 + '%' }} /></div>
          <div className="combo">{st.combo >= 3 && <>{IC.flame}{st.combo}</>}</div>
        </div>
        <div className="ls-body gut" ref={bodyRef}>
          <div className="ls-meta">
            <span className="ls-unit">{cfg.label}{again && <span className="again">חזרה</span>}</span>
            <span className="ls-count">שאלה {n}/{total}<span className="qno">(מס׳ {q.n} במאגר)</span></span>
          </div>
          <Photo q={q} />
          <h1 className="ls-q"><Hl text={q.q} /></h1>
          <div className="tools">
            <button className="tool" onClick={readAloud}>{IC.speak}הקראה</button>
            <button className="tool" onClick={hint} disabled={st.checked || st.removed.length > 0}>{IC.bulb}רמז: מחיקת תשובה</button>
          </div>
          <div className="opts" role="radiogroup">
            {st.cur.order.map((oi, k) => {
              let cls = 'opt'
              if (st.checked) { if (oi === q.a) cls += ' right'; else if (oi === st.sel) cls += ' wrong shake' }
              else if (oi === st.sel) cls += ' sel'
              if (st.removed.includes(oi)) cls += ' gone'
              return (
                <button key={oi} className={cls} role="radio" aria-checked={oi === st.sel}
                  disabled={st.checked || st.removed.includes(oi)} onClick={() => pick(oi)}>
                  <span className="num">{k + 1}</span><span>{q.o[oi]}</span>
                </button>
              )
            })}
          </div>
        </div>
        <div className="ls-foot gut" style={{ visibility: st.checked ? 'hidden' : 'visible' }}>
          <button className="btn btn-green" disabled={st.sel == null} onClick={check}>בדיקה</button>
        </div>
        {st.checked && (
          <div className={'fb ' + (st.ok ? 'ok' : 'bad')} role="alert">
            <div className="fb-in gut">
              <div className="fb-head">
                <div className="fb-ico" style={{ color: `var(${st.ok ? '--green' : '--red'})` }}>{st.ok ? IC.check : IC.x}</div>
                <h3>{st.ok ? (st.combo >= 3 ? `${st.combo} ברצף! ${st.praise}` : st.praise) : 'לא נורא, ככה לומדים.'}</h3>
              </div>
              {!st.ok && <p>התשובה הנכונה: <b>{q.o[q.a]}</b></p>}
              {q.why ? <p><b>למה?</b> {q.why}</p> : st.ok ? <p>{q.o[q.a]}</p> : null}
              {!st.ok && <div className="note">↻ נחזור לשאלה הזו בסוף השיעור</div>}
              <button ref={contRef} className={'btn ' + (st.ok ? 'btn-green' : 'btn-red')} onClick={next}>המשך</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
