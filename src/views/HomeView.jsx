import { Q, TRAP_IDS, shuffle } from '../lib/data.jsx'
import { lessonSize, nextLesson, sheetIds } from '../lib/progress.js'
import { dayStr, useStore } from '../lib/store.jsx'
import { useUI } from '../lib/ui.jsx'
import { IC } from '../components/Icons.jsx'
import { Ring } from '../components/bits.jsx'

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
        <b className="big">מתי המבחן שלכם?</b>
        <span>הזינו תאריך, ואחשב כמה שאלות ללמוד כל יום.</span>
        {input}
      </div>
    )
  }
  const per = days > 0 ? Math.ceil(left / days) : left
  return (
    <div className="plan">
      <b className="big">{days === 0 ? 'המבחן היום! בהצלחה' : days === 1 ? 'המבחן מחר' : `עוד ${days} ימים למבחן`}</b>
      <span>{left ? <>כדי לעבור על כל המאגר: בערך <b>{per}</b> שאלות חדשות ביום.</> : 'עברתם על כל המאגר. עכשיו חוזרים על הטעויות ועושים מבחנים.'}</span>
      {input}
    </div>
  )
}

/* Home: where you stand, the one thing to do next, and the four steps to passing */
export default function HomeView() {
  const { S, seen } = useStore()
  const ui = useUI()
  const cur = nextLesson(S.done)
  const started = Object.keys(S.done).length > 0
  const wrongSet = new Set(S.wrong)
  const trapKnown = TRAP_IDS.filter((id) => seen.has(id) && !wrongSet.has(id)).length
  const mistakes = new Set([...S.wrong, ...sheetIds(S.sheets)]).size
  const best = S.exams.reduce((m, e) => Math.max(m, e.c), 0)

  const startNext = () => {
    const { u, l } = cur
    const ids = l.type === 'review' ? shuffle(l.qs).slice(0, l.count) : l.qs
    ui.startLesson({ mode: 'lesson', lesson: l, label: u.title, ids, shuffle: l.type === 'review' })
  }

  const steps = [
    ['learn', 'לומדים את החומר', 'שיעורים קצרים של 10 שאלות, לפי הסדר', `${seen.size} מתוך ${Q.length} שאלות`, seen.size / Q.length, '--blue'],
    ['hard', 'מתרגלים את המכשילות', 'השאלות שהכי קל ליפול בהן, עם טיפ לכל סוג', `יודעים ${trapKnown} מתוך ${TRAP_IDS.length}`, trapKnown / TRAP_IDS.length, '--amber'],
    ['mistakes', 'חוזרים על הטעויות', 'מה שטעיתם בו כאן, וגם במבחן האמיתי', mistakes ? `${mistakes} שאלות מחכות לכם` : 'אין טעויות פתוחות', null, '--red'],
    ['exams', 'עושים מבחן לדוגמה', '30 שאלות ב-40 דקות, כמו במבחן', S.exams.length ? `השיא שלכם: ${best}/30` : 'עוד לא ניסיתם', null, '--green']
  ]

  return (
    <>
      <div className="ready">
        <Ring p={seen.size / Q.length} />
        <div>
          <h3>{S.name ? `היי ${S.name}!` : 'היי!'}</h3>
          <p>למדתם {seen.size} מתוך {Q.length} השאלות שבמאגר הרשמי</p>
        </div>
      </div>

      {cur && (
        <button className="btn btn-green cta" onClick={startNext}>
          <span>{started ? 'ממשיכים ללמוד' : 'מתחילים ללמוד'}</span>
          <small>{cur.u.title} · {cur.l.title} · {lessonSize(cur.l)} שאלות</small>
        </button>
      )}

      <div>
        <h2 className="section-title">איך עוברים את התאוריה?</h2>
        <p className="muted" style={{ margin: '2px 0 0' }}>ארבעה שלבים. הקישו על שלב כדי לעבור אליו.</p>
      </div>
      <div className="stack">
        {steps.map(([to, title, sub, status, p, c], i) => (
          <button key={to} className="step-card" style={{ '--tc': `var(${c})` }} onClick={() => ui.go(to)}>
            <div className="step-no">{i + 1}</div>
            <div>
              <b>{title}</b>
              <span>{sub}</span>
              <em>{status}</em>
              {p != null && <div className="bar"><div className="fill" style={{ width: p * 100 + '%' }} /></div>}
            </div>
            <div className="go-chev">{IC.chev}</div>
          </button>
        ))}
      </div>
      <ExamPlan />
    </>
  )
}
