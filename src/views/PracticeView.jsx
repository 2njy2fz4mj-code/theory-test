import { useState } from 'react'
import { Q, TOPICS, VEHICLE, pickSet, shuffle } from '../lib/data.jsx'
import { useStore } from '../lib/store.jsx'
import { useUI } from '../lib/ui.jsx'
import { sfx } from '../lib/fx.js'
import { IC } from '../components/Icons.jsx'
import { Coach } from '../components/bits.jsx'

export default function PracticeView() {
  const { S, seen } = useStore()
  const ui = useUI()
  const [topics, setTopics] = useState(() => new Set(TOPICS.map((_, i) => i)))

  const wrongSet = new Set(S.wrong)
  const VQ = Q.filter((q) => q.t === VEHICLE)
  const vSeen = VQ.filter((q) => seen.has(q.id)).length
  const vWrong = VQ.filter((q) => wrongSet.has(q.id)).length
  const signs = Q.filter((q) => q.img).length
  const inTopics = Q.filter((q) => topics.has(q.t))
  const nw = inTopics.filter((q) => !seen.has(q.id)).length
  const wn = S.wrong.length
  const allTopics = topics.size === TOPICS.length

  const modes = [
    ['wrong', 'הטעויות שלי', wn === 1 ? 'שאלה אחת שכדאי לחזור עליה' : wn ? `${wn} שאלות שכדאי לחזור עליהן` : 'אין טעויות כרגע. כל הכבוד', '--red', IC.redo, !wn],
    ['new', 'שאלות שעוד לא ראיתם', nw ? `נשארו ${nw} שאלות חדשות${allTopics ? ' במאגר' : ' בנושאים שבחרתם'}` : 'ראיתם את כל השאלות האלה', '--green', IC.star, !nw],
    ['mix', 'תרגול מעורבב', `10 שאלות אקראיות${allTopics ? ' מכל המאגר' : ' מהנושאים שבחרתם'}`, '--blue', IC.shuffle, false],
    ['signs', 'שאלות עם תמונה', `${signs} שאלות עם תמרור או צילום מצב בדרך`, '--amber', IC.sign, false],
    ['vehicle', 'הכרת הרכב: 10 שאלות', `ראיתם ${vSeen}/${VQ.length}${vWrong ? ` · ${vWrong} טעויות לתקן` : ''} · עם הסבר לכל שאלה`, '--slate', IC.car, false],
    ['vehicleAll', 'מרתון הכרת הרכב', `כל ${VQ.length} השאלות של הנושא ברצף`, '--slate', IC.gauge, false]
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

  const go = (mode) => {
    let ids
    let label
    if (mode === 'wrong') { ids = shuffle(S.wrong).slice(0, 10); label = 'הטעויות שלי' }
    else if (mode === 'vehicle') { ids = pickSet(VQ.map((q) => q.id), seen, wrongSet); label = 'הכרת הרכב' }
    else if (mode === 'vehicleAll') { ids = shuffle(VQ.map((q) => q.id)); label = 'מרתון הכרת הרכב' }
    else if (mode === 'signs') { ids = shuffle(Q.filter((q) => q.img).map((q) => q.id)).slice(0, 10); label = 'שאלות עם תמונה' }
    else if (mode === 'new') { ids = inTopics.filter((q) => !seen.has(q.id)).map((q) => q.id).slice(0, 10); label = 'שאלות חדשות' }
    else { ids = shuffle(inTopics.map((q) => q.id)).slice(0, 10); label = 'תרגול מעורבב' }
    if (!ids.length) { ui.toast('אין שאלות לתרגול כרגע'); return }
    ui.startLesson({ mode: 'practice', label, ids })
  }

  return (
    <>
      <Coach>הקישו על סוג תרגול, ומתחילים מיד סט קצר.</Coach>
      <h2 className="section-title">מה תרצו לתרגל?</h2>
      <div className="stack">
        {modes.slice(0, 3).map(([k, t, s, c, ic, dis]) => (
          <button key={k} className="mode" disabled={dis} onClick={() => go(k)}>
            <div className="mode-ico" style={{ color: `var(${c})`, borderColor: `var(${c})` }}>{ic}</div>
            <div><b>{t}</b><span>{s}</span></div>
            <div className="go-chev">{IC.chev}</div>
          </button>
        ))}
        <div className="filter">
          <span className="muted">נושאים לשאלות חדשות ולתרגול מעורבב:</span>
          <div className="chips">
            {TOPICS.map((t, i) => (
              <button key={t.k} className="chip" aria-pressed={topics.has(i)} onClick={() => toggleTopic(i)}>{t.title}</button>
            ))}
          </div>
        </div>
      </div>
      <h3>עוד תרגולים</h3>
      <div className="stack">
        {modes.slice(3).map(([k, t, s, c, ic, dis]) => (
          <button key={k} className="mode" disabled={dis} onClick={() => go(k)}>
            <div className="mode-ico" style={{ color: `var(${c})`, borderColor: `var(${c})` }}>{ic}</div>
            <div><b>{t}</b><span>{s}</span></div>
            <div className="go-chev">{IC.chev}</div>
          </button>
        ))}
      </div>
    </>
  )
}
