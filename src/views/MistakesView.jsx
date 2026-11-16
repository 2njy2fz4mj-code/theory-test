import { QBY, pickSet, shuffle } from '../lib/data.jsx'
import { sheetIds } from '../lib/progress.js'
import { useStore } from '../lib/store.jsx'
import { useUI } from '../lib/ui.jsx'
import { IC } from '../components/Icons.jsx'

const niceDate = (d) => d.split('-').reverse().join('.')

/* Everything the learner got wrong, in one place: in the app, again and again, and in the real tests */
export default function MistakesView() {
  const { S, seen } = useStore()
  const ui = useUI()
  const wrongSet = new Set(S.wrong)
  const knows = (id) => seen.has(id) && !wrongSet.has(id)
  const again = Object.keys(S.miss).filter((id) => QBY[id] && S.miss[id] >= 2).sort((a, b) => S.miss[b] - S.miss[a])
  const all = sheetIds(S.sheets)
  const repeated = all.filter((id) => S.sheets.filter((s) => s.ids.includes(id)).length > 1)

  const practise = (label, ids) => ui.startLesson({ mode: 'practice', label, ids })
  const list = (title, ids, tip) => ui.startStudy({ title, tip, groups: [{ ids }], practiceIds: ids, all: true })

  return (
    <>
      <div>
        <h2 className="section-title">הטעויות שלי</h2>
        <p className="muted" style={{ margin: '2px 0 0' }}>כל מה שטעיתם בו, במקום אחד. שאלה יוצאת מכאן כשעונים עליה נכון.</p>
      </div>

      <section className="trap" style={{ '--tc': 'var(--red)' }}>
        <div className="trap-head">
          <div className="mode-ico">{IC.redo}</div>
          <div><h3>טעויות מהתרגול באפליקציה</h3><span>{S.wrong.length ? (S.wrong.length === 1 ? 'שאלה אחת מחכה' : `${S.wrong.length} שאלות מחכות`) : 'אין טעויות פתוחות. כל הכבוד!'}</span></div>
        </div>
        {S.wrong.length > 0 && (
          <div className="trap-btns">
            <button className="btn btn-primary" onClick={() => practise('הטעויות שלי', shuffle(S.wrong))}>תרגול</button>
            <button className="btn btn-outline" onClick={() => list('טעויות מהתרגול', S.wrong)}>רשימה</button>
          </div>
        )}
      </section>

      {again.length > 0 && (
        <section className="trap" style={{ '--tc': 'var(--amber)' }}>
          <div className="trap-head">
            <div className="mode-ico">{IC.target}</div>
            <div><h3>טעיתם בהן יותר מפעם אחת</h3><span>{again.length === 1 ? 'שאלה אחת' : `${again.length} שאלות`}, מהקשה לקלה</span></div>
          </div>
          <div className="trap-btns">
            <button className="btn btn-primary" onClick={() => practise('שאלות שחוזרות', again)}>תרגול</button>
            <button className="btn btn-outline" onClick={() => list('טעיתם בהן יותר מפעם אחת', again)}>רשימה</button>
          </div>
        </section>
      )}

      <div>
        <h2 className="section-title">מבחנים אמיתיים שנכשלתי בהם</h2>
        <p className="muted" style={{ margin: '2px 0 0' }}>מעלים את דף הטעויות שקיבלתם, ומתרגלים בדיוק את השאלות האלה. אפשר להוסיף כמה מבחנים שרוצים.</p>
      </div>
      <div className="tipbox private">{IC.lockSm}<span><b>רק אתם רואים את זה.</b> הדפים נשמרים במכשיר הזה בלבד ולא נשלחים לשום מקום.</span></div>

      <div className="stack">
        {S.sheets.map((s, i) => (
          <button key={s.id} className="mode" onClick={() => ui.openSheet(s.id)}>
            <div className="mode-ico" style={{ color: 'var(--red)', borderColor: 'var(--red)' }}>{IC.file}</div>
            <div>
              <b>מבחן {i + 1}</b>
              <span>{niceDate(s.d)} · {s.ids.length === 1 ? 'שאלה אחת' : `${s.ids.length} שאלות`} · יודעים {s.ids.filter(knows).length}</span>
            </div>
            <div className="go-chev">{IC.chev}</div>
          </button>
        ))}
        <button className="btn btn-outline add-exam" onClick={() => ui.openSheet(null)}>{IC.plus} {S.sheets.length ? 'הוספת מבחן נוסף' : 'העלאת דף טעויות'}</button>
      </div>

      {all.length > 0 && (
        <section className="trap" style={{ '--tc': 'var(--blue)' }}>
          <div className="trap-head">
            <div className="mode-ico">{IC.book}</div>
            <div>
              <h3>כל השאלות מכל המבחנים</h3>
              <span>{all.length} שאלות · יודעים {all.filter(knows).length}{repeated.length ? ` · ${repeated.length} חזרו ביותר ממבחן אחד` : ''}</span>
            </div>
          </div>
          <div className="bar"><div className="fill" style={{ width: (all.filter(knows).length / all.length) * 100 + '%' }} /></div>
          <div className="trap-btns">
            <button className="btn btn-primary" onClick={() => practise('המבחנים האמיתיים שלי', pickSet(all, seen, wrongSet, all.length))}>תרגול על כולן</button>
            <button className="btn btn-outline" onClick={() => list('כל השאלות מכל המבחנים', all)}>רשימה</button>
          </div>
        </section>
      )}
    </>
  )
}
