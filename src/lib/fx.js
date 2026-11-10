/* Sounds, vibration, read-aloud and confetti. Everything fails silently on devices that lack it. */
let soundOn = true
export const setSound = (on) => { soundOn = on }

let AC = null
function beep(seq) {
  if (!soundOn) return
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)()
    const t0 = AC.currentTime + 0.01
    seq.forEach(([f, st, du, type, vol]) => {
      const o = AC.createOscillator()
      const g = AC.createGain()
      o.type = type || 'sine'
      o.frequency.value = f
      g.gain.setValueAtTime(0, t0 + st)
      g.gain.linearRampToValueAtTime(vol || 0.12, t0 + st + 0.015)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + st + du)
      o.connect(g)
      g.connect(AC.destination)
      o.start(t0 + st)
      o.stop(t0 + st + du + 0.03)
    })
  } catch { /* no audio */ }
}
export const sfx = {
  ok: () => beep([[660, 0, 0.12], [990, 0.09, 0.2]]),
  bad: () => beep([[230, 0, 0.22, 'triangle', 0.16], [175, 0.12, 0.28, 'triangle', 0.13]]),
  win: () => beep([[523, 0, 0.16], [659, 0.12, 0.16], [784, 0.24, 0.16], [1047, 0.36, 0.4]]),
  tap: () => beep([[520, 0, 0.05, 'sine', 0.04]])
}

export const buzz = (p) => { try { navigator.vibrate && navigator.vibrate(p) } catch { /* no vibration */ } }

export function speak(text) {
  try {
    if (!('speechSynthesis' in window)) return false
    speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'he-IL'
    u.rate = 0.95
    speechSynthesis.speak(u)
    return true
  } catch { return false }
}
export const stopSpeaking = () => { try { speechSynthesis.cancel() } catch { /* none */ } }

export function confetti() {
  try { if (matchMedia('(prefers-reduced-motion: reduce)').matches) return } catch { /* old browser */ }
  const c = document.createElement('canvas')
  c.className = 'confetti'
  document.body.appendChild(c)
  const x = c.getContext('2d')
  const d = window.devicePixelRatio || 1
  const W = (c.width = innerWidth * d)
  const H = (c.height = innerHeight * d)
  const cols = ['#22a447', '#f2a516', '#1769d1', '#e0464b', '#0f9f95', '#ffd23f']
  const P = Array.from({ length: 150 }, () => ({
    x: W / 2 + (Math.random() - 0.5) * W * 0.4, y: H * 0.38,
    vx: (Math.random() - 0.5) * 15 * d, vy: (-Math.random() * 15 - 5) * d,
    r: (4 + Math.random() * 5) * d, c: cols[(Math.random() * cols.length) | 0],
    a: Math.random() * 6, va: (Math.random() - 0.5) * 0.3
  }))
  let f = 0
  ;(function step() {
    x.clearRect(0, 0, W, H)
    P.forEach((p) => {
      p.vy += 0.45 * d; p.x += p.vx; p.y += p.vy; p.vx *= 0.99; p.a += p.va
      x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.fillStyle = p.c
      x.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); x.restore()
    })
    if (++f < 160) requestAnimationFrame(step)
    else c.remove()
  })()
}
