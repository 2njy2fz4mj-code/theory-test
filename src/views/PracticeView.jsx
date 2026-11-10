import { useState } from 'react'
import { Q, TOPICS, VEHICLE, shuffle } from '../lib/data.jsx'
import { useStore } from '../lib/store.jsx'
import { useUI } from '../lib/ui.jsx'
import { sfx } from '../lib/fx.js'
import { IC } from '../components/Icons.jsx'
import { Coach } from '../components/bits.jsx'

export default function PracticeView() {
  const { S, seen } = useStore()
  const ui = useUI()
  const [mode, setMode] = useState('new')
  const [topics, setTopics] = useState(() => new Set(TOPICS.map((_, i) => i)))

  const wrongSet = new Set(S.wrong)
  const VQ = Q.filter((q) => q.t === VEHICLE)
  const vSeen = VQ.filter((q) => seen.has(q.id)).length
  const vWrong = VQ.filter((q) => wrongSet.has(q.id)).length
  const signs = Q.filter((q) => q.img).length
  const nw = Q.length - seen.size
  const wn = S.wrong.length

  const modes = [
    ['new', 'שאלות שעוד לא ראיתם', nw ? `נשארו ${nw} שאלות חדשות במאגר` : 'ראיתם את כל המאגר', '--green', IC.star, !nw],
    ['vehicle', 'הכרת הרכב: 10 שאלות', `ראיתם ${vSeen}/${VQ.length}${vWrong ? ` · ${vWrong} טעויות לתקן` : ''} · עם הסבר לכל שאלה`, '--slate', IC.car, false],
    ['vehicleAll', 'מרתון הכרת הרכב', `כל ${VQ.length} השאלות של הנושא ברצף`, '--slate', IC.gauge, false],
    ['mix', 'תרגול מעורבב', '10 שאלות מהנושאים שתבחרו', '--blue', IC.shuffle, false],
    ['wrong', 'הטעויות שלי', wn ? `${wn} שאלות שכדאי לחזור עליהן` : 'אין טעויות כרגע. כל הכבוד', '--red', IC.redo, !wn],
    ['signs', 'שאלות עם תמונה', `${signs} שאלות עם תמרור או צילום מצב בדרך`, '--amber', IC.sign, false]
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

  const go = () => {
    let ids
    let label
    if (mode === 'wrong') { ids = shuffle(S.wrong).slice(0, 10); label = 'הטעויות שלי' }
    else if (mode === 'vehicle') {
      const V = VQ.map((q) => q.id)
      const w = shuffle(V.filter((id) => wrongSet.has(id)))
      const u = shuffle(V.filter((id) => !seen.has(id) && !wrongSet.has(id)))
      const r = shuffle(V.filter((id) => seen.has(id) && !wrongSet.has(id)))
      ids = w.concat(u, r).slice(0, 10)
      label = 'הכרת הרכב'
    } else if (mode === 'vehicleAll') { ids = shuffle(VQ.map((q) => q.id)); label = 'מרתון הכרת הרכב' }
    else if (mode === 'signs') { ids = shuffle(Q.filter((q) => q.img).map((q) => q.id)).slice(0, 10); label = 'שאלות עם תמונה' }
    else if (mode === 'new') {
      ids = Q.filter((q) => topics.has(q.t) && !seen.has(q.id)).map((q) => q.id).slice(0, 10)
      label = 'שאלות חדשות'
      if (!ids.length) { ui.toast('ראיתם את כל השאלות בנושאים האלה'); return }
    } else { ids = shuffle(Q.filter((q) => topics.has(q.t)).map((q) => q.id)).slice(0, 10); label = 'תרגול מעורבב' }
    if (!ids.length) { ui.toast('אין שאלות לתרגול כרגע'); return }
    ui.startLesson({ mode: 'practice', label, ids })
  }

  return (
    <>
      <Coach>בחרו סוג תרגול, ואני אכין לכם סט קצר.</Coach>
      <h2 className="section-title">מה תרצו לתרגל?</h2>
      <div className="stack">
        {modes.map(([k, t, s, c, ic, dis]) => (
          <button key={k} className="mode" aria-pressed={mode === k} disabled={dis} onClick={() => { sfx.tap(); setMode(k) }}>
            <div className="mode-ico" style={{ color: `var(${c})`, borderColor: `var(${c})` }}>{ic}</div>
            <div><b>{t}</b><span>{s}</span></div>
            <div className="check-dot">{mode === k ? IC.check : null}</div>
          </button>
        ))}
      </div>
      {(mode === 'mix' || mode === 'new') && (
        <div className="stack">
          <h3>נושאים</h3>
          <div className="chips">
            {TOPICS.map((t, i) => (
              <button key={t.k} className="chip" aria-pressed={topics.has(i)} onClick={() => toggleTopic(i)}>{t.title}</button>
            ))}
          </div>
        </div>
      )}
      <button className="btn btn-primary" onClick={go}>יאללה, מתחילים</button>
    </>
  )
}
