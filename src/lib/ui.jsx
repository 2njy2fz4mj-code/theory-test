import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

/* App-wide UI helpers: toast messages, an in-page confirm sheet, and opening lessons / tests / study lists */
const Ctx = createContext(null)

export function UIProvider({ children, startLesson, startExam, startStudy, openSheet, go }) {
  const [toastMsg, setToastMsg] = useState('')
  const [dlg, setDlg] = useState(null)
  const timer = useRef(0)

  const toast = useCallback((m) => {
    setToastMsg(m)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setToastMsg(''), 2200)
  }, [])
  const confirm = useCallback((opts) => setDlg(opts), [])
  const cancel = () => { const d = dlg; setDlg(null); d.onCancel?.() }

  return (
    <Ctx.Provider value={{ toast, confirm, startLesson, startExam, startStudy, openSheet, go }}>
      {children}
      {dlg && (
        <div id="modal" onKeyDown={(e) => e.key === 'Escape' && setDlg(null)}>
          <div className="scrim" onClick={() => setDlg(null)} />
          <div className="dialog" role="dialog" aria-modal="true">
            <h3>{dlg.title}</h3>
            <p>{dlg.text}</p>
            <button className="btn btn-primary" autoFocus onClick={cancel}>{dlg.cancel}</button>
            <button className="btn btn-ghost danger" onClick={() => { setDlg(null); dlg.onOk() }}>{dlg.ok}</button>
          </div>
        </div>
      )}
      <div id="toast" className={toastMsg ? 'show' : ''} role="status" aria-live="polite">{toastMsg}</div>
    </Ctx.Provider>
  )
}

export const useUI = () => useContext(Ctx)

/* While a full-screen sheet is open, the phone's Back button asks the sheet to close instead of leaving the app.
   One extra history entry exists exactly while some sheet is open; sync() keeps that true after sheets open and close. */
const backStack = []
let ownBack = 0
let syncTimer = 0
const isSheet = () => { try { return !!history.state?.sheet } catch { return false } }
function sync() {
  try {
    if (backStack.length && !isSheet()) history.pushState({ sheet: true }, '')
    else if (!backStack.length && isSheet()) { ownBack = Date.now(); history.back() }
  } catch { /* sandboxed */ }
}
const scheduleSync = () => { clearTimeout(syncTimer); syncTimer = setTimeout(sync, 0) }
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    if (Date.now() - ownBack < 600) { ownBack = 0; return }
    const top = backStack[backStack.length - 1]
    if (!top) return
    sync()
    top.current()
  })
}
export function useBack(onBack) {
  const cb = useRef(onBack)
  cb.current = onBack
  useEffect(() => {
    backStack.push(cb)
    scheduleSync()
    return () => { backStack.splice(backStack.indexOf(cb), 1); scheduleSync() }
  }, [])
}
