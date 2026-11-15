import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { StoreProvider } from './lib/store.jsx'
import App from './App.jsx'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </StrictMode>
)

// opening screen: stays for a moment after the app is ready, then fades away (a tap skips it)
const splash = document.getElementById('splash')
if (splash) {
  const hide = () => { splash.classList.add('out'); setTimeout(() => splash.remove(), 500) }
  const t = setTimeout(hide, 2600)
  splash.addEventListener('click', () => { clearTimeout(t); hide() })
}

/* Updates: an installed app can stay open for days, so it would never notice a new version.
   Look for one whenever the app comes back to the front, and switch to it as soon as no lesson or test is open. */
if ('serviceWorker' in navigator) {
  const sw = navigator.serviceWorker
  let hadWorker = !!sw.controller
  let reloadWanted = false
  const tryReload = () => {
    if (!reloadWanted || document.querySelector('.sheet-screen')) return
    reloadWanted = false
    location.reload()
  }
  sw.addEventListener('controllerchange', () => {
    if (hadWorker) { reloadWanted = true; tryReload() }
    hadWorker = true
  })
  const check = () => sw.getRegistration().then((r) => r && r.update()).catch(() => { /* offline */ })
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { check(); tryReload() } })
  window.addEventListener('focus', check)
  setInterval(check, 20 * 60 * 1000)
  setInterval(tryReload, 4000)
}
