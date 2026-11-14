import { useCallback, useEffect, useRef, useState } from 'react'
import { useStore } from './lib/store.jsx'
import { UIProvider } from './lib/ui.jsx'
import { sfx } from './lib/fx.js'
import { IC } from './components/Icons.jsx'
import PathView from './views/PathView.jsx'
import PracticeView from './views/PracticeView.jsx'
import HardView from './views/HardView.jsx'
import ExamsView from './views/ExamsView.jsx'
import ProfileView from './views/ProfileView.jsx'
import Lesson from './screens/Lesson.jsx'
import Exam from './screens/Exam.jsx'
import Study from './screens/Study.jsx'

const TABS = [
  ['path', 'מסלול', IC.map, PathView],
  ['practice', 'תרגול', IC.dumbbell, PracticeView],
  ['hard', 'מכשילות', IC.sign, HardView],
  ['exams', 'מבחנים', IC.file, ExamsView],
  ['profile', 'פרופיל', IC.user, ProfileView]
]
/* One-time "what's new" message. Change NEWS.id to show a new message to everyone once. */
const NEWS = {
  id: '2026-11-traps',
  title: 'עדכון חדש!',
  text: 'נוספו שאלות שנכשלים בהם ב100 אחוז שאתם לא תכשלו בהם ועדכון למידה יותר קל'
}
const NEWS_KEY = 'theory-bekal-news'
const newsPending = () => { try { return localStorage.getItem(NEWS_KEY) !== NEWS.id } catch { return false } }

const fromHash = () => {
  const h = location.hash.slice(1)
  return TABS.some(([k]) => k === h) ? h : 'path'
}

function TopBar() {
  const { S } = useStore()
  const today = S.lastDay === S.day
  return (
    <header className="top gut">
      <div className={'stat streak' + (today ? ' on' : '')} title="ימי רצף">{IC.flame}<span>{S.streak}</span><small>ימי רצף</small></div>
      <div className="stat xp" title="נקודות XP"><span className="xp-chip">XP</span><span>{S.xp}</span><small>נקודות</small></div>
      <div className="goal">
        <div className="goal-txt">{IC.target}<span>היעד להיום: {Math.min(S.dayXp, S.goal)}/{S.goal} XP</span></div>
        <div className="bar"><div className="fill" style={{ width: Math.min(100, (S.dayXp / S.goal) * 100) + '%' }} /></div>
      </div>
    </header>
  )
}

export default function App() {
  const [view, setView] = useState(fromHash)
  const [lesson, setLesson] = useState(null)
  const [exam, setExam] = useState(null)
  const [study, setStudy] = useState(null)
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

  const go = (v) => {
    sfx.tap()
    setView(v)
    try { history.replaceState(null, '', '#' + v) } catch { /* sandboxed */ }
  }
  const startLesson = useCallback((cfg) => setLesson({ ...cfg, key: Date.now() }), [])
  const startExam = useCallback((resume) => setExam({ resume: !!resume, key: Date.now() }), [])
  const startStudy = useCallback((cfg) => setStudy({ ...cfg, key: Date.now() }), [])

  const View = TABS.find(([k]) => k === view)[3]

  return (
    <UIProvider startLesson={startLesson} startExam={startExam} startStudy={startStudy}>
      <div id="app">
        <TopBar />
        <main ref={mainRef}>
          <div className="view gut"><View /></div>
        </main>
        <nav className="tabs gut" aria-label="ניווט">
          {TABS.map(([k, label, icon]) => (
            <button key={k} className="tab" aria-current={view === k ? 'page' : undefined} onClick={() => go(k)}>
              {icon}{label}
            </button>
          ))}
        </nav>
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
      {study && <Study key={study.key} cfg={study} onClose={() => setStudy(null)} />}
      {lesson && <Lesson key={lesson.key} cfg={lesson} onClose={() => setLesson(null)} />}
      {exam && <Exam key={exam.key} resume={exam.resume} onClose={() => setExam(null)} />}
    </UIProvider>
  )
}
