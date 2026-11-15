import { Q } from './data.jsx'

/* The mistakes sheet from the real test: read the text off a photo or PDF on the device itself,
   then find which questions of the bank it shows. Nothing is sent anywhere. */

const FINALS = { ך: 'כ', ם: 'מ', ן: 'נ', ף: 'פ', ץ: 'צ' }
export const norm = (s) => String(s)
  .replace(/[֑-ׇ]/g, '')
  .replace(/[ךםןףץ]/g, (c) => FINALS[c])
  .replace(/[^א-ת0-9]+/g, ' ')
  .trim()

const grams = (s) => {
  const t = norm(s)
  const out = new Set()
  for (let i = 0; i + 3 <= t.length; i++) out.add(t.slice(i, i + 3))
  return out
}

let INDEX = null
function index() {
  if (INDEX) return INDEX
  const post = new Map() // trigram -> [questionIndex * 3 + part]
  const sizes = []
  const textCount = new Map()
  Q.forEach((q, qi) => {
    const parts = [grams(q.q), grams(q.o[q.a]), grams(q.q + ' ' + q.o.join(' '))]
    sizes.push(parts.map((p) => p.size || 1))
    parts.forEach((p, k) => p.forEach((g) => {
      let a = post.get(g)
      if (!a) post.set(g, (a = []))
      a.push(qi * 3 + k)
    }))
    const key = norm(q.q)
    textCount.set(key, (textCount.get(key) || 0) + 1)
  })
  INDEX = { post, sizes, unique: Q.map((q) => textCount.get(norm(q.q)) === 1) }
  return INDEX
}

const WINDOW = 7

/* text -> [{ id, score }] best first */
export function matchText(text) {
  const { post, sizes, unique } = index()
  const lines = text.split(/\n+/).map((l) => l.trim()).filter((l) => norm(l).length >= 2)
  if (!lines.length) return []
  const lineGrams = lines.map(grams)
  const best = new Map() // qi -> { score, pos }

  // per line: how much of each question's own text (part 0) and of its right answer (part 1) is on it
  const lineHits = lineGrams.map((G) => {
    const hit = new Map()
    G.forEach((g) => post.get(g)?.forEach((code) => { if (code % 3 < 2) hit.set(code, (hit.get(code) || 0) + 1) }))
    return hit
  })
  // the line of the question itself: the last line at or before the answer that holds most of its text
  const place = (qi, from, to) => {
    let aLine = from, aMax = -1, qLine = from, qMax = -1
    for (let l = from; l < to; l++) { const n = lineHits[l].get(qi * 3 + 1) || 0; if (n > aMax) { aMax = n; aLine = l } }
    for (let l = from; l < to; l++) { const n = lineHits[l].get(qi * 3) || 0; if (n > qMax) { qMax = n; qLine = l } }
    for (let l = aLine; l >= from; l--) if ((lineHits[l].get(qi * 3) || 0) >= 0.6 * sizes[qi][0]) return l
    return qLine
  }

  for (let i = 0; i < lines.length; i++) {
    const end = Math.min(lines.length, i + WINDOW)
    const W = new Set()
    for (let j = i; j < end; j++) lineGrams[j].forEach((g) => W.add(g))
    const hits = new Map()
    W.forEach((g) => post.get(g)?.forEach((code) => hits.set(code, (hits.get(code) || 0) + 1)))
    const seen = new Set()
    hits.forEach((_, code) => {
      const qi = (code / 3) | 0
      if (seen.has(qi)) return
      seen.add(qi)
      const cq = (hits.get(qi * 3) || 0) / sizes[qi][0]
      if (cq < 0.72) return
      const ca = (hits.get(qi * 3 + 1) || 0) / sizes[qi][1]
      const call = (hits.get(qi * 3 + 2) || 0) / sizes[qi][2]
      // many questions share one wording ("what does the sign mean?"): those are told apart by the answer only
      const withAnswer = ca >= 0.6 || (unique[qi] && call >= 0.55)
      const textOnly = unique[qi] && sizes[qi][0] >= 25 && cq >= 0.85
      if (!withAnswer && !textOnly) return
      const score = cq * 0.4 + ca * 0.4 + call * 0.2
      const b = best.get(qi)
      if (!b || score > b.score) best.set(qi, { score, pos: place(qi, i, end) })
    })
  }

  // two questions cannot sit on the same spot of the page: the better match wins
  const out = []
  ;[...best.entries()].sort((a, b) => b[1].score - a[1].score).forEach(([qi, b]) => {
    if (out.some((o) => Math.abs(o.pos - b.pos) <= 1)) return
    out.push({ id: Q[qi].id, score: b.score, pos: b.pos })
  })
  return out.sort((a, b) => a.pos - b.pos)
}

/* Find questions by number or by words, for adding one by hand */
export function searchBank(term, limit = 8) {
  const t = norm(term)
  if (!t) return []
  if (/^\d+$/.test(t)) return Q.filter((q) => String(q.n).startsWith(t)).slice(0, limit)
  const words = t.split(' ').filter((w) => w.length >= 2)
  if (!words.length) return []
  return Q.map((q) => {
    const hay = norm(q.q + ' ' + q.o[q.a])
    const n = words.filter((w) => hay.includes(w)).length
    return { q, n }
  }).filter((x) => x.n === words.length).slice(0, limit).map((x) => x.q)
}

const MAX_SIDE = 2200
function fit(w, h, max) {
  const k = Math.min(1, max / Math.max(w, h))
  return [Math.round(w * k), Math.round(h * k)]
}
async function imageToCanvas(file) {
  let bmp
  try { bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }) } catch { bmp = await createImageBitmap(file) }
  const [w, h] = fit(bmp.width, bmp.height, MAX_SIDE)
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  c.getContext('2d').drawImage(bmp, 0, 0, w, h)
  return c
}
async function pdfToCanvases(file) {
  const pdfjs = await import('pdfjs-dist')
  const worker = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
  pdfjs.GlobalWorkerOptions.workerSrc = worker
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise
  const out = []
  for (let p = 1; p <= Math.min(doc.numPages, 8); p++) {
    const page = await doc.getPage(p)
    const v0 = page.getViewport({ scale: 1 })
    const viewport = page.getViewport({ scale: Math.min(3, 1800 / v0.width) })
    const c = document.createElement('canvas')
    c.width = Math.round(viewport.width); c.height = Math.round(viewport.height)
    const ctx = c.getContext('2d')
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height)
    await page.render({ canvasContext: ctx, canvas: c, viewport }).promise
    out.push(c)
  }
  return out
}
function thumb(canvas) {
  const [w, h] = fit(canvas.width, canvas.height, 1300)
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  c.getContext('2d').drawImage(canvas, 0, 0, w, h)
  return c.toDataURL('image/jpeg', 0.72)
}

/* files -> { found: [{id, score}], pages: [dataURL], text } ; onProgress(0..1, label) */
export async function readSheet(files, onProgress = () => {}) {
  onProgress(0.02, 'פותח את הקובץ')
  const canvases = []
  for (const f of files) {
    if (f.type === 'application/pdf' || /\.pdf$/i.test(f.name)) canvases.push(...(await pdfToCanvases(f)))
    else canvases.push(await imageToCanvas(f))
  }
  if (!canvases.length) throw new Error('empty')
  onProgress(0.08, 'טוען את קורא הטקסט')
  const { createWorker } = await import('tesseract.js')
  const base = new URL(import.meta.env.BASE_URL + 'ocr/', location.href).href
  let page = 0
  const worker = await createWorker('heb', 1, {
    workerPath: base + 'worker.min.js', corePath: base, langPath: base, gzip: true,
    logger: (m) => { if (m.status === 'recognizing text') onProgress(0.15 + 0.8 * ((page + m.progress) / canvases.length), 'קורא את הדף') }
  })
  let text = ''
  try {
    for (const c of canvases) {
      const { data } = await worker.recognize(c)
      text += data.text + '\n'
      page++
    }
  } finally { await worker.terminate() }
  onProgress(0.97, 'מחפש את השאלות במאגר')
  return { found: matchText(text), pages: canvases.map(thumb), text }
}

/* The uploaded pages are kept in the browser's own storage on this device */
const DB = 'theory-bekal-sheet'
function db() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1)
    r.onupgradeneeded = () => r.result.createObjectStore('pages', { autoIncrement: true })
    r.onsuccess = () => res(r.result)
    r.onerror = () => rej(r.error)
  })
}
const tx = async (mode, fn) => {
  const d = await db()
  return new Promise((res, rej) => {
    const t = d.transaction('pages', mode)
    const out = fn(t.objectStore('pages'))
    t.oncomplete = () => res(out?.result)
    t.onerror = () => rej(t.error)
  })
}
export const savePages = (urls) => tx('readwrite', (s) => { urls.forEach((u) => s.add(u)) }).catch(() => {})
export const loadPages = () => tx('readonly', (s) => s.getAll()).then((r) => r || []).catch(() => [])
export const clearPages = () => tx('readwrite', (s) => { s.clear() }).catch(() => {})
