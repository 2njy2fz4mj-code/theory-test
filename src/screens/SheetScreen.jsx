import { useEffect, useRef, useState } from 'react'
import { Hl, QBY, pickSet } from '../lib/data.jsx'
import { useStore } from '../lib/store.jsx'
import { useBack, useUI } from '../lib/ui.jsx'
import { clearPages, loadPages, readSheet, savePages, searchBank } from '../lib/sheet.js'
import { IC } from '../components/Icons.jsx'
import { Photo } from '../components/bits.jsx'

/* One real test the learner failed: upload the mistakes sheet (one photo or several), confirm what was found,
   then see every question of that test and practise them all. */
export default function SheetScreen({ sheetId, onClose }) {
  const { S, act, seen } = useStore()
  const ui = useUI()
  const [sid] = useState(() => sheetId || 't' + Date.now().toString(36))
  const sheet = S.sheets.find((x) => x.id === sid)
  const ids = sheet ? sheet.ids : []
  const no = sheet ? S.sheets.indexOf(sheet) + 1 : S.sheets.length + 1

  const [busy, setBusy] = useState(null)      // { p, label } while reading
  const [found, setFound] = useState(null)    // [{ id, on, sure }] waiting to be confirmed
  const [pages, setPages] = useState([])
  const [zoom, setZoom] = useState(null)
  const [term, setTerm] = useState('')
  const [adding, setAdding] = useState(false)
  const fileRef = useRef(null)
  const closeReview = () => setFound(null)
  useBack(() => (zoom ? setZoom(null) : found ? closeReview() : onClose()))
  useEffect(() => { loadPages(sid).then(setPages) }, [sid])

  const upload = async (e) => {
    const files = [...e.target.files]
    e.target.value = ''
    if (!files.length) return
    setBusy({ p: 0, label: 'מתחיל' })
    try {
      const r = await readSheet(files, (p, label) => setBusy({ p, label }))
      await savePages(sid, r.pages)
      setPages(await loadPages(sid))
      const fresh = r.found.filter((f) => !ids.includes(f.id))
      if (!r.found.length) { ui.toast('לא זיהיתי שאלות בצילום. נסו צילום חד וישר, או הוסיפו ידנית.'); setAdding(true) }
      else if (!fresh.length) ui.toast('כל השאלות שבצילום כבר שמורות במבחן הזה')
      else setFound(fresh.map((f) => ({ id: f.id, on: f.sure, sure: f.sure })))
    } catch {
      ui.toast('לא הצלחתי לקרוא את הקובץ. נסו תמונה אחרת.')
    }
    setBusy(null)
  }

  const toggle = (id) => setFound(found.map((x) => (x.id === id ? { ...x, on: !x.on } : x)))
  const confirmFound = () => {
    const pick = found.filter((f) => f.on).map((f) => f.id)
    act.addToSheet(sid, pick)
    setFound(null)
    ui.toast(pick.length === 1 ? 'שאלה אחת נשמרה' : `${pick.length} שאלות נשמרו`)
  }
  const practise = () => {
    const set = pickSet(ids, seen, new Set(S.wrong), ids.length)
    onClose()
    ui.startLesson({ mode: 'practice', label: `מבחן ${no}`, ids: set })
  }
  const wipe = () => ui.confirm({
    title: 'למחוק את המבחן הזה?', text: 'השאלות והצילומים של המבחן הזה יימחקו מהמכשיר.',
    cancel: 'ביטול', ok: 'מחיקה', onOk: () => { act.deleteSheet(sid); clearPages(sid); onClose() }
  })

  const results = adding ? searchBank(term).filter((q) => !ids.includes(q.id)) : []
  const knows = (id) => seen.has(id) && !S.wrong.includes(id)
  const picker = (
    <input ref={fileRef} type="file" accept="image/*,application/pdf" multiple hidden onChange={upload} />
  )
  const manual = adding && (
    <div className="stack">
      <input className="name-input" placeholder="מילים מהשאלה, או מספר השאלה" value={term} autoFocus onChange={(e) => setTerm(e.target.value)} />
      {term.trim().length >= 2 && !results.length && <span className="muted">לא נמצאו שאלות מתאימות.</span>}
      {results.map((q) => (
        <button key={q.id} className="mode pickrow" onClick={() => { act.addToSheet(sid, [q.id]); ui.toast('השאלה נוספה') }}>
          <div className="check-dot plus">+</div>
          <div><b>{q.q}</b><span>{q.o[q.a]} · מס׳ {q.n}</span></div>
        </button>
      ))}
    </div>
  )

  if (found) {
    const sure = found.filter((f) => f.sure)
    const maybe = found.filter((f) => !f.sure)
    const row = (f) => {
      const q = QBY[f.id]
      return (
        <button key={f.id} className="mode pickrow" aria-pressed={f.on} onClick={() => toggle(f.id)}>
          <div className="check-dot">{f.on ? IC.check : null}</div>
          <div><b>{q.q}</b><span>{q.o[q.a]}</span></div>
        </button>
      )
    }
    return (
      <div className="sheet-screen">
        <div className="sheet-inner">
          <div className="ls-top gut">
            <button className="icon-btn" aria-label="חזרה" onClick={closeReview}>{IC.x}</button>
            <h2 className="st-title">אלה השאלות שבדף?</h2>
          </div>
          <div className="ls-body gut">
            {sure.length > 0 && (
              <>
                <p className="muted" style={{ margin: 0 }}>זיהיתי {sure.length === 1 ? 'שאלה אחת' : `${sure.length} שאלות`}. בטלו את הסימון ליד שאלה שלא מופיעה בדף שלכם.</p>
                {sure.map(row)}
              </>
            )}
            {maybe.length > 0 && (
              <>
                <h3 className="st-group">אולי גם אלה?</h3>
                <p className="muted" style={{ margin: 0 }}>כאן הצילום היה פחות ברור. סמנו רק את השאלות שבאמת מופיעות בדף.</p>
                {maybe.map(row)}
              </>
            )}
            <div className="tipbox">{IC.bulb}<span>חסרות שאלות? אחרי השמירה אפשר להעלות צילום נוסף של אותו דף, או להוסיף שאלה ידנית.</span></div>
          </div>
          <div className="ls-foot gut">
            <button className="btn btn-green" disabled={!found.some((f) => f.on)} onClick={confirmFound}>
              שמירת {found.filter((f) => f.on).length} שאלות
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="sheet-screen">
      <div className="sheet-inner">
        <div className="ls-top gut">
          <button className="icon-btn" aria-label="סגירה" onClick={onClose}>{IC.x}</button>
          <h2 className="st-title">{sheet ? `מבחן ${no}` : 'העלאת דף טעויות'}</h2>
        </div>
        <div className="ls-body gut">
          {picker}
          {busy ? (
            <div className="card reading" role="status">
              <b>{busy.label}…</b>
              <div className="bar"><div className="fill" style={{ width: Math.round(busy.p * 100) + '%' }} /></div>
              <span className="muted">זה לוקח עד דקה. בפעם הראשונה צריך חיבור לאינטרנט.</span>
            </div>
          ) : !sheet ? (
            <>
              <div className="card intro">
                <h3>איך זה עובד?</h3>
                <ol>
                  <li><b>מצלמים את הדף</b><span>את דף הטעויות שקיבלתם במבחן. אפשר גם קובץ PDF.</span></li>
                  <li><b>מאשרים את השאלות</b><span>אני מזהה אותן ומראה לכם רשימה לאישור.</span></li>
                  <li><b>מתרגלים</b><span>את כל השאלות שטעיתם בהן, עם התשובה וההסבר.</span></li>
                </ol>
                <button className="btn btn-primary" onClick={() => fileRef.current.click()}>{IC.upload} בחירת צילום או PDF</button>
              </div>
              <div className="tipbox">{IC.bulb}<span><b>כדי שאזהה את כל השאלות:</b> צלמו ישר מלמעלה ובאור טוב, כשהכתב חד וקריא. דף ארוך? צלמו אותו בשניים או שלושה חלקים ובחרו את כולם יחד.</span></div>
              <div className="tipbox private">{IC.lockSm}<span><b>רק אתם רואים את זה.</b> הדף נקרא ונשמר במכשיר הזה בלבד.</span></div>
              <button className="linkish" onClick={() => setAdding(!adding)}>{adding ? 'סגירת החיפוש' : 'אין לי את הדף, אוסיף שאלות ידנית'}</button>
              {manual}
            </>
          ) : (
            <>
              <div className="sheet-sum">
                <b>{ids.length}</b><span>{ids.length === 1 ? 'שאלה שטעיתם בה' : 'שאלות שטעיתם בהן'}</span>
                <b>{ids.filter(knows).length}</b><span>כבר יודעים</span>
              </div>
              <div className="trap-btns">
                <button className="btn btn-outline" onClick={() => fileRef.current.click()}>{IC.upload} צילום נוסף</button>
                <button className="btn btn-outline" onClick={() => setAdding(!adding)}>{IC.plus} שאלה ידנית</button>
              </div>
              <p className="muted" style={{ margin: 0, fontSize: 14 }}>חסרות שאלות מהדף? העלו צילום נוסף וברור יותר של אותו מבחן, או הוסיפו אותן ידנית.</p>
              {manual}
              {pages.length > 0 && (
                <div className="pages">
                  {pages.map((u, i) => (
                    <button key={i} className="page-thumb" aria-label={`צילום ${i + 1}`} onClick={() => setZoom(u)}><img src={u} alt="" /></button>
                  ))}
                </div>
              )}
              <h3 className="st-group">כל השאלות במבחן הזה</h3>
              {ids.map((id, i) => {
                const q = QBY[id]
                return (
                  <div className="card fact" key={id}>
                    <Photo q={q} lazy small />
                    <div className="q">{i + 1}. <Hl text={q.q} /></div>
                    <div className="ans">{IC.check}<span>{q.o[q.a]}</span></div>
                    {q.why && <div className="why">{q.why}</div>}
                    <div className="fact-foot">
                      <span>מס׳ {q.n} במאגר</span>
                      <span className="fact-actions">
                        {S.wrong.includes(id) ? <span className="pill fail">טעיתם</span> : knows(id) ? <span className="pill pass">יודעים</span> : null}
                        <button className="icon-btn sm" aria-label="הסרת השאלה" onClick={() => act.removeFromSheet(sid, id)}>{IC.trash}</button>
                      </span>
                    </div>
                  </div>
                )
              })}
              {!ids.length && <p className="muted" style={{ margin: 0, textAlign: 'center' }}>אין שאלות במבחן הזה.</p>}
              <button className="btn btn-ghost danger" onClick={wipe}>מחיקת המבחן הזה</button>
            </>
          )}
        </div>
        {sheet && ids.length > 0 && !busy && (
          <div className="ls-foot gut">
            <button className="btn btn-green" onClick={practise}>{ids.length === 1 ? 'תרגול על השאלה' : `תרגול על כל ${ids.length} השאלות`}</button>
          </div>
        )}
        {zoom && (
          <div className="zoomed" role="dialog" aria-label="הצילום שהעליתם" onClick={() => setZoom(null)}>
            <img src={zoom} alt="הצילום שהעליתם" /><span>הקישו כדי לסגור</span>
          </div>
        )}
      </div>
    </div>
  )
}
