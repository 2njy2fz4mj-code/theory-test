import { useCallback, useEffect, useRef, useState } from 'react'
import { useStore } from './lib/store.jsx'
import { UIProvider } from './lib/ui.jsx'
import { sfx } from './lib/fx.js'
import { IC } from './components/Icons.jsx'
import PathView from './views/PathView.jsx'
import PracticeView from './views/PracticeView.jsx'
import ExamsView from './views/ExamsView.jsx'
import ProfileView from './views/ProfileView.jsx'
import Lesson from './screens/Lesson.jsx'
import Exam from './screens/Exam.jsx'

const TABS = [
  ['path', 'מסלול', IC.map, PathView],
  ['practice', 'תרגול', IC.dumbbell, PracticeView],
  ['exams', 'מבחנים', IC.file, ExamsView],
  ['profile', 'פרופיל', IC.user, ProfileView]
]
const fromHash = () => {
  const h = location.hash.slice(1)
  return TABS.some(([k]) => k === h) ? h : 'path'
}

function TopBar() {
  const { S } = useStore()
  const today = S.lastDay === S.day
  return (
    <header className="top gut">
      <div className={'stat streak' + (today ? ' on' : '')} title="ימי רצף">{IC.flame}<span>{S.streak}</span></div>
      <div className="stat xp" title="נקודות XP"><span className="xp-chip">XP</span><span>{S.xp}</span></div>
      <div className="goal">
        <div className="goal-txt">{IC.target}<span>{Math.min(S.dayXp, S.goal)}/{S.goal} XP היום</span></div>
        <div className="bar"><div className="fill" style={{ width: Math.min(100, (S.dayXp / S.goal) * 100) + '%' }} /></div>
      </div>
    </header>
  )
}

export default function App() {
  const [view, setView] = useState(fromHash)
  const [lesson, setLesson] = useState(null)
  const [exam, setExam] = useState(false)
  const mainRef = useRef(null)

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
  const startExam = useCallback(() => setExam(true), [])

  const View = TABS.find(([k]) => k === view)[3]

  return (
    <UIProvider startLesson={startLesson} startExam={startExam}>
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
      {lesson && <Lesson key={lesson.key} cfg={lesson} onClose={() => setLesson(null)} />}
      {exam && <Exam onClose={() => setExam(false)} />}
    </UIProvider>
  )
}
