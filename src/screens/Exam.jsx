import { useEffect, useRef, useState } from 'react'
import { Hl, QBY, optionOrder, pickExam } from '../lib/data.jsx'
import { dayStr, useStore } from '../lib/store.jsx'
import { useUI } from '../lib/ui.jsx'
import { confetti, sfx } from '../lib/fx.js'
import { IC } from '../components/Icons.jsx'
import { Photo, mmss } from '../components/bits.jsx'
import Mascot from '../components/Mascot.jsx'

const LIMIT = 40 * 60

/* Test simulation like the real one: 30 questions, 40 minutes, pass with up to 4 mistakes */
export default function Exam({ onClose }) {
  const { act } = useStore()
  const ui = useUI()
  const [ex, setEx] = useState(() => {
    const ids = pickExam(30)
    return { ids, ans: Array(ids.length).fill(null), orders: ids.map((id) => optionOrder(QBY[id])), idx: 0, t0: Date.now() }
  })
  const [now, setNow] = useState(() => Date.now())
  const [result, setResult] = useState(null)
  const stripRef = useRef(null)

  const left = Math.max(0, LIMIT - Math.round((now - ex.t0) / 1000))
  const N = ex.ids.length

  useEffect(() => {
    if (result) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [result])

  const finish = (auto) => {
    if (result) return
    let c = 0
    const mist = []
    const list = ex.ids.map((id, i) => {
      const q = QBY[id]
      const ok = ex.ans[i] === q.a
      if (ok) c++
      else mist.push({ q, a: ex.ans[i] })
      return [id, ok]
    })
    const pass = N - c <= 4
    const secs = Math.min(Math.round((Date.now() - ex.t0) / 1000), LIMIT)
    act.answerMany(list)
    act.addExam({ d: dayStr(), c, n: N, p: pass, t: secs })
    act.addXP(pass ? 20 : 10)
    if (pass) { sfx.win(); confetti() } else sfx.bad()
    setResult({ c, mist, pass, secs, auto })
  }

  useEffect(() => { if (left <= 0 && !result) finish(true) }, [left]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    stripRef.current?.querySelector('.dot.cur')?.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [ex.idx])

  const go = (i) => setEx((e) => ({ ...e, idx: i }))
  const choose = (oi) => { sfx.tap(); setEx((e) => { const ans = e.ans.slice(); ans[e.idx] = oi; return { ...e, ans } }) }

  const askFinish = () => {
    const unanswered = ex.ans.filter((a) => a == null).length
    if (!unanswered) return finish(false)
    ui.confirm({
      title: 'לסיים את המבחן?', text: `נשארו ${unanswered} שאלות בלי תשובה. הן ייספרו כטעויות.`,
      cancel: 'לחזור לשאלות', ok: 'סיום המבחן', onOk: () => finish(false)
    })
  }

  if (result) {
    return (
      <div className="sheet-screen">
        <div className="sheet-inner">
          <div className="ls-top gut">
            <button className="icon-btn" aria-label="סגירה" onClick={onClose}>{IC.x}</button><div style={{ flex: 1 }} />
          </div>
          <div className="ls-body gut">
            <div className={'result-hero ' + (result.pass ? 'pass' : 'fail')}>
              <Mascot mood={result.pass ? 'cheer' : 'sad'} size={110} />
              <h1>{result.pass ? 'עברתם!' : 'הפעם לא עברתם'}</h1>
              <div className="score">{result.c}/{N}</div>
              <p className="muted" style={{ margin: 0 }}>
                {result.auto ? 'הזמן נגמר. ' : ''}{N - result.c} טעויות · מותר עד 4 · {Math.floor(result.secs / 60)} דקות
              </p>
            </div>
            {result.mist.length ? (
              <>
                <h2 className="section-title">הטעויות שלכם</h2>
                <p className="muted" style={{ margin: '-10px 0 0' }}>השאלות האלה נוספו ל"הטעויות שלי" בתרגול.</p>
                {result.mist.map(({ q, a }) => (
                  <div className="card mistake" key={q.id}>
                    <Photo q={q} small />
                    <div className="q"><Hl text={q.q} /> <span className="qno">(מס׳ {q.n})</span></div>
                    <div className="a bad">✗ {a == null ? 'לא עניתם' : q.o[a]}</div>
                    <div className="a good">✓ {q.o[q.a]}</div>
                    {q.why && <div className="why">{q.why}</div>}
                  </div>
                ))}
              </>
            ) : (
              <div className="card" style={{ textAlign: 'center' }}><b>אפס טעויות. מושלם!</b></div>
            )}
          </div>
          <div className="ls-foot gut"><button className="btn btn-primary" onClick={onClose}>חזרה למבחנים</button></div>
        </div>
      </div>
    )
  }

  const q = QBY[ex.ids[ex.idx]]
  const cur = ex.ans[ex.idx]
  return (
    <div className="sheet-screen">
      <div className="sheet-inner">
        <div className="ls-top gut">
          <button className="icon-btn" aria-label="יציאה מהמבחן" onClick={() => ui.confirm({
            title: 'לצאת מהמבחן?', text: 'המבחן לא יישמר ולא ייספר.', cancel: 'להמשיך במבחן', ok: 'יציאה', onOk: onClose
          })}>{IC.x}</button>
          <div style={{ flex: 1, fontWeight: 700 }} className="ls-count">שאלה {ex.idx + 1}/{N}</div>
          <div className={'timer' + (left < 300 ? ' low' : '')}>{IC.clock}<span>{mmss(left)}</span></div>
        </div>
        <div className="gut">
          <div className="strip" ref={stripRef}>
            {ex.ids.map((_, i) => (
              <button key={i} className={'dot' + (ex.ans[i] != null ? ' ans' : '') + (i === ex.idx ? ' cur' : '')}
                aria-label={`שאלה ${i + 1}`} onClick={() => go(i)}>{i + 1}</button>
            ))}
          </div>
        </div>
        <div className="ls-body gut" key={ex.idx}>
          <Photo q={q} />
          <h1 className="ls-q"><Hl text={q.q} /></h1>
          <div className="opts" role="radiogroup">
            {ex.orders[ex.idx].map((oi, k) => (
              <button key={oi} className={'opt' + (cur === oi ? ' sel' : '')} role="radio" aria-checked={cur === oi} onClick={() => choose(oi)}>
                <span className="num">{k + 1}</span><span>{q.o[oi]}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="ls-foot gut ex-nav">
          <button className="btn btn-outline" disabled={ex.idx === 0} onClick={() => go(ex.idx - 1)}>הקודמת</button>
          {ex.idx === N - 1
            ? <button className="btn btn-green" onClick={askFinish}>סיום המבחן</button>
            : <button className="btn btn-primary" onClick={() => go(ex.idx + 1)}>הבאה</button>}
        </div>
      </div>
    </div>
  )
}
