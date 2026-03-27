import Link from "next/link";

export default function BrandLogo({ href = "/", className = "", compact = false }) {
  const content = (
    <>
      <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg shadow-slate-900/15 ring-1 ring-white/10">
        <svg viewBox="0 0 48 48" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M8 24c0-8.84 7.16-16 16-16s16 7.16 16 16-7.16 16-16 16S8 32.84 8 24Z" />
          <path d="M16 24h16" />
          <path d="M24 16v16" />
          <circle cx="24" cy="24" r="4" fill="currentColor" stroke="none" />
        </svg>
        <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full bg-amber-400 ring-2 ring-slate-900" />
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="text-xl font-extrabold tracking-tight text-current">MapWeld</span>
          <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-current/55">
            Weld traceability
          </span>
        </span>
      )}
    </>
  );

  const classes = `inline-flex items-center gap-3 ${className}`.trim();

  if (!href) {
    return <div className={classes}>{content}</div>;
  }

  return (
    <Link href={href} className={classes} aria-label="MapWeld home">
      {content}
    </Link>
  );
}
