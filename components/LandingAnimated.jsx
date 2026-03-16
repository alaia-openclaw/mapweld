"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export function useInView(options = {}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.12, ...options }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, isVisible];
}

export function RevealOnScroll({
  children,
  className = "",
  animation = "animate-fade-up",
  delay = "",
  as: Tag = "div",
}) {
  const [ref, isVisible] = useInView();

  return (
    <Tag
      ref={ref}
      className={`${className} ${isVisible ? `${animation} ${delay}` : "opacity-0"}`}
    >
      {children}
    </Tag>
  );
}

export function StaggerChildren({
  children,
  className = "",
  staggerMs = 150,
  animation = "animate-fade-up",
}) {
  const [ref, isVisible] = useInView();

  return (
    <div ref={ref} className={className}>
      {Array.isArray(children)
        ? children.map((child, i) => (
            <div
              key={i}
              className={isVisible ? animation : "opacity-0"}
              style={isVisible ? { animationDelay: `${i * staggerMs}ms` } : undefined}
            >
              {child}
            </div>
          ))
        : children}
    </div>
  );
}

export function FloatingShapes({ variant = "hero" }) {
  if (variant === "hero") {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        {/* Large gradient orb top-right */}
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-amber-500/10 to-primary/5 blur-3xl animate-drift" />

        {/* Small orb bottom-left */}
        <div className="absolute bottom-20 -left-20 w-72 h-72 rounded-full bg-gradient-to-tr from-primary/8 to-sky-400/5 blur-2xl animate-float-slow" />

        {/* Geometric accent — ring */}
        <div className="absolute top-1/4 right-[15%] w-20 h-20 rounded-full border border-white/[0.06] animate-float delay-500" />
        <div className="absolute bottom-1/3 left-[10%] w-14 h-14 rounded-full border border-white/[0.04] animate-float-rev delay-300" />

        {/* Small dots */}
        <div className="absolute top-[18%] left-[25%] w-2 h-2 rounded-full bg-amber-400/20 animate-pulse-slow" />
        <div className="absolute top-[60%] right-[20%] w-1.5 h-1.5 rounded-full bg-primary/20 animate-pulse-slow delay-1000" />
        <div className="absolute bottom-[25%] right-[35%] w-2.5 h-2.5 rounded-full bg-sky-400/15 animate-pulse-slow delay-2000" />

        {/* Diagonal line accents */}
        <svg className="absolute top-1/3 left-[5%] w-32 h-32 text-white/[0.03] animate-float-slow delay-700" viewBox="0 0 100 100" fill="none">
          <line x1="0" y1="100" x2="100" y2="0" stroke="currentColor" strokeWidth="1" />
          <line x1="20" y1="100" x2="100" y2="20" stroke="currentColor" strokeWidth="0.5" />
        </svg>

        {/* Spinning ring */}
        <div className="absolute -bottom-10 right-[10%] w-40 h-40 animate-spin-slow">
          <svg viewBox="0 0 100 100" fill="none" className="w-full h-full text-white/[0.03]">
            <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="0.5" strokeDasharray="8 12" />
          </svg>
        </div>
      </div>
    );
  }

  if (variant === "dark") {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute -top-40 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl animate-drift" />
        <div className="absolute -bottom-20 right-1/4 w-80 h-80 rounded-full bg-amber-500/5 blur-3xl animate-float-slow" />
        <div className="absolute top-1/3 right-[8%] w-16 h-16 rounded-full border border-white/[0.05] animate-float delay-400" />
        <div className="absolute bottom-1/4 left-[12%] w-2 h-2 rounded-full bg-amber-400/15 animate-pulse-slow delay-600" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <div className="absolute -top-32 right-0 w-80 h-80 rounded-full bg-primary/[0.04] blur-3xl animate-drift" />
      <div className="absolute bottom-0 -left-20 w-64 h-64 rounded-full bg-amber-400/[0.03] blur-2xl animate-float-slow" />
    </div>
  );
}

export function FaqAccordion({ items }) {
  const [openIndex, setOpenIndex] = useState(null);
  const [ref, isVisible] = useInView();

  return (
    <div ref={ref} className="space-y-3">
      {items.map(({ q, a }, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={q}
            className={`rounded-2xl border border-base-300 bg-base-100 shadow-sm overflow-hidden transition-all duration-300
              hover:shadow-md hover:border-primary/20
              ${isVisible ? "animate-fade-up" : "opacity-0"}`}
            style={isVisible ? { animationDelay: `${i * 80}ms` } : undefined}
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="w-full flex items-center justify-between p-6 text-left font-bold text-base-content text-lg hover:bg-base-200/30 transition-colors"
            >
              {q}
              <svg
                className={`w-5 h-5 shrink-0 text-primary transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <div
              className={`grid transition-all duration-400 ease-in-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
            >
              <div className="overflow-hidden">
                <p className="px-6 pb-6 text-base-content/65 text-base leading-relaxed">
                  {a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ImagePlaceholder({ label = "Image", aspect = "4/3", className = "" }) {
  return (
    <div
      className={`relative rounded-2xl border-2 border-dashed border-base-300 bg-base-200/50 overflow-hidden ${className}`}
      style={{ aspectRatio: aspect }}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-base-content/30">
        <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        <span className="text-sm font-medium">{label}</span>
      </div>
    </div>
  );
}
