import { ALL_LESSONS, Q, QBY, UNITS, shuffle } from './data.jsx'

/* The next lesson on the path: the first one that is not done and whose previous lesson is */
export function nextLesson(done) {
  for (const u of UNITS) {
    const i = u.lessons.findIndex((l, k) => !done[l.id] && (k === 0 || done[u.lessons[k - 1].id]))
    if (i >= 0) return { u, l: u.lessons[i], i }
  }
  return null
}
export const lessonSize = (l) => (l.type === 'review' ? l.count : l.qs.length)
/* every question from every real test the learner uploaded, once each */
export const sheetIds = (sheets) => [...new Set(sheets.flatMap((s) => s.ids))]

/* A focus round: what is due for review first, then open mistakes, then new questions in lesson order */
const PATH_ORDER = ALL_LESSONS.filter((l) => l.type !== 'review').flatMap((l) => l.qs)
export function pickFocus(S, seen, n = 5) {
  const now = Date.now()
  const out = []
  const add = (id) => { if (out.length < n && QBY[id] && !out.includes(id)) out.push(id) }
  Object.entries(S.srs).filter(([, v]) => v.due <= now).sort((a, b) => a[1].due - b[1].due).slice(0, 3).forEach(([id]) => add(id))
  shuffle(S.wrong.filter((id) => !(S.srs[id] && S.srs[id].due > now))).forEach((id) => { if (out.length < 3) add(id) })
  for (const id of PATH_ORDER) { if (out.length >= n) break; if (!seen.has(id)) add(id) }
  for (const id of shuffle(Q.map((q) => q.id))) { if (out.length >= n) break; add(id) }
  return shuffle(out)
}
export const dueCount = (S) => { const now = Date.now(); return Object.values(S.srs).filter((v) => v.due <= now).length }
