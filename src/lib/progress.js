import { UNITS } from './data.jsx'

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
