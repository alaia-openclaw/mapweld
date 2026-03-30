import Link from "next/link";
import Image from "next/image";

export default function BrandLogo({ href = "/", className = "", compact = false }) {
  const content = (
    <>
      <span className="relative inline-flex h-10 w-10 items-center justify-center">
        <Image
          src="/img/Logo_only.png"
          alt="MapWeld logo"
          width={40}
          height={40}
          className="h-10 w-10 object-contain"
          priority
        />
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
