"use client";

import { useEffect, useRef } from "react";
import { useInView } from "@/components/LandingAnimated";

export default function LandingStepVideo({
  src,
  poster,
  title,
  badge = "Workflow clip",
  aspect = "16/10",
  className = "",
  objectPosition = "center center",
}) {
  const videoRef = useRef(null);
  const [wrapRef, isVisible] = useInView({ threshold: 0.35 });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isVisible) {
      const playAttempt = video.play();
      if (playAttempt?.catch) playAttempt.catch(() => {});
    } else {
      video.pause();
    }
  }, [isVisible]);

  return (
    <div
      ref={wrapRef}
      className={`group relative overflow-hidden rounded-[28px] border border-slate-200 bg-slate-950 shadow-[0_20px_60px_-24px_rgba(15,23,42,0.35)] ${className}`}
      style={{ aspectRatio: aspect }}
    >
      <div className="absolute inset-x-0 top-0 z-10 flex h-10 items-center justify-between border-b border-white/10 bg-slate-900/80 px-4 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/65">
          {badge}
        </div>
      </div>

      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition, paddingTop: "2.5rem" }}
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={title}
      />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.05),_transparent_35%),linear-gradient(to_top,_rgba(15,23,42,0.24),_transparent_28%)]" />
      <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent px-5 py-4">
        <p className="text-sm font-medium text-white/85">{title}</p>
      </div>
    </div>
  );
}
