import BANK from '../data/bank.json'
import EXPL from '../data/expl.json'

/* Official Ministry of Transport question bank, license B.
   Row: [number, topic, question, options, answerIndex, imageKey|null] */
export const TOPICS = [
  { k: 'laws', title: 'חוקי התנועה', c: 'blue' },
  { k: 'signs', title: 'תמרורים', c: 'red' },
  { k: 'safety', title: 'בטיחות', c: 'green' },
  { k: 'vehicle', title: 'הכרת הרכב', c: 'slate' }
]
export const VEHICLE = 3

// options that refer to other options ("all answers are correct") keep their order
const ORDER_WORDS = /תשוב|כל ה|אף אחת|א'|ב'|ג'|ד'/

export const Q = BANK.map(([n, t, q, o, a, img]) => ({
  id: String(n), n, t, q, o, a, img,
  fixed: o.some((x) => ORDER_WORDS.test(x)),
  why: EXPL[String(n)] || null
}))
export const QBY = Object.fromEntries(Q.map((q) => [q.id, q]))

export const UNITS = []
TOPICS.forEach((tp, ti) => {
  const qs = Q.filter((q) => q.t === ti).map((q) => q.id)
  const parts = Math.max(1, Math.round(qs.length / 100))
  const size = Math.ceil(qs.length / parts)
  for (let p = 0; p < parts; p++) {
    const slice = qs.slice(p * size, (p + 1) * size)
    if (!slice.length) continue
    const ch = []
    for (let i = 0; i < slice.length; i += 10) ch.push(slice.slice(i, i + 10))
    if (ch.length > 1 && ch[ch.length - 1].length < 5) {
      const l = ch.pop()
      ch[ch.length - 1] = ch[ch.length - 1].concat(l)
    }
    const id = tp.k + '-' + (p + 1)
    const lessons = ch.map((c, i) => ({ id: id + '-' + (i + 1), title: 'שיעור ' + (i + 1), qs: c, type: 'lesson' }))
    lessons.push({ id: id + '-rev', title: 'חזרה', qs: slice, type: 'review', count: 10 })
    UNITS.push({
      id, t: ti, c: tp.c, lessons,
      title: tp.title + (parts > 1 ? ' · חלק ' + (p + 1) : ''),
      sub: slice.length + ' שאלות מהמאגר הרשמי'
    })
  }
})
export const ALL_LESSONS = UNITS.flatMap((u) => u.lessons)

export const shuffle = (a) => {
  a = a.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
export const pickOne = (a) => a[(Math.random() * a.length) | 0]

export const imgUrl = (key) => `${import.meta.env.BASE_URL}img/${key}.webp`

/* Highlight trap words (negations) so they are not missed when reading fast */
const NEG = /(^|[\s("'״])(לא|אין|אינו|אינה|אינם|אינן|אינך|אסור|אסורה|אסורים|שאינו|שאינה|שלא|אלא|למעט|חוץ)(?=[\s.,?!:;)"'״]|$)/g
export function Hl({ text }) {
  const out = []
  let last = 0
  let m
  NEG.lastIndex = 0
  while ((m = NEG.exec(text))) {
    const start = m.index + m[1].length
    out.push(text.slice(last, start))
    out.push(<mark className="kw" key={start}>{m[2]}</mark>)
    last = start + m[2].length
  }
  out.push(text.slice(last))
  return <>{out}</>
}

/* Test simulation: 30 questions, split between topics in proportion to the bank */
export function pickExam(n = 30) {
  const pools = TOPICS.map((_, i) => shuffle(Q.filter((q) => q.t === i).map((q) => q.id)))
  const raw = pools.map((p) => (n * p.length) / Q.length)
  const quota = raw.map(Math.floor)
  let rest = n - quota.reduce((a, b) => a + b, 0)
  raw.map((r, i) => [r - quota[i], i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => {
    if (rest > 0) { quota[i]++; rest-- }
  })
  return shuffle(pools.flatMap((p, i) => p.slice(0, quota[i])))
}

export const optionOrder = (q) => (q.fixed ? q.o.map((_, i) => i) : shuffle(q.o.map((_, i) => i)))
