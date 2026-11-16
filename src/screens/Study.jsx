import { useState } from 'react'
import { Hl, QBY, pickSet } from '../lib/data.jsx'
import { useStore } from '../lib/store.jsx'
import { useBack, useUI } from '../lib/ui.jsx'
import { IC } from '../components/Icons.jsx'
import { Photo } from '../components/bits.jsx'

/* A list to memorise: every question with its right answer. "Self test" hides the answers until tapped. */
export default function Study({ cfg, onClose }) {
  const { S, seen } = useStore()
  const ui = useUI()
  const [todo, setTodo] = useState(false)
  const [hide, setHide] = useState(false)
  const [open, setOpen] = useState(() => new Set())
  useBack(onClose)

  const wrongSet = new Set(S.wrong)
  const knows = (id) => seen.has(id) && !wrongSet.has(id)
  const groups = cfg.groups
    .map((g) => ({ ...g, ids: todo ? g.ids.filter((id) => !knows(id)) : g.ids }))
    .filter((g) => g.ids.length)
  const count = groups.reduce((n, g) => n + g.ids.length, 0)

  const reveal = (id) => setOpen((o) => new Set(o).add(id))
  const practice = () => {
    const ids = pickSet(cfg.practiceIds, seen, wrongSet, cfg.all ? cfg.practiceIds.length : 10)
    onClose()
    ui.startLesson({ mode: 'practice', label: cfg.title, ids, trap: cfg.trap })
  }

  return (
    <div className="sheet-screen">
      <div className="sheet-inner">
        <div className="ls-top gut">
          <button className="icon-btn" aria-label="סגירה" onClick={onClose}>{IC.x}</button>
          <h2 className="st-title">{cfg.title}</h2>
        </div>
        <div className="ls-body gut">
          {cfg.tip && <div className="tipbox">{IC.bulb}<span>{cfg.tip}</span></div>}
          <div className="chips">
            <button className="chip" aria-pressed={todo} onClick={() => setTodo(!todo)}>רק מה שעוד לא יודעים</button>
            <button className="chip" aria-pressed={hide} onClick={() => { setHide(!hide); setOpen(new Set()) }}>בחינה עצמית: להסתיר תשובות</button>
          </div>
          {!count && <div className="card" style={{ textAlign: 'center' }}><b>אתם יודעים את כל הרשימה. כל הכבוד!</b></div>}
          {groups.map((g, gi) => (
            <section className="stack" key={gi}>
              {g.title && <h3 className="st-group">{g.title} <span className="muted">· {g.ids.length}</span></h3>}
              {g.ids.map((id) => {
                const q = QBY[id]
                const shown = !hide || open.has(id)
                return (
                  <div className={'card fact' + (wrongSet.has(id) ? ' bad' : knows(id) ? ' ok' : '')} key={id}>
                    <Photo q={q} lazy />
                    <div className="q"><Hl text={q.q} /></div>
                    {shown
                      ? <div className="ans">{IC.check}<span>{q.o[q.a]}</span></div>
                      : <button className="ans hidden-ans" onClick={() => reveal(id)}>הקישו כדי לראות את התשובה</button>}
                    {shown && q.why && <div className="why">{q.why}</div>}
                    <div className="fact-foot">
                      <span>מס׳ {q.n} במאגר</span>
                      {wrongSet.has(id) ? <span className="pill fail">טעיתם</span> : knows(id) ? <span className="pill pass">יודעים</span> : null}
                    </div>
                  </div>
                )
              })}
            </section>
          ))}
        </div>
        <div className="ls-foot gut"><button className="btn btn-primary" onClick={practice}>תרגול על הרשימה הזו</button></div>
      </div>
    </div>
  )
}
