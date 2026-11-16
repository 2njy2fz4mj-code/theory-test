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
  const qGrams = []
  const textCount = new Map()
  Q.forEach((q, qi) => {
    const parts = [grams(q.q), grams(q.o[q.a]), grams(q.q + ' ' + q.o.join(' '))]
    sizes.push(parts.map((p) => p.size || 1))
    qGrams.push(parts[0])
    parts.forEach((p, k) => p.forEach((g) => {
      let a = post.get(g)
      if (!a) post.set(g, (a = []))
      a.push(qi * 3 + k)
    }))
    const key = norm(q.q)
    textCount.set(key, (textCount.get(key) || 0) + 1)
  })
  INDEX = { post, sizes, qGrams, unique: Q.map((q) => textCount.get(norm(q.q)) === 1) }
  return INDEX
}

const WINDOW = 7

/* text -> [{ id, score, sure }] in the order they appear on the page */
export function matchText(text) {
  const { post, sizes, qGrams, unique } = index()
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
  // A question is printed on a few lines in a row. Find the three lines that hold most of its text:
  // words scattered over the page (from other questions) do not add up to a match.
  const place = (qi, from, to) => {
    let start = from, top = -1
    for (let l = from; l < to; l++) {
      let n = 0
      qGrams[qi].forEach((g) => { if (lineGrams[l].has(g) || lineGrams[l + 1]?.has(g) || lineGrams[l + 2]?.has(g)) n++ })
      if (n > top) { top = n; start = l }
    }
    // of those three lines, the one that carries most of the question is where it starts
    let pos = start, qMax = -1
    for (let l = start; l < Math.min(lines.length, start + 3); l++) { const n = lineHits[l].get(qi * 3) || 0; if (n > qMax) { qMax = n; pos = l } }
    // the right answer is printed just below it
    let aLine = pos, aMax = 0
    for (let l = pos; l < Math.min(lines.length, pos + 5); l++) { const n = lineHits[l].get(qi * 3 + 1) || 0; if (n > aMax) { aMax = n; aLine = l } }
    return [pos, aLine, top / sizes[qi][0]]
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
      if (cq < 0.55) return
      const ca = (hits.get(qi * 3 + 1) || 0) / sizes[qi][1]
      const call = (hits.get(qi * 3 + 2) || 0) / sizes[qi][2]
      // many questions share one wording ("what does the sign mean?"): those are told apart by the answer only
      const sure = cq >= 0.72 && (ca >= 0.6 || (unique[qi] && call >= 0.55) || (unique[qi] && sizes[qi][0] >= 25 && cq >= 0.85))
      // a blurry photo loses letters: a weaker match is offered as "maybe" for the learner to decide
      const maybe = ca >= 0.45 || (unique[qi] && sizes[qi][0] >= 18 && (call >= 0.4 || cq >= 0.65))
      if (!sure && !maybe) return
      const [pos, last, near] = place(qi, i, end)
      if (near < (sure ? 0.68 : 0.55)) return
      const score = (sure ? 1 : 0) + cq * 0.4 + ca * 0.4 + call * 0.2
      const b = best.get(qi)
      if (!b || score > b.score) {
        // how much of the page this match explains: the longer text wins a shared spot
        best.set(qi, { score, sure, pos, last, mass: (sure ? 1e6 : 0) + (hits.get(qi * 3) || 0) + (hits.get(qi * 3 + 1) || 0) })
      }
    })
  }

  // two questions cannot sit on the same lines of the page. A short question can hide inside the answer
  // of a longer one, so the match that explains more text keeps the spot.
  const out = []
  ;[...best.entries()].sort((a, b) => b[1].mass - a[1].mass).forEach(([qi, b]) => {
    if (out.some((o) => b.pos <= o.last && o.pos <= b.last)) return
    out.push({ id: Q[qi].id, score: b.score, sure: b.sure, pos: b.pos, last: b.last })
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
/* A second copy of the page for the reader: bigger, grey, with the shadows of a phone photo evened out */
function enhance(src) {
  const k = Math.min(2, Math.max(1, 2400 / Math.max(src.width, src.height)))
  const c = document.createElement('canvas')
  c.width = Math.round(src.width * k); c.height = Math.round(src.height * k)
  const ctx = c.getContext('2d')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(src, 0, 0, c.width, c.height)
  const img = ctx.getImageData(0, 0, c.width, c.height)
  const d = img.data, W = c.width, H = c.height
  const grey = new Float32Array(W * H)
  for (let i = 0; i < W * H; i++) grey[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]
  // paper brightness per block of the page = its brightest tenth; dividing by it removes shadows
  const B = 48, bw = Math.ceil(W / B), bh = Math.ceil(H / B)
  const paper = new Float32Array(bw * bh)
  for (let by = 0; by < bh; by++) for (let bx = 0; bx < bw; bx++) {
    const hist = new Uint32Array(256); let n = 0
    for (let y = by * B; y < Math.min(H, by * B + B); y += 2) for (let x = bx * B; x < Math.min(W, bx * B + B); x += 2) { hist[grey[y * W + x] | 0]++; n++ }
    let acc = 0, v = 255
    for (; v > 0; v--) { acc += hist[v]; if (acc >= n * 0.1) break }
    paper[by * bw + bx] = Math.max(60, v)
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const p = paper[Math.min(bh - 1, (y / B) | 0) * bw + Math.min(bw - 1, (x / B) | 0)]
    let v = grey[y * W + x] / p
    v = v < 0.55 ? v * 0.6 : v > 0.9 ? 1 : v
    const o = Math.max(0, Math.min(255, v * 255)); const i = (y * W + x) * 4
    d[i] = d[i + 1] = d[i + 2] = o; d[i + 3] = 255
  }
  ctx.putImageData(img, 0, 0)
  return c
}
function mergeFound(lists) {
  const by = new Map()
  lists.forEach((l, k) => l.forEach((f) => {
    const b = by.get(f.id)
    if (!b || f.score > b.score) by.set(f.id, { ...f, pos: f.pos + k * 0.001 })
  }))
  return [...by.values()].sort((a, b) => a.pos - b.pos).sort((a, b) => (b.sure ? 1 : 0) - (a.sure ? 1 : 0))
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
  const texts = ['', '']
  try {
    for (const c of canvases) {
      // every page is read twice, as it is and cleaned up; whatever either reading finds counts
      const a = await worker.recognize(c)
      texts[0] += a.data.text + '\n'
      page += 0.5
      const b = await worker.recognize(enhance(c))
      texts[1] += b.data.text + '\n'
      page += 0.5
    }
  } finally { await worker.terminate() }
  onProgress(0.97, 'מחפש את השאלות במאגר')
  return { found: mergeFound(texts.map(matchText)), pages: canvases.map(thumb), text: texts.join('\n') }
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
const pageOf = (v) => (typeof v === 'string' ? { sid: 'old', url: v } : v)
export const savePages = (sid, urls) => tx('readwrite', (s) => { urls.forEach((url) => s.add({ sid, url })) }).catch(() => {})
export const loadPages = (sid) => tx('readonly', (s) => s.getAll()).then((r) => (r || []).map(pageOf).filter((p) => p.sid === sid).map((p) => p.url)).catch(() => [])
export const clearPages = (sid) => tx('readwrite', (s) => {
  if (!sid) { s.clear(); return }
  const r = s.openCursor()
  r.onsuccess = () => { const c = r.result; if (!c) return; if (pageOf(c.value).sid === sid) c.delete(); c.continue() }
}).catch(() => {})
