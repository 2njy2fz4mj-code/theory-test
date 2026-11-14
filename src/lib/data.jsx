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

/* ===== Trap questions =====
   The kinds of questions that are easiest to get wrong, found in the bank by their shape.
   Each kind has one tip, a practice set and a list to memorise. */
const DIGIT = /\d/
const SIGN_NO = /^(תמרור\s*)?[א-ת]?-?\s?\d{2,3}\.?$/
const IN_PICTURE = /\(\d\)|נתיב \d|רכב \d|באיזה מספר מסומ/
const MEASURES = [
  ['מהירויות', /קמ"ש|קמ״ש/],
  ['מרחקים ומידות', /מטר|מ"מ|ס"מ|ק"מ|מעלות/],
  ['משקלים ונוסעים', /ק"ג|טון|נוסעים/],
  ['זמנים וגילים', /שנה|שנים|שנתיים|חודש|ימים|שעות|שעה|דקות|שניות|גיל/]
]
const NEG_Q = /(^|[\s("״])(לא|אינו|אינה|אינם|אינן|אין|אסור|למעט|חוץ)(?=[\s.,?!:;)"״]|$)/
const ALL_OF = /כל התשובות|אף אחת מהתשובות|שתי התשובות/

function trapKind(q) {
  const opts = q.o.join(' ')
  const right = q.o[q.a]
  if (q.t === 1 && q.img && q.o.every((x) => SIGN_NO.test(x.trim()))) return ['signs']
  if (q.img && IN_PICTURE.test(q.q + ' ' + opts)) return ['junction']
  if (DIGIT.test(right) && (q.o.every((x) => DIGIT.test(x)) || !q.img)) {
    const u = MEASURES.find(([, re]) => re.test(right)) || MEASURES.find(([, re]) => re.test(opts + ' ' + q.q))
    if (u) return ['numbers', u[0]]
  }
  if (NEG_Q.test(q.q) || ALL_OF.test(opts)) return ['wording']
  return null
}

export const TRAPS = [
  {
    k: 'numbers', title: 'מספרים שחייבים לזכור', c: 'amber',
    tip: 'מהירויות, מרחקים, משקלים וגילים. אי אפשר לנחש אותם בהיגיון, צריך לזכור. עברו על הרשימה כמה פעמים, ואז תרגלו.',
    short: 'כאן אין מה לנחש: זוכרים את המספר.'
  },
  {
    k: 'signs', title: 'תמרורים לפי מספר', c: 'red',
    tip: 'בתמונה כמה תמרורים, ומתחת לכל אחד המספר שלו. קודם מצאו בתמונה את התמרור שמתאים לשאלה, ורק אז חפשו את המספר שלו בתשובות.',
    short: 'קודם מוצאים את התמרור בתמונה, ואז את המספר שלו.'
  },
  {
    k: 'junction', title: 'זכות קדימה ופניות בציור', c: 'blue',
    tip: 'עובדים לפי סדר: 1. יש תמרור או רמזור? הוא קובע. 2. אין? נותנים זכות קדימה למי שבא מימין. 3. פונים שמאלה? נותנים גם למי שבא ממול. בסוף מוצאים את המספרים של כלי הרכב בציור.',
    short: 'תמרור קובע. אין תמרור: הבא מימין קודם, והפונה שמאלה נותן לבא ממול.'
  },
  {
    k: 'wording', title: 'ניסוח מבלבל', c: 'teal',
    tip: 'מילה אחת הופכת את השאלה: לא, אינו, אסור, למעט. האפליקציה מסמנת אותן בצהוב. קראו את השאלה עד הסוף, ואת כל ארבע התשובות, לפני שעונים.',
    short: 'שימו לב למילה המסומנת בצהוב. היא הופכת את השאלה.'
  }
].map((t) => ({ ...t, ids: [], groups: [] }))

export const TRAP_OF = {}
{
  const byK = Object.fromEntries(TRAPS.map((t) => [t.k, t]))
  const sub = {}
  for (const q of Q) {
    const kind = trapKind(q)
    if (!kind) continue
    const t = byK[kind[0]]
    t.ids.push(q.id)
    TRAP_OF[q.id] = t
    if (kind[1]) (sub[kind[1]] = sub[kind[1]] || []).push(q.id)
  }
  byK.numbers.groups = MEASURES.map(([title]) => ({ title, ids: sub[title] || [] })).filter((g) => g.ids.length)
}
export const TRAP_IDS = TRAPS.flatMap((t) => t.ids)

/* Ten questions from a pool: first the ones still wrong, then new ones, then the rest */
export function pickSet(ids, seen, wrongSet, n = 10) {
  const w = shuffle(ids.filter((id) => wrongSet.has(id)))
  const u = shuffle(ids.filter((id) => !seen.has(id) && !wrongSet.has(id)))
  const r = shuffle(ids.filter((id) => seen.has(id) && !wrongSet.has(id)))
  return w.concat(u, r).slice(0, n)
}
