import { useState } from 'react'
import { Q } from '../lib/data.jsx'
import { useStore } from '../lib/store.jsx'
import { useUI } from '../lib/ui.jsx'
import { sfx } from '../lib/fx.js'

const GOALS = { 10: 'רגוע', 20: 'רגיל', 30: 'רציני', 50: 'מטורף' }
const isStandalone = () => {
  try { return matchMedia('(display-mode: standalone)').matches || navigator.standalone } catch { return false }
}

function Tile({ c, bg, big, title, sub }) {
  return (
    <div className="tile" style={{ '--tc': `var(${c})`, '--tb': `var(${bg})` }}>
      <div className="big">{big}</div><b>{title}</b><small>{sub}</small>
    </div>
  )
}

export default function ProfileView() {
  const { S, act, seen } = useStore()
  const ui = useUI()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(S.name)
  const acc = S.answered ? Math.round((S.correct / S.answered) * 100) : 0
  const best = S.exams.reduce((m, e) => Math.max(m, e.c), 0)

  const saveName = () => { act.setName(name.trim().slice(0, 20)); setEditing(false) }

  return (
    <>
      <div className="hero">
        <img src={`${import.meta.env.BASE_URL}icons/icon-192.png`} alt="תאוריה בקל" width="96" height="96" className="hero-logo" />
        <h1>{S.name ? `היי ${S.name}, זה הפרופיל שלך` : 'היי, זה הפרופיל שלכם'}</h1>
        <p className="muted" style={{ margin: 0 }}>כל שיעור מקרב אתכם לרישיון.</p>
        {!editing ? (
          <button className="linkish" onClick={() => setEditing(true)}>{S.name ? 'שינוי שם' : 'הוספת שם'}</button>
        ) : (
          <div style={{ width: '100%', maxWidth: 320 }}>
            <label htmlFor="nameIn" className="muted" style={{ fontSize: 14 }}>איך לקרוא לך?</label>
            <input id="nameIn" className="name-input" maxLength={20} value={name} autoFocus autoComplete="given-name"
              onChange={(e) => setName(e.target.value)} onBlur={saveName} onKeyDown={(e) => e.key === 'Enter' && saveName()} />
          </div>
        )}
      </div>
      <div className="stats">
        <Tile c="--amber-d" bg="--amber-bg" big={S.streak} title="ימי רצף" sub="לומדים כל יום" />
        <Tile c="--amber" bg="--amber-bg" big={S.xp} title="סך הכול XP" sub="שצברתם עד עכשיו" />
        <Tile c="--blue" bg="--blue-bg" big={seen.size} title="שאלות שראיתם" sub={`מתוך ${Q.length} במאגר`} />
        <Tile c="--green" bg="--green-bg" big={acc + '%'} title="דיוק" sub={S.answered + ' תשובות'} />
      </div>
      <div className="card stack">
        <b>יעד יומי</b>
        <div className="chips">
          {Object.entries(GOALS).map(([g, l]) => (
            <button key={g} className="chip" aria-pressed={S.goal === +g} onClick={() => act.setGoal(+g)}>{g} XP · {l}</button>
          ))}
        </div>
      </div>
      <div className="card stack">
        <div className="row">
          <div><b>צלילים</b><div className="muted" style={{ fontSize: 14 }}>צליל קצר לתשובה נכונה ושגויה</div></div>
          <button className="switch" role="switch" aria-checked={S.sound} aria-label="צלילים" onClick={() => { act.toggleSound(); sfx.tap() }} />
        </div>
        <div className="row">
          <div><b>שיא במבחן</b><div className="muted" style={{ fontSize: 14 }}>{S.exams.length} מבחנים</div></div>
          <b style={{ fontVariantNumeric: 'tabular-nums' }}>{best}/30</b>
        </div>
      </div>
      {!isStandalone() && (
        <div className="card">
          <b>התקנה במסך הבית</b>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: 15 }}>
            באייפון (Safari): כפתור השיתוף ואז "הוספה למסך הבית". באנדרואיד (Chrome): תפריט ⋮ ואז "התקנת אפליקציה".
            אחרי ההתקנה האפליקציה נפתחת עם הלוגו, במסך מלא, ועובדת גם בלי אינטרנט.
          </p>
        </div>
      )}
      <button className="btn btn-ghost danger" onClick={() => ui.confirm({
        title: 'לאפס הכול?', text: 'XP, רצף, שיעורים ומבחנים יימחקו מהמכשיר הזה.',
        cancel: 'ביטול', ok: 'כן, לאפס', onOk: () => { act.reset(); ui.toast('ההתקדמות אופסה') }
      })}>איפוס כל ההתקדמות</button>
    </>
  )
}
