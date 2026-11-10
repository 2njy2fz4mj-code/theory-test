import { useStore } from '../lib/store.jsx'
import { useUI } from '../lib/ui.jsx'
import { Coach } from '../components/bits.jsx'

export default function ExamsView() {
  const { S } = useStore()
  const ui = useUI()
  const best = S.exams.reduce((m, e) => Math.max(m, e.c), 0)
  return (
    <>
      <Coach>סימולציה כמו במבחן האמיתי: 30 שאלות, 40 דקות, בלי הסברים באמצע.</Coach>
      <h2 className="section-title">המבחנים שלי</h2>
      <p className="muted" style={{ margin: '-10px 0 0' }}>עוברים עם 26 תשובות נכונות לפחות. בסוף תראו כל טעות.</p>
      <button className="btn btn-primary" onClick={ui.startExam}>מבחן חדש</button>
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
