import { useState } from 'react'
import { Q, TOPICS, UNITS, VEHICLE, pickSet, shuffle } from '../lib/data.jsx'
import { lessonSize, nextLesson } from '../lib/progress.js'
import { useStore } from '../lib/store.jsx'
import { useUI } from '../lib/ui.jsx'
import { buzz, sfx } from '../lib/fx.js'
import { IC } from '../components/Icons.jsx'

/* Learn: the lessons in order (one unit open at a time), and free practice below */
export default function LearnView() {
  const { S, seen } = useStore()
  const ui = useUI()
  const cur = nextLesson(S.done)
  const [open, setOpen] = useState(cur?.u.id || UNITS[0].id)
  const [topics, setTopics] = useState(() => new Set(TOPICS.map((_, i) => i)))

  const start = (u, l, i) => {
    if (i > 0 && !S.done[u.lessons[i - 1].id]) {
      buzz(30)
      ui.toast('קודם מסיימים את ' + u.lessons[i - 1].title)
      return
    }
    const ids = l.type === 'review' ? shuffle(l.qs).slice(0, l.count) : l.qs
    ui.startLesson({ mode: 'lesson', lesson: l, label: u.title, ids, shuffle: l.type === 'review' })
  }

  const wrongSet = new Set(S.wrong)
  const VQ = Q.filter((q) => q.t === VEHICLE)
  const inTopics = Q.filter((q) => topics.has(q.t))
  const nw = inTopics.filter((q) => !seen.has(q.id)).length
  const allTopics = topics.size === TOPICS.length
  const pics = Q.filter((q) => q.img).length
  const modes = [
    ['new', 'שאלות שעוד לא ראיתם', nw ? `נשארו ${nw} שאלות חדשות${allTopics ? '' : ' בנושאים שבחרתם'}` : 'ראיתם את כל השאלות האלה', '--green', IC.star, !nw],
    ['mix', 'תרגול מעורבב', `10 שאלות אקראיות${allTopics ? ' מכל המאגר' : ' מהנושאים שבחרתם'}`, '--blue', IC.shuffle, false],
    ['signs', 'שאלות עם תמונה', `${pics} שאלות עם תמרור או צילום מהדרך`, '--amber', IC.sign, false],
    ['vehicle', 'הכרת הרכב', `10 שאלות מתוך ${VQ.length}, עם הסבר לכל שאלה`, '--slate', IC.car, false],
    ['vehicleAll', 'מרתון הכרת הרכב', `כל ${VQ.length} השאלות ברצף`, '--slate', IC.gauge, false]
  ]
  const toggleTopic = (i) => {
    sfx.tap()
    const n = new Set(topics)
    if (n.has(i)) {
      if (n.size === 1) { ui.toast('צריך לפחות נושא אחד'); return }
      n.delete(i)
    } else n.add(i)
    setTopics(n)
  }
  const practise = (mode) => {
    let ids
    let label
    if (mode === 'vehicle') { ids = pickSet(VQ.map((q) => q.id), seen, wrongSet); label = 'הכרת הרכב' }
    else if (mode === 'vehicleAll') { ids = shuffle(VQ.map((q) => q.id)); label = 'מרתון הכרת הרכב' }
    else if (mode === 'signs') { ids = shuffle(Q.filter((q) => q.img).map((q) => q.id)).slice(0, 10); label = 'שאלות עם תמונה' }
    else if (mode === 'new') { ids = inTopics.filter((q) => !seen.has(q.id)).map((q) => q.id).slice(0, 10); label = 'שאלות חדשות' }
    else { ids = shuffle(inTopics.map((q) => q.id)).slice(0, 10); label = 'תרגול מעורבב' }
    if (!ids.length) { ui.toast('אין שאלות לתרגול כרגע'); return }
    ui.startLesson({ mode: 'practice', label, ids })
  }

  return (
    <>
      <div>
        <h2 className="section-title">לומדים לפי הסדר</h2>
        <p className="muted" style={{ margin: '2px 0 0' }}>בכל שיעור 10 שאלות. מסיימים שיעור, והבא נפתח.</p>
      </div>
      <div className="stack">
        {UNITS.map((u, ui2) => {
          const dn = u.lessons.filter((l) => S.done[l.id]).length
          const isOpen = open === u.id
          return (
            <section className={'unit2' + (isOpen ? ' open' : '')} key={u.id} style={{ '--uc': `var(--${u.c})`, '--ucd': `var(--${u.c}-d)` }}>
              <button className="unit2-head" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : u.id)}>
                <div className="unit2-no">{ui2 + 1}</div>
                <div>
                  <b>{u.title}</b>
                  <span>{dn === u.lessons.length ? 'סיימתם את היחידה' : `${dn} מתוך ${u.lessons.length} שיעורים`}</span>
                  <div className="bar"><div className="fill" style={{ width: (dn / u.lessons.length) * 100 + '%' }} /></div>
                </div>
                <div className="unit2-chev">{IC.down}</div>
              </button>
              {isOpen && (
                <div className="tiles">
                  {u.lessons.map((l, li) => {
                    const done = !!S.done[l.id]
                    const unlocked = li === 0 || !!S.done[u.lessons[li - 1].id]
                    const isCur = cur && l.id === cur.l.id
                    return (
                      <button key={l.id} className={'tile2' + (done ? ' done' : !unlocked ? ' locked' : '') + (isCur ? ' cur' : '')}
                        aria-label={`${l.title}${done ? ' (הושלם)' : !unlocked ? ' (נעול)' : ''}`} onClick={() => start(u, l, li)}>
                        <span className="tile2-ico">{done ? IC.check : !unlocked ? IC.lock : l.type === 'review' ? IC.trophy : li + 1}</span>
                        <span className="tile2-txt">{l.type === 'review' ? 'חזרה' : isCur ? 'הבא בתור' : `${lessonSize(l)} שאלות`}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </section>
          )
        })}
      </div>

      <div>
        <h2 className="section-title">תרגול חופשי</h2>
        <p className="muted" style={{ margin: '2px 0 0' }}>סט קצר בלי קשר לסדר. מקישים ומתחילים.</p>
      </div>
      <div className="stack">
        {modes.map(([k, t, s, c, ic, dis], i) => (
          <div key={k} className="stack">
            <button className="mode" disabled={dis} onClick={() => practise(k)}>
              <div className="mode-ico" style={{ color: `var(${c})`, borderColor: `var(${c})` }}>{ic}</div>
              <div><b>{t}</b><span>{s}</span></div>
              <div className="go-chev">{IC.chev}</div>
            </button>
            {i === 1 && (
              <div className="filter">
                <span className="muted">אילו נושאים יופיעו בשני התרגולים האלה:</span>
                <div className="chips">
                  {TOPICS.map((t2, ti) => (
                    <button key={t2.k} className="chip" aria-pressed={topics.has(ti)} onClick={() => toggleTopic(ti)}>{t2.title}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )
}
