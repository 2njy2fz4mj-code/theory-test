import { useCallback, useEffect, useRef, useState } from 'react'
import { useStore } from './lib/store.jsx'
import { UIProvider, useBack } from './lib/ui.jsx'
import { sfx } from './lib/fx.js'
import { IC } from './components/Icons.jsx'
import GlassTabs, { wantsGlassBar } from './components/GlassTabs.jsx'
import HomeView from './views/HomeView.jsx'
import LearnView from './views/LearnView.jsx'
import HardView from './views/HardView.jsx'
import MistakesView from './views/MistakesView.jsx'
import ExamsView from './views/ExamsView.jsx'
import ProfileView from './views/ProfileView.jsx'
import Lesson from './screens/Lesson.jsx'
import Exam from './screens/Exam.jsx'
import Study from './screens/Study.jsx'
import SheetScreen from './screens/SheetScreen.jsx'
import Focus from './screens/Focus.jsx'
import { primeSpeech } from './lib/fx.js'

/* Five tabs, one job each: where am I, learn, trap questions, my mistakes, test. Settings sit behind the gear. */
const TABS = [
  ['home', 'בית', IC.home, HomeView],
  ['learn', 'לימוד', IC.book, LearnView],
  ['hard', 'מכשילות', IC.sign, HardView],
  ['mistakes', 'טעויות', IC.redo, MistakesView],
  ['exams', 'מבחן', IC.file, ExamsView]
]
const OLD = { path: 'home', practice: 'learn', profile: 'home' }
/* One-time "what's new" message. Change NEWS.id to show a new message to everyone once. */
const NEWS = {
  id: '2026-11-traps',
  title: 'עדכון חדש!',
  text: 'נוספו שאלות שנכשלים בהם ב100 אחוז שאתם לא תכשלו בהם ועדכון למידה יותר קל'
}
const NEWS_KEY = 'theory-bekal-news'
const newsPending = () => { try { return localStorage.getItem(NEWS_KEY) !== NEWS.id } catch { return false } }

const GLASS = wantsGlassBar()
if (GLASS) document.documentElement.classList.add('glass-ui')

const fromHash = () => {
  const h = location.hash.slice(1)
  return TABS.some(([k]) => k === h) ? h : OLD[h] || 'home'
}

function TopBar({ onSettings }) {
  const { S } = useStore()
  const today = S.lastDay === S.day
  return (
    <header className="top gut">
      <div className={'stat streak' + (today ? ' on' : '')}>{IC.flame}<span>{S.streak}</span><small>ימי רצף</small></div>
      <div className="goal">
        <div className="goal-txt">{IC.target}<span>היעד להיום: {Math.min(S.dayXp, S.goal)}/{S.goal} נקודות</span></div>
        <div className="bar"><div className="fill" style={{ width: Math.min(100, (S.dayXp / S.goal) * 100) + '%' }} /></div>
      </div>
      <button className="icon-btn gear" aria-label="הגדרות ופרופיל" onClick={onSettings}>{IC.user}</button>
    </header>
  )
}

function Settings({ onClose }) {
  useBack(onClose)
  return (
    <div className="sheet-screen">
      <div className="sheet-inner">
        <div className="ls-top gut">
          <button className="icon-btn" aria-label="סגירה" onClick={onClose}>{IC.x}</button>
          <h2 className="st-title">פרופיל והגדרות</h2>
        </div>
        <div className="ls-body gut"><ProfileView /></div>
      </div>
    </div>
  )
}

export default function App() {
  const [view, setView] = useState(fromHash)
  const [lesson, setLesson] = useState(null)
  const [exam, setExam] = useState(null)
  const [study, setStudy] = useState(null)
  const [sheet, setSheet] = useState(null)
  const [settings, setSettings] = useState(false)
  const [focus, setFocus] = useState(null)
  const mainRef = useRef(null)
  const [news, setNews] = useState(newsPending)
  const closeNews = (to) => {
    try { localStorage.setItem(NEWS_KEY, NEWS.id) } catch { /* private mode */ }
    setNews(false)
    if (to) go(to)
  }

  useEffect(() => {
    const f = () => setView(fromHash())
    window.addEventListener('hashchange', f)
    return () => window.removeEventListener('hashchange', f)
  }, [])
  useEffect(() => { if (mainRef.current) mainRef.current.scrollTop = 0 }, [view])

  const go = useCallback((v) => {
    sfx.tap()
    setView(v)
    try { history.replaceState(history.state, '', '#' + v) } catch { /* sandboxed */ }
  }, [])
  const startLesson = useCallback((cfg) => setLesson({ ...cfg, key: Date.now() }), [])
  const startExam = useCallback((resume) => setExam({ resume: !!resume, key: Date.now() }), [])
  const startStudy = useCallback((cfg) => setStudy({ ...cfg, key: Date.now() }), [])
  const startFocus = useCallback(() => { primeSpeech(); setFocus(Date.now()) }, [])
  const openSheet = useCallback((id) => setSheet({ id: id || null, key: Date.now() }), [])

  const View = TABS.find(([k]) => k === view)[3]

  return (
    <UIProvider startLesson={startLesson} startExam={startExam} startStudy={startStudy} openSheet={openSheet} startFocus={startFocus} go={go}>
      <div id="app">
        <TopBar onSettings={() => setSettings(true)} />
        <main ref={mainRef}>
          <div className="view gut"><View /></div>
        </main>
        {GLASS ? <GlassTabs tabs={TABS} view={view} go={go} /> : (
          <nav className="tabs gut" aria-label="ניווט">
            {TABS.map(([k, label, icon]) => (
              <button key={k} className="tab" aria-current={view === k ? 'page' : undefined} onClick={() => go(k)}>
                {icon}{label}
              </button>
            ))}
          </nav>
        )}
      </div>
      {news && (
        <div id="modal">
          <div className="scrim" onClick={() => closeNews()} />
          <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="newsTitle">
            <h3 id="newsTitle">{NEWS.title}</h3>
            <p>{NEWS.text}</p>
            <button className="btn btn-primary" autoFocus onClick={() => closeNews('hard')}>לשאלות המכשילות</button>
            <button className="btn btn-ghost" onClick={() => closeNews()}>סגירה</button>
          </div>
        </div>
      )}
      {focus && <Focus key={focus} onClose={() => setFocus(null)} />}
      {settings && <Settings onClose={() => setSettings(false)} />}
      {sheet && <SheetScreen key={sheet.key} sheetId={sheet.id} onClose={() => setSheet(null)} />}
      {study && <Study key={study.key} cfg={study} onClose={() => setStudy(null)} />}
      {lesson && <Lesson key={lesson.key} cfg={lesson} onClose={() => setLesson(null)} />}
      {exam && <Exam key={exam.key} resume={exam.resume} onClose={() => setExam(null)} />}
    </UIProvider>
  )
}
