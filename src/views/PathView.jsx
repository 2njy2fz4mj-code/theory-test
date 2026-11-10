import { useEffect, useRef } from 'react'
import { ALL_LESSONS, Q, UNITS, shuffle } from '../lib/data.jsx'
import { dayStr, useStore } from '../lib/store.jsx'
import { useUI } from '../lib/ui.jsx'
import { buzz } from '../lib/fx.js'
import { IC } from '../components/Icons.jsx'
import { Ring } from '../components/bits.jsx'
import Mascot from '../components/Mascot.jsx'

const OFFS = [0, -45, -70, -45, 0, 45, 70, 45]

function ExamPlan() {
  const { S, act, seen } = useStore()
  const left = Q.length - seen.size
  const days = S.examDate
    ? Math.ceil((new Date(S.examDate + 'T12:00') - new Date(dayStr() + 'T12:00')) / 864e5)
    : null
  const input = (
    <div className="row">
      <label htmlFor="examDate" className="muted" style={{ fontSize: 14 }}>תאריך המבחן</label>
      <input type="date" id="examDate" value={S.examDate} onChange={(e) => act.setExamDate(e.target.value)} />
    </div>
  )
  if (days == null || days < 0) {
    return (
      <div className="plan">
        <b className="big">מתי המבחן?</b>
        <span>הזינו תאריך, ואחשב כמה שאלות ללמוד כל יום.</span>
        {input}
      </div>
    )
  }
  const per = days > 0 ? Math.ceil(left / days) : left
  return (
    <div className="plan">
      <b className="big">{days === 0 ? 'המבחן היום! בהצלחה' : days === 1 ? 'המבחן מחר' : `עוד ${days} ימים למבחן`}</b>
      <span>
        {left
          ? <>כדי לעבור על כל המאגר: בערך <b>{per}</b> שאלות חדשות ביום. ותרגלו את "הטעויות שלי".</>
          : 'עברתם על כל המאגר. עכשיו סימולציות ו"הטעויות שלי".'}
      </span>
      {input}
    </div>
  )
}

export default function PathView() {
  const { S, seen } = useStore()
  const ui = useUI()
  const curRef = useRef(null)

  let globalCur = null
  for (const u of UNITS) {
    const l = u.lessons.find((l, i) => !S.done[l.id] && (i === 0 || S.done[u.lessons[i - 1].id]))
    if (l) { globalCur = l.id; break }
  }

  useEffect(() => {
    const t = setTimeout(() => curRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 60)
    return () => clearTimeout(t)
  }, [])

  const open = (u, l, i) => {
    if (i > 0 && !S.done[u.lessons[i - 1].id]) {
      buzz(30)
      ui.toast('קודם מסיימים את ' + u.lessons[i - 1].title)
      return
    }
    const ids = l.type === 'review' ? shuffle(l.qs).slice(0, l.count) : l.qs
    ui.startLesson({ mode: 'lesson', lesson: l, label: u.title, ids, shuffle: l.type === 'review' })
  }

  return (
    <>
      <div className="ready">
        <Ring p={seen.size / Q.length} />
        <div>
          <h3>המאגר הרשמי</h3>
          <p>ראיתם {seen.size} מתוך {Q.length} שאלות · המבחן: 30 שאלות, 40 דקות, עד 4 טעויות</p>
        </div>
      </div>
      <ExamPlan />
      {UNITS.map((u, ui2) => {
        const dn = u.lessons.filter((l) => S.done[l.id]).length
        return (
          <section className="unit" key={u.id} style={{ '--uc': `var(--${u.c})`, '--ucd': `var(--${u.c}-d)` }}>
            <div className="unit-head">
              <div>
                <div className="unit-eyebrow">יחידה {ui2 + 1}</div>
                <h2>{u.title}</h2>
                <p>{u.sub}</p>
              </div>
              <div className="unit-count">{dn}/{u.lessons.length}</div>
            </div>
            <div className="nodes">
              {u.lessons.map((l, li) => {
                const unlocked = li === 0 || !!S.done[u.lessons[li - 1].id]
                const done = !!S.done[l.id]
                const cur = l.id === globalCur
                const off = OFFS[li % OFFS.length]
                const ico = done ? IC.check : !unlocked ? IC.lock : l.type === 'review' ? IC.trophy : cur ? IC.star : IC.book
                return (
                  <div key={l.id} ref={cur ? curRef : null} className={'node-row' + (cur ? ' current' : '')} style={{ transform: `translateX(${off}px)` }}>
                    {cur && <div className="start-tip">התחילו</div>}
                    <button
                      className={['node', done ? 'done' : !unlocked ? 'locked' : '', l.type === 'review' ? 'review' : ''].join(' ')}
                      aria-label={`${u.title}: ${l.title}${done ? ' (הושלם)' : !unlocked ? ' (נעול)' : ''}`}
                      onClick={() => open(u, l, li)}
                    >{ico}</button>
                    <div className="node-label">{l.title}</div>
                    {cur && (
                      <div className="side-mascot bob" style={off <= 0 ? { right: -130 } : { left: -130 }}>
                        <Mascot size={84} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
    </>
  )
}

export const lessonCount = ALL_LESSONS.length
