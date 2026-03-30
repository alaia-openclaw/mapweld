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
  /** `cover` fills the frame. Screen recordings often encode black side/top/bottom padding; see crop props. */
  objectFit = "cover",
  /** Crop encoded black bars: % trimmed from left/right of the video (after object-fit). */
  cropSidesPct = 0,
  /** % trimmed from bottom (e.g. OS dock / taskbar in capture). */
  cropBottomPct = 0,
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

  const clipPath =
    cropSidesPct > 0 || cropBottomPct > 0
      ? `inset(0 ${cropSidesPct}% ${cropBottomPct}% ${cropSidesPct}%)`
      : undefined;

  return (
    <div
      ref={wrapRef}
      className={`group relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_60px_-24px_rgba(15,23,42,0.2)] ${className}`}
      style={{ aspectRatio: aspect }}
    >
      <div className="absolute inset-x-0 top-0 z-10 flex h-8 items-center justify-between border-b border-slate-200 bg-slate-100/95 px-3 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </div>
        <div className="rounded-full border border-slate-200/80 bg-white px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          {badge}
        </div>
      </div>

      <div className="landing-step-video-slot absolute inset-0 top-8 z-0 overflow-hidden bg-white">
        <video
          ref={videoRef}
          className="absolute inset-0 block h-full w-full min-h-0 min-w-0"
          style={{
            objectFit,
            objectPosition,
            backgroundColor: "#ffffff",
            ...(clipPath ? { clipPath, WebkitClipPath: clipPath } : {}),
          }}
          src={src}
          poster={poster}
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={title}
        />
      </div>
    </div>
  );
}
