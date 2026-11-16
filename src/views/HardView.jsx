import { TRAPS, TRAP_IDS, pickSet } from '../lib/data.jsx'
import { useStore } from '../lib/store.jsx'
import { useUI } from '../lib/ui.jsx'
import { IC } from '../components/Icons.jsx'
import { Coach } from '../components/bits.jsx'

const ICONS = { numbers: IC.gauge, signs: IC.sign, junction: IC.cross, wording: IC.eye }

/* The questions that are easiest to fail: by kind, each with a tip, a practice set and a list to memorise */
export default function HardView() {
  const { S, seen } = useStore()
  const ui = useUI()
  const wrongSet = new Set(S.wrong)
  const knows = (id) => seen.has(id) && !wrongSet.has(id)

  const known = TRAP_IDS.filter(knows).length

  const practice = (label, ids, trap) => {
    const set = pickSet(ids, seen, wrongSet)
    if (!set.length) return ui.toast('אין שאלות לתרגול כרגע')
    ui.startLesson({ mode: 'practice', label, ids: set, trap })
  }

  return (
    <>
      <Coach>רוב הנכשלים נופלים באותם סוגי שאלות. כאן הם מרוכזים, עם טיפ קצר לכל סוג.</Coach>
      <div>
        <h2 className="section-title">שאלות מכשילות</h2>
        <p className="muted" style={{ margin: '2px 0 0' }}>
          {TRAP_IDS.length} שאלות מהמאגר · אתם כבר יודעים {known}
        </p>
      </div>

      {TRAPS.map((t) => {
        const k = t.ids.filter(knows).length
        return (
          <section className="trap" key={t.k} style={{ '--tc': `var(--${t.c})`, '--tcd': `var(--${t.c}-d)` }}>
            <div className="trap-head">
              <div className="mode-ico">{ICONS[t.k]}</div>
              <div><h3>{t.title}</h3><span>{t.ids.length} שאלות · יודעים {k}</span></div>
            </div>
            <div className="bar" role="img" aria-label={`יודעים ${k} מתוך ${t.ids.length}`}>
              <div className="fill" style={{ width: (k / t.ids.length) * 100 + '%' }} />
            </div>
            <p className="trap-tip">{t.tip}</p>
            <div className="trap-btns">
              <button className="btn btn-primary" onClick={() => practice(t.title, t.ids, t)}>תרגול</button>
              <button className="btn btn-outline" onClick={() => ui.startStudy({
                title: t.title, tip: t.tip, practiceIds: t.ids, trap: t,
                groups: t.groups.length ? t.groups : [{ ids: t.ids }]
              })}>רשימה לשינון</button>
            </div>
          </section>
        )
      })}
      <p className="muted" style={{ fontSize: 14, margin: 0 }}>
        משרד התחבורה לא מפרסם באילו שאלות נכשלים הכי הרבה. הרשימה נבנתה לפי סוגי השאלות שקל לטעות בהם. הטעויות האישיות שלכם נמצאות בלשונית "טעויות".
      </p>
    </>
  )
}
