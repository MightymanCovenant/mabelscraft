// Original geometric motif inspired by adire/ankara diamond tiling — not a copy of any specific print.
export default function PatternBg({ className = "" }: { className?: string }) {
  return (
    <svg className={`pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-[0.06] ${className}`} aria-hidden preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id="adireMotif" width="64" height="64" patternUnits="userSpaceOnUse">
          <rect width="64" height="64" fill="none" />
          <path d="M32 4 L60 32 L32 60 L4 32 Z" fill="none" stroke="rgb(var(--accent))" strokeWidth="2" />
          <circle cx="32" cy="32" r="6" fill="rgb(var(--gold))" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#adireMotif)" />
    </svg>
  );
}
