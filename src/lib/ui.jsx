import { createContext, useCallback, useContext, useRef, useState } from 'react'

/* App-wide UI helpers: toast messages, an in-page confirm sheet, and opening lessons / tests */
const Ctx = createContext(null)

export function UIProvider({ children, startLesson, startExam }) {
  const [toastMsg, setToastMsg] = useState('')
  const [dlg, setDlg] = useState(null)
  const timer = useRef(0)

  const toast = useCallback((m) => {
    setToastMsg(m)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setToastMsg(''), 2200)
  }, [])
  const confirm = useCallback((opts) => setDlg(opts), [])

  return (
    <Ctx.Provider value={{ toast, confirm, startLesson, startExam }}>
      {children}
      {dlg && (
        <div id="modal" onKeyDown={(e) => e.key === 'Escape' && setDlg(null)}>
          <div className="scrim" onClick={() => setDlg(null)} />
          <div className="dialog" role="dialog" aria-modal="true">
            <h3>{dlg.title}</h3>
            <p>{dlg.text}</p>
            <button className="btn btn-primary" autoFocus onClick={() => setDlg(null)}>{dlg.cancel}</button>
            <button className="btn btn-ghost danger" onClick={() => { setDlg(null); dlg.onOk() }}>{dlg.ok}</button>
          </div>
        </div>
      )}
      <div id="toast" className={toastMsg ? 'show' : ''} role="status" aria-live="polite">{toastMsg}</div>
    </Ctx.Provider>
  )
}

export const useUI = () => useContext(Ctx)
