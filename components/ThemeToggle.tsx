"use client";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
const OPTS = [
  { id: "light", label: "Light", icon: <path d="M12 3v2m0 14v2m9-9h-2M5 12H3m14.95 6.95-1.41-1.41M6.46 6.46 5.05 5.05m13.9 0-1.41 1.41M6.46 17.54l-1.41 1.41M12 8a4 4 0 100 8 4 4 0 000-8Z" /> },
  { id: "system", label: "System", icon: <path d="M4 5h16v10H4V5Zm4 14h8m-4-4v4" /> },
  { id: "dark", label: "Dark", icon: <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" /> },
] as const;
export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const cur = ready ? theme || "system" : "system";
  const idx = OPTS.findIndex((o) => o.id === cur);
  return (
    <div className="relative inline-flex items-center rounded-full border border-line bg-surface p-1" role="radiogroup" aria-label="Theme">
      <span aria-hidden className="absolute h-8 w-8 rounded-full bg-accent transition-transform duration-300 ease-out" style={{ transform: `translateX(${Math.max(idx, 0) * 34}px)`, boxShadow: "0 0 14px rgb(var(--accent)/.6)" }} />
      {OPTS.map((o, i) => (
        <button key={o.id} role="radio" aria-checked={cur === o.id} aria-label={o.label} title={o.label}
          className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full transition-colors"
          onClick={() => setTheme(o.id)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={cur === o.id ? "white" : "rgb(var(--muted))"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{o.icon}</svg>
        </button>
      ))}
      <span aria-hidden className="ml-2 mr-1 h-2.5 w-2.5 rounded-full bg-gold" style={{ boxShadow: "0 0 8px rgb(var(--gold)/.7)" }} />
    </div>
  );
}
