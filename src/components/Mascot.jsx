/* The app's traffic-light buddy. mood: happy | cheer | sad */
export default function Mascot({ mood = 'happy', size = 110, className }) {
  const sad = mood === 'sad'
  const cheer = mood === 'cheer'
  const on = (c) => (sad ? c === 'r' : cheer || c === 'g')
  return (
    <svg className={'mascot ' + (className || '')} width={size} height={size * 1.12} viewBox="0 0 120 134" aria-hidden="true">
      <ellipse cx="60" cy="128" rx="30" ry="5" fill="#000" opacity=".12" />
      {cheer ? (
        <>
          <rect x="6" y="40" width="22" height="11" rx="5.5" fill="#2e3a4b" transform="rotate(-40 17 45)" />
          <rect x="92" y="40" width="22" height="11" rx="5.5" fill="#2e3a4b" transform="rotate(40 103 45)" />
        </>
      ) : (
        <>
          <rect x="8" y="70" width="20" height="11" rx="5.5" fill="#2e3a4b" transform="rotate(20 18 75)" />
          <rect x="92" y="70" width="20" height="11" rx="5.5" fill="#2e3a4b" transform="rotate(-20 102 75)" />
        </>
      )}
      <rect x="48" y="6" width="24" height="10" rx="4" fill="#ffb81c" />
      <rect x="22" y="14" width="76" height="102" rx="32" fill="#2e3a4b" />
      <rect x="28" y="20" width="64" height="40" rx="22" fill="#3a495d" />
      {cheer ? (
        <path d="M38 52q8-9 16 0M66 52q8-9 16 0" stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round" />
      ) : (
        <>
          <circle cx="46" cy="52" r="11" fill="#fff" />
          <circle cx="74" cy="52" r="11" fill="#fff" />
          <circle cx={sad ? 45 : 48} cy={sad ? 55 : 53} r="5" fill="#1b2430" />
          <circle cx={sad ? 73 : 76} cy={sad ? 55 : 53} r="5" fill="#1b2430" />
        </>
      )}
      {sad && <path d="M36 38l16 5M84 38l-16 5" stroke="#fff" strokeWidth="4" strokeLinecap="round" />}
      <circle cx="34" cy="68" r="5" fill="#ff8f8f" opacity=".55" />
      <circle cx="86" cy="68" r="5" fill="#ff8f8f" opacity=".55" />
      {sad ? (
        <path d="M50 78q10-7 20 0" stroke="#fff" strokeWidth="4.5" fill="none" strokeLinecap="round" />
      ) : cheer ? (
        <path d="M46 70q14 16 28 0z" fill="#ff6b6b" stroke="#fff" strokeWidth="3" strokeLinejoin="round" />
      ) : (
        <path d="M48 72q12 10 24 0" stroke="#fff" strokeWidth="4.5" fill="none" strokeLinecap="round" />
      )}
      <rect x="34" y="88" width="52" height="18" rx="9" fill="#1d2633" />
      <circle cx="45" cy="97" r="5.5" fill={on('r') ? '#ff4545' : '#5a2a2e'} />
      <circle cx="60" cy="97" r="5.5" fill={cheer ? '#ffbf2e' : '#5d4a1c'} />
      <circle cx="75" cy="97" r="5.5" fill={on('g') ? '#34d460' : '#1f4a2c'} />
      <rect x="38" y="114" width="14" height="10" rx="5" fill="#2e3a4b" />
      <rect x="68" y="114" width="14" height="10" rx="5" fill="#2e3a4b" />
    </svg>
  )
}
