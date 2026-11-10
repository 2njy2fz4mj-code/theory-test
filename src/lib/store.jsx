import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { QBY } from './data.jsx'
import { setSound } from './fx.js'

const KEY = 'theory-bekal-v1'
const DEF = () => ({
  name: '', xp: 0, streak: 0, lastDay: null, day: null, dayXp: 0, goal: 20,
  done: {}, wrong: [], seen: [], examDate: '', answered: 0, correct: 0, exams: [], sound: true
})

export const dayStr = (d = new Date()) =>
  d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
export const yesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return dayStr(d) }

function load() {
  let s
  try { s = { ...DEF(), ...(JSON.parse(localStorage.getItem(KEY) || '{}') || {}) } } catch { s = DEF() }
  s.wrong = s.wrong.filter((id) => QBY[id])
  s.seen = s.seen.filter((id) => QBY[id])
  return s
}
// start a new day: reset today's XP, break the streak if a day was skipped
function roll(s) {
  const t = dayStr()
  let n = s
  if (n.day !== t) n = { ...n, day: t, dayXp: 0 }
  if (n.lastDay && n.lastDay !== t && n.lastDay !== yesterday()) n = { ...n, streak: 0 }
  return n
}
function applyAnswer(s, id, ok) {
  const wrong = s.wrong.filter((x) => x !== id)
  if (!ok) wrong.push(id)
  const seen = s.seen.includes(id) ? s.seen : [...s.seen, id]
  return { ...s, answered: s.answered + 1, correct: s.correct + (ok ? 1 : 0), wrong, seen }
}

const Ctx = createContext(null)

export function StoreProvider({ children }) {
  const [S, setS] = useState(() => roll(load()))

  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(S)) } catch { /* private mode */ } }, [S])
  useEffect(() => { setSound(S.sound) }, [S.sound])
  useEffect(() => {
    const f = () => { if (!document.hidden) setS(roll) }
    document.addEventListener('visibilitychange', f)
    return () => document.removeEventListener('visibilitychange', f)
  }, [])

  const act = useMemo(() => ({
    addXP: (n) => setS((s0) => {
      const s = roll(s0)
      const t = dayStr()
      let { streak, lastDay } = s
      if (lastDay !== t) { streak = (lastDay === yesterday() ? streak : 0) + 1; lastDay = t }
      return { ...s, xp: s.xp + n, dayXp: s.dayXp + n, streak, lastDay }
    }),
    answer: (id, ok) => setS((s) => applyAnswer(s, id, ok)),
    answerMany: (list) => setS((s) => list.reduce((acc, [id, ok]) => applyAnswer(acc, id, ok), s)),
    markDone: (lessonId) => setS((s) => ({ ...s, done: { ...s.done, [lessonId]: true } })),
    addExam: (e) => setS((s) => ({ ...s, exams: [...s.exams, e] })),
    setGoal: (goal) => setS((s) => ({ ...s, goal })),
    setName: (name) => setS((s) => ({ ...s, name })),
    setExamDate: (examDate) => setS((s) => ({ ...s, examDate })),
    toggleSound: () => setS((s) => ({ ...s, sound: !s.sound })),
    reset: () => setS((s) => roll({ ...DEF(), name: s.name }))
  }), [])

  const value = useMemo(() => ({ S, act, seen: new Set(S.seen) }), [S, act])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useStore = () => useContext(Ctx)
