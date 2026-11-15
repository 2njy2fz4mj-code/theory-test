import { clearExam, loadExam, useStore } from '../lib/store.jsx'
import { useUI } from '../lib/ui.jsx'
import { Coach } from '../components/bits.jsx'
import { IC } from '../components/Icons.jsx'

export default function ExamsView() {
  const { S } = useStore()
  const ui = useUI()
  const saved = loadExam()
  const newExam = () => { clearExam(); ui.startExam() }
  const best = S.exams.reduce((m, e) => Math.max(m, e.c), 0)
  return (
    <>
      <Coach>סימולציה כמו במבחן האמיתי: 30 שאלות, 40 דקות, בלי הסברים באמצע.</Coach>
      <h2 className="section-title">המבחנים שלי</h2>
      <p className="muted" style={{ margin: '-10px 0 0' }}>עוברים עם 26 תשובות נכונות לפחות. בסוף תראו כל טעות.</p>
      {saved && (
        <div className="plan">
          <b className="big">יש מבחן שלא סיימתם</b>
          <span>עניתם על {saved.ans.filter((a) => a != null).length} מתוך {saved.ids.length} שאלות. הזמן נעצר כשיצאתם.</span>
          <button className="btn btn-green" onClick={() => ui.startExam(true)}>להמשיך את המבחן</button>
        </div>
      )}
      <button className={'btn ' + (saved ? 'btn-outline' : 'btn-primary')} onClick={newExam}>מבחן חדש</button>
      <button className="mode" onClick={ui.openSheet}>
        <div className="mode-ico" style={{ color: 'var(--red)', borderColor: 'var(--red)' }}>{IC.upload}</div>
        <div>
          <b>דף הטעויות מהמבחן האמיתי</b>
          <span>{S.sheet.length ? `${S.sheet.length} שאלות שמורות לתרגול` : 'נכשלתם? העלו את הדף ותרגלו בדיוק את השאלות שטעיתם בהן'}</span>
        </div>
        <div className="go-chev">{IC.chev}</div>
      </button>
      {S.exams.length ? (
        <div className="card">
          <div className="row" style={{ marginBottom: 4 }}><b>היסטוריה</b><span className="muted">שיא: {best}/30</span></div>
          {S.exams.slice().reverse().slice(0, 12).map((e, i) => (
            <div className="hist" key={i}>
              <div>
                <b style={{ fontVariantNumeric: 'tabular-nums' }}>{e.c}/{e.n}</b>{' '}
                <span className="muted">· {e.d.split('-').reverse().join('.')} · {Math.round(e.t / 60)} דק׳</span>
              </div>
              <span className={'pill ' + (e.p ? 'pass' : 'fail')}>{e.p ? 'עבר' : 'לא עבר'}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="muted">עוד לא עשיתם מבחן. מומלץ לנסות אחרי שתסיימו כמה יחידות במסלול.</p>
      )}
    </>
  )
}
