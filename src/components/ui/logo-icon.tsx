export function LogoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className={className}>
      <g fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 65 30 L 40 30 C 26 30 22 42 35 48 L 65 52 C 78 58 74 70 60 70 L 35 70" />
        <path d="M 75 42 A 18 18 0 0 0 65 30" strokeWidth="2" strokeDasharray="0 6" strokeLinecap="round"/>
        <path d="M 25 58 A 18 18 0 0 0 35 70" strokeWidth="2" strokeDasharray="0 6" strokeLinecap="round"/>
      </g>
      <g fill="currentColor">
        <circle cx="65" cy="30" r="5" />
        <circle cx="35" cy="70" r="5" />
        <circle cx="50" cy="50" r="3" fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
      </g>
    </svg>
  );
}
