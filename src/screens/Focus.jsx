import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Hl, QBY, optionOrder, pickOne } from '../lib/data.jsx'
import { pickFocus } from '../lib/progress.js'
import { dayStr, useStore } from '../lib/store.jsx'
import { useBack } from '../lib/ui.jsx'
import { buzz, canSpeak, confetti, sayAll, sfx, stopSpeaking } from '../lib/fx.js'
import { IC } from '../components/Icons.jsx'
import { Photo, mmss } from '../components/bits.jsx'
import Mascot from '../components/Mascot.jsx'

/* Focus mode, made for a short attention span:
   five questions, one thing on the screen, read aloud, answers open after the question has been read,
   a tap on an answer checks it at once, and leaving is always allowed with nothing lost. */
const N = 5
const OK = ['נכון!', 'בדיוק!', 'יפה!', 'צדקת!', 'מעולה!']
const BREAK_EVERY = 3
const BREAK_SECS = 120

const card = (id) => ({ id, order: optionOrder(QBY[id]) })
const readMs = (q) => Math.min(5200, Math.max(1600, q.q.length * 55))

export default function Focus({ onClose }) {
  const { S, act, seen } = useStore()
  const voice = S.focus.voice && canSpeak()
  const today = S.focus.day === dayStr() ? S.focus.rounds : 0
  const [st, setSt] = useState(() => {
    const [first, ...queue] = pickFocus(S, seen, N)
    return { queue, cur: card(first), open: false, pick: null, solved: 0, missed: [], stage: 'q' }
  })
  const [left, setLeft] = useState(BREAK_SECS)
  const timer = useRef(0)
  const q = st.cur && QBY[st.cur.id]
  useBack(onClose)
  useEffect(() => () => { clearTimeout(timer.current); stopSpeaking() }, [])

  // every new question: read it out, open the answers when it has been read (or a tap opens them sooner)
  useLayoutEffect(() => {
    if (st.stage !== 'q' || !q) return
    clearTimeout(timer.current)
    const open = () => setSt((s) => (s.cur.id === q.id ? { ...s, open: true } : s))
    if (voice) {
      const spoke = sayAll([q.q, ...st.cur.order.map((oi, k) => `${k + 1}: ${q.o[oi]}`)], open)
      timer.current = setTimeout(open, spoke ? readMs(q) * 1.8 + 1500 : readMs(q))
    } else timer.current = setTimeout(open, readMs(q))
  }, [st.cur, st.stage]) // eslint-disable-line react-hooks/exhaustive-deps

  const answer = (oi) => {
    if (!st.open || st.pick != null) return
    const ok = oi === q.a
    act.answer(q.id, ok)
    if (ok) { sfx.ok(); buzz(15) } else { sfx.bad(); buzz([40, 40, 40]) }
    if (voice) sayAll(ok ? [pickOne(OK), q.why] : ['התשובה הנכונה: ' + q.o[q.a], q.why])
    setSt((s) => {
      const queue = s.queue.slice()
      // a missed question comes back two questions later, until it is answered right
      if (!ok) queue.splice(Math.min(2, queue.length), 0, s.cur.id)
      return { ...s, pick: oi, queue, solved: s.solved + (ok ? 1 : 0), missed: ok || s.missed.includes(s.cur.id) ? s.missed : [...s.missed, s.cur.id] }
    })
  }

  const next = () => {
    stopSpeaking()
    if (!st.queue.length) {
      act.focusRound()
      act.addXP(5 + (st.missed.length ? 0 : 3))
      sfx.win(); buzz([20, 60, 20]); confetti()
      setSt((s) => ({ ...s, stage: 'done' }))
      return
    }
    setSt((s) => { const [h, ...rest] = s.queue; return { ...s, queue: rest, cur: card(h), open: false, pick: null } })
  }

  const again = () => {
    const [first, ...queue] = pickFocus(S, seen, N)
    setSt({ queue, cur: card(first), open: false, pick: null, solved: 0, missed: [], stage: 'q' })
  }
  const takeBreak = () => {
    setLeft(BREAK_SECS)
    setSt((s) => ({ ...s, stage: 'break' }))
  }
  useEffect(() => {
    if (st.stage !== 'break') return
    const t = setInterval(() => setLeft((x) => Math.max(0, x - 1)), 1000)
    return () => clearInterval(t)
  }, [st.stage])
  useEffect(() => { if (st.stage === 'break' && left === 0) { sfx.ok(); buzz(30) } }, [left, st.stage])

  // keyboard: 1-4 answer, Enter / space go on
  const keys = useRef(null)
  keys.current = (e) => {
    if (st.stage !== 'q') return
    const n = +e.key
    if (n >= 1 && n <= 4 && st.pick == null) { if (!st.open) setSt((s) => ({ ...s, open: true })); else answer(st.cur.order[n - 1]) }
    else if ((e.key === 'Enter' || e.key === ' ') && st.pick != null) { e.preventDefault(); next() }
  }
  useEffect(() => {
    const f = (e) => keys.current(e)
    document.addEventListener('keydown', f)
    return () => document.removeEventListener('keydown', f)
  }, [])

  const top = (
    <div className="fx-top gut">
      <button className="icon-btn" aria-label="יציאה" onClick={onClose}>{IC.x}</button>
      <div className="fx-dots" aria-label={`${st.solved} מתוך ${N}`}>
        {Array.from({ length: N }, (_, i) => <i key={i} className={i < st.solved ? 'on' : ''} />)}
      </div>
      {canSpeak() ? (
        <button className={'fx-voice' + (voice ? ' on' : '')} aria-pressed={voice}
          onClick={() => { if (voice) stopSpeaking(); act.setFocusVoice(!S.focus.voice) }}>
          {IC.speak}<span>{voice ? 'מקריא' : 'שקט'}</span>
        </button>
      ) : <span style={{ width: 40 }} />}
    </div>
  )

  if (st.stage === 'break') {
    return (
      <div className="sheet-screen fx">
        <div className="sheet-inner">
          {top}
          <div className="fx-center gut">
            <div className="bob"><Mascot size={110} /></div>
            <h1>הפסקה קטנה</h1>
            <p>קום, תשתה מים, תזוז קצת. המוח זוכר יותר טוב אחרי הפסקה.</p>
            <div className="fx-clock">{mmss(left)}</div>
          </div>
          <div className="ls-foot gut stack">
            <button className="btn btn-green fx-big" onClick={again}>{left ? 'חזרתי, עוד 5 שאלות' : 'הזמן נגמר. עוד 5 שאלות'}</button>
            <button className="btn btn-ghost" onClick={onClose}>מספיק להיום</button>
          </div>
        </div>
      </div>
    )
  }

  if (st.stage === 'done') {
    const rounds = today + 0
    const needBreak = rounds > 0 && rounds % BREAK_EVERY === 0
    return (
      <div className="sheet-screen fx">
        <div className="sheet-inner">
          {top}
          <div className="fx-center gut">
            <div className="bob"><Mascot mood="cheer" size={130} /></div>
            <h1>{st.missed.length ? 'סיימת סבב!' : 'סבב מושלם!'}</h1>
            <p>{st.missed.length
              ? `${st.missed.length === 1 ? 'שאלה אחת' : st.missed.length + ' שאלות'} שטעית בהן יחזרו אליך בעוד כמה דקות, ושוב מחר.`
              : 'בלי אף טעות. ככה עוברים תאוריה.'}</p>
            <div className="fx-today">
              {Array.from({ length: Math.max(3, rounds) }, (_, i) => <i key={i} className={i < rounds ? 'on' : ''}>{i < rounds ? IC.check : null}</i>)}
            </div>
            <span className="muted">{rounds === 1 ? 'סבב אחד היום' : `${rounds} סבבים היום`}{rounds < 3 ? ' · היעד: 3 סבבים' : ' · עמדת ביעד!'}</span>
          </div>
          <div className="ls-foot gut stack">
            {needBreak
              ? <button className="btn btn-green fx-big" onClick={takeBreak}>הפסקה של 2 דקות</button>
              : <button className="btn btn-green fx-big" autoFocus onClick={again}>עוד 5 שאלות</button>}
            {needBreak && <button className="btn btn-outline" onClick={again}>בלי הפסקה, עוד 5</button>}
            <button className="btn btn-ghost" onClick={onClose}>מספיק להיום</button>
          </div>
        </div>
      </div>
    )
  }

  const checked = st.pick != null
  const ok = checked && st.pick === q.a
  return (
    <div className="sheet-screen fx">
      <div className="sheet-inner">
        {top}
        <div className="ls-body gut fx-body" key={st.cur.id + ':' + st.queue.length}>
          <Photo q={q} />
          <h1 className="fx-q"><Hl text={q.q} /></h1>
          {!st.open ? (
            <button className="fx-wait" onClick={() => setSt((s) => ({ ...s, open: true }))}>
              <span className="fx-wait-bar" style={{ animationDuration: readMs(q) + 'ms' }} />
              {voice ? 'מקשיבים לשאלה… (הקשה מראה את התשובות)' : 'קוראים את השאלה עד הסוף… (הקשה מראה את התשובות)'}
            </button>
          ) : (
            <div className="opts fx-opts" role="radiogroup">
              {st.cur.order.map((oi, k) => {
                let cls = 'opt'
                if (checked) { if (oi === q.a) cls += ' right'; else if (oi === st.pick) cls += ' wrong shake'; else cls += ' dim' }
                return (
                  <button key={oi} className={cls} role="radio" aria-checked={oi === st.pick} disabled={checked} onClick={() => answer(oi)}>
                    <span className="num">{k + 1}</span><span>{q.o[oi]}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
        {checked && (
          <div className={'fb ' + (ok ? 'ok' : 'bad')} role="alert">
            <div className="fb-in gut">
              <div className="fb-head">
                <div className="fb-ico" style={{ color: `var(${ok ? '--green' : '--red'})` }}>{ok ? IC.check : IC.x}</div>
                <h3>{ok ? pickOne(OK) : 'לא נורא. ככה זוכרים.'}</h3>
              </div>
              {!ok && <p>התשובה הנכונה: <b>{q.o[q.a]}</b></p>}
              {q.why && <p className="fx-why"><b>למה?</b> {q.why}</p>}
              <button className={'btn fx-big ' + (ok ? 'btn-green' : 'btn-red')} autoFocus onClick={next}>
                {st.queue.length ? 'הבאה' : 'סיום הסבב'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
