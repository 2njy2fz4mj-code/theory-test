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
