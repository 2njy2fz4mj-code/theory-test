const s = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round' }

export const IC = {
  x: <svg viewBox="0 0 24 24" {...s} strokeWidth="2.8"><path d="M6 6l12 12M18 6L6 18" /></svg>,
  check: <svg viewBox="0 0 24 24" {...s} strokeWidth="3"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>,
  star: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.5L12 17.2l-5.9 3.2 1.3-6.5L2.5 9.3l6.6-.8z" /></svg>,
  book: <svg viewBox="0 0 24 24" {...s} strokeWidth="2.4"><path d="M12 6c-2-1.5-5-2-8-1.5v14c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5v-14c-3-.5-6 0-8 1.5zM12 6v14" /></svg>,
  lock: <svg viewBox="0 0 24 24" {...s} strokeWidth="2.4"><rect x="5" y="11" width="14" height="10" rx="2.5" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>,
  trophy: <svg viewBox="0 0 24 24" {...s} strokeWidth="2.3"><path d="M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M12 14v3M8 20h8M9 17h6v3H9z" /></svg>,
  speak: <svg viewBox="0 0 24 24" {...s} strokeWidth="2.3"><path d="M4 9.5v5h4l5 4v-13l-5 4z" /><path d="M16.5 9a4 4 0 0 1 0 6M19 6.5a7.5 7.5 0 0 1 0 11" /></svg>,
  bulb: <svg viewBox="0 0 24 24" {...s} strokeWidth="2.3"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" /></svg>,
  clock: <svg viewBox="0 0 24 24" {...s} strokeWidth="2.4"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>,
  flame: <svg viewBox="0 0 24 24"><path fill="#ff8a1f" d="M12 1.8c.5 3.3-1.7 5-3.4 7C7 10.7 6 12.4 6 14.6a6 6 0 0 0 12 0c0-2.6-1.2-4.6-2.8-6.2 0 1.7-.7 2.9-1.9 3.4.6-3.6-.2-7.2-1.3-10z" /><path fill="#ffc83d" d="M12 22a3.2 3.2 0 0 1-3.2-3.2c0-1.6 1.1-2.7 2.1-3.9.3 1 .9 1.6 1.6 1.8-.1-1.5.4-2.8 1.3-3.6.9 1.4 1.4 2.6 1.4 4.1A3.2 3.2 0 0 1 12 22z" /></svg>,
  shuffle: <svg viewBox="0 0 24 24" {...s} strokeWidth="2.3"><path d="M4 7h3c4 0 6 10 10 10h3M4 17h3c1.6 0 2.8-1.6 3.9-3.5M13.1 9.5C14.2 8 15.4 7 17 7h3M17 4l3 3-3 3M17 14l3 3-3 3" /></svg>,
  redo: <svg viewBox="0 0 24 24" {...s} strokeWidth="2.3"><path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5" /></svg>,
  sign: <svg viewBox="0 0 24 24" {...s} strokeWidth="2.3"><path d="M12 3l9 16H3z" /><path d="M12 10v4M12 17h.01" /></svg>,
  car: <svg viewBox="0 0 24 24" {...s} strokeWidth="2.3"><path d="M4 16v-4l2-5h12l2 5v4z" /><path d="M4 12h16" /><circle cx="8" cy="16" r="2" /><circle cx="16" cy="16" r="2" /></svg>,
  gauge: <svg viewBox="0 0 24 24" {...s} strokeWidth="2.4"><path d="M4 17a8 8 0 1 1 16 0" /><path d="M12 17l4-5" /><path d="M6.5 11.5l1 .6M12 7v1.2M17.5 11.5l-1 .6" /></svg>,
  target: <svg viewBox="0 0 24 24" width="15" height="15"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.4" /><circle cx="12" cy="12" r="4" fill="currentColor" /></svg>,
  map: <svg viewBox="0 0 24 24" {...s} strokeWidth="2.2"><path d="M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20z" /><path d="M9 4v13.5M15 6.5V20" /></svg>,
  dumbbell: <svg viewBox="0 0 24 24" {...s} strokeWidth="2.2"><path d="M6.5 6.5l11 11M4 9l5-5M15 20l5-5M2.5 11.5l2-2M19.5 14.5l2-2M7 4.5l-2.5 2.5M19.5 17l-2.5 2.5" /></svg>,
  file: <svg viewBox="0 0 24 24" {...s} strokeWidth="2.2"><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4M9 12h6M9 16h6" /></svg>,
  user: <svg viewBox="0 0 24 24" {...s} strokeWidth="2.2"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" /></svg>
}
