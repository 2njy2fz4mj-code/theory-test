import { useEffect, useRef, useState } from 'react'
import { Hl, QBY, pickSet } from '../lib/data.jsx'
import { useStore } from '../lib/store.jsx'
import { useBack, useUI } from '../lib/ui.jsx'
import { clearPages, loadPages, readSheet, savePages, searchBank } from '../lib/sheet.js'
import { IC } from '../components/Icons.jsx'
import { Photo } from '../components/bits.jsx'

function Fact({ q, children }) {
  return (
    <div className="card fact">
      <Photo q={q} lazy small />
      <div className="q"><Hl text={q.q} /></div>
      <div className="ans">{IC.check}<span>{q.o[q.a]}</span></div>
      {q.why && <div className="why">{q.why}</div>}
      <div className="fact-foot"><span>מס׳ {q.n} במאגר</span>{children}</div>
    </div>
  )
}

/* The mistakes sheet from the real test: upload it, confirm the questions that were found, practise them */
export default function MySheet({ onClose }) {
  const { S, act, seen } = useStore()
  const ui = useUI()
  const [busy, setBusy] = useState(null)      // { p, label } while reading
  const [found, setFound] = useState(null)    // [{ id, on }] waiting to be confirmed
  const [pages, setPages] = useState([])
  const [zoom, setZoom] = useState(null)
  const [term, setTerm] = useState('')
  const [adding, setAdding] = useState(false)
  const fileRef = useRef(null)
  const pending = useRef([])
  useBack(() => (zoom ? setZoom(null) : found ? setFound(null) : onClose()))
  useEffect(() => { loadPages().then(setPages) }, [])

  const upload = async (e) => {
    const files = [...e.target.files]
    e.target.value = ''
    if (!files.length) return
    setBusy({ p: 0, label: 'מתחיל' })
    try {
      const r = await readSheet(files, (p, label) => setBusy({ p, label }))
      pending.current = r.pages
      const fresh = r.found.filter((f) => !S.sheet.includes(f.id))
      if (!r.found.length) ui.toast('לא זיהיתי שאלות בדף. נסו צילום חד וישר, או הוסיפו ידנית.')
      else if (!fresh.length) ui.toast('כל השאלות שבדף כבר שמורות אצלכם')
      else setFound(fresh.map((f) => ({ id: f.id, on: true })))
      if (r.found.length) { await savePages(r.pages); setPages(await loadPages()) }
    } catch {
      ui.toast('לא הצלחתי לקרוא את הקובץ. נסו תמונה אחרת.')
    }
    setBusy(null)
  }

  const confirmFound = () => {
    const ids = found.filter((f) => f.on).map((f) => f.id)
    act.addSheet(ids)
    setFound(null)
    ui.toast(ids.length === 1 ? 'שאלה אחת נשמרה' : `${ids.length} שאלות נשמרו`)
  }
  const practise = () => {
    const ids = pickSet(S.sheet, new Set(), new Set(S.wrong), 30)
    onClose()
    ui.startLesson({ mode: 'practice', label: 'דף הטעויות שלי', ids })
  }
  const wipe = () => ui.confirm({
    title: 'למחוק את דף הטעויות?', text: 'השאלות השמורות והדפים שהעליתם יימחקו מהמכשיר.',
    cancel: 'ביטול', ok: 'מחיקה', onOk: () => { act.clearSheet(); clearPages(); setPages([]) }
  })

  const results = adding ? searchBank(term).filter((q) => !S.sheet.includes(q.id)) : []
  const knows = (id) => seen.has(id) && !S.wrong.includes(id)

  return (
    <div className="sheet-screen">
      <div className="sheet-inner">
        <div className="ls-top gut">
          <button className="icon-btn" aria-label="סגירה" onClick={() => (found ? setFound(null) : onClose())}>{IC.x}</button>
          <h2 className="st-title">{found ? 'אלה השאלות שבדף?' : 'דף הטעויות שלי'}</h2>
        </div>

        {found ? (
          <>
            <div className="ls-body gut">
              <p className="muted" style={{ margin: 0 }}>זיהיתי {found.length} שאלות. בטלו את הסימון ליד שאלה שלא מופיעה בדף שלכם.</p>
              {found.map((f, i) => {
                const q = QBY[f.id]
                return (
                  <button key={f.id} className="mode pickrow" aria-pressed={f.on}
                    onClick={() => setFound(found.map((x, k) => (k === i ? { ...x, on: !x.on } : x)))}>
                    <div className="check-dot">{f.on ? IC.check : null}</div>
                    <div><b>{q.q}</b><span>{q.o[q.a]}</span></div>
                  </button>
                )
              })}
            </div>
            <div className="ls-foot gut">
              <button className="btn btn-green" disabled={!found.some((f) => f.on)} onClick={confirmFound}>
                שמירת {found.filter((f) => f.on).length} שאלות
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="ls-body gut">
              <div className="tipbox private">{IC.lockSm}<span><b>רק אתם רואים את זה.</b> הדף נקרא ונשמר במכשיר הזה בלבד. הוא לא נשלח לשום שרת ולא נראה לאף אחד אחר.</span></div>

              {busy ? (
                <div className="card reading" role="status">
                  <b>{busy.label}…</b>
                  <div className="bar"><div className="fill" style={{ width: Math.round(busy.p * 100) + '%' }} /></div>
                  <span className="muted">זה לוקח עד דקה. בפעם הראשונה צריך חיבור לאינטרנט.</span>
                </div>
              ) : (
                <div className="card stack">
                  <b>{S.sheet.length ? 'הוספת דף נוסף' : 'העלאת הדף'}</b>
                  <span className="muted">צלמו את דף הטעויות שקיבלתם במבחן, או בחרו תמונה או קובץ PDF. אזהה את השאלות ואמצא אותן במאגר.</span>
                  <input ref={fileRef} type="file" accept="image/*,application/pdf" multiple hidden onChange={upload} />
                  <button className="btn btn-primary" onClick={() => fileRef.current.click()}>{IC.upload} בחירת תמונה או PDF</button>
                  <button className="linkish" onClick={() => setAdding(!adding)}>{adding ? 'סגירת החיפוש' : 'או הוספת שאלה ידנית'}</button>
                  {adding && (
                    <>
                      <input className="name-input" placeholder="מילים מהשאלה, או מספר השאלה" value={term} autoFocus onChange={(e) => setTerm(e.target.value)} />
                      {term.trim().length >= 2 && !results.length && <span className="muted">לא נמצאו שאלות מתאימות.</span>}
                      {results.map((q) => (
                        <button key={q.id} className="mode pickrow" onClick={() => { act.addSheet([q.id]); ui.toast('השאלה נוספה') }}>
                          <div className="check-dot plus">+</div>
                          <div><b>{q.q}</b><span>{q.o[q.a]} · מס׳ {q.n}</span></div>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}

              {pages.length > 0 && (
                <div className="stack">
                  <h3 className="st-group">הדפים שהעליתם</h3>
                  <div className="pages">
                    {pages.map((u, i) => (
                      <button key={i} className="page-thumb" aria-label={`דף ${i + 1}`} onClick={() => setZoom(u)}><img src={u} alt="" /></button>
                    ))}
                  </div>
                </div>
              )}

              {S.sheet.length > 0 ? (
                <div className="stack">
                  <div className="row">
                    <h3 className="st-group" style={{ padding: 0 }}>השאלות שלי <span className="muted">· {S.sheet.length} · יודעים {S.sheet.filter(knows).length}</span></h3>
                    <button className="linkish danger-link" onClick={wipe}>מחיקת הכול</button>
                  </div>
                  {S.sheet.map((id) => (
                    <Fact q={QBY[id]} key={id}>
                      <span className="fact-actions">
                        {S.wrong.includes(id) ? <span className="pill fail">טעיתם</span> : knows(id) ? <span className="pill pass">יודעים</span> : null}
                        <button className="icon-btn sm" aria-label="הסרת השאלה" onClick={() => act.removeSheet(id)}>{IC.trash}</button>
                      </span>
                    </Fact>
                  ))}
                </div>
              ) : !busy && (
                <p className="muted" style={{ margin: 0, textAlign: 'center' }}>עוד אין שאלות שמורות.</p>
              )}
            </div>
            {S.sheet.length > 0 && (
              <div className="ls-foot gut"><button className="btn btn-green" onClick={practise}>תרגול על השאלות האלה</button></div>
            )}
          </>
        )}
        {zoom && (
          <div className="zoomed" role="dialog" aria-label="הדף שהעליתם" onClick={() => setZoom(null)}>
            <img src={zoom} alt="הדף שהעליתם" /><span>הקישו כדי לסגור</span>
          </div>
        )}
      </div>
    </div>
  )
}
