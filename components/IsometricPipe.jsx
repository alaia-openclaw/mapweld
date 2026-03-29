"use client";

import { useEffect, useState } from "react";

function Annotation({ x, y, labelX, labelY, label, value, delay = 0, isVisible, align = "left" }) {
  const boxW = Math.max(label.length, value.length) * 8 + 24;
  const rx = align === "right" ? labelX - boxW + 4 : labelX - 4;

  return (
    <g
      className={isVisible ? "animate-pop-in" : "opacity-0"}
      style={isVisible ? { animationDelay: `${delay}ms` } : undefined}
    >
      <line
        x1={x} y1={y} x2={labelX} y2={labelY}
        stroke="currentColor" strokeWidth="1" strokeDasharray="4 3" opacity="0.35"
      />
      <circle cx={x} cy={y} r="5" fill="currentColor" opacity="0.15" />
      <circle cx={x} cy={y} r="2.5" fill="currentColor" opacity="0.7" />

      <rect
        x={rx} y={labelY - 22}
        width={boxW} height="40"
        rx="8" fill="currentColor" opacity="0.06"
      />
      <rect
        x={rx} y={labelY - 22}
        width={boxW} height="40"
        rx="8" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.1"
      />
      <text x={rx + 12} y={labelY - 5} fontSize="10" fontWeight="600" fill="currentColor" opacity="0.45" letterSpacing="0.5">
        {label}
      </text>
      <text x={rx + 12} y={labelY + 12} fontSize="13" fontWeight="700" fill="currentColor" opacity="0.85">
        {value}
      </text>
    </g>
  );
}

export default function IsometricPipe({ className = "" }) {
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDrawn(true), 600);
    return () => clearTimeout(timer);
  }, []);

  const t = (delay, dur = 1.2) => ({
    strokeDasharray: 600,
    strokeDashoffset: drawn ? 0 : 600,
    transition: `stroke-dashoffset ${dur}s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s`,
  });

  const fade = (delay) => ({
    opacity: drawn ? 1 : 0,
    transition: `opacity 0.5s ease-out ${delay}s`,
  });

  return (
    <div className={`relative animate-float ${className}`}>
      <svg
        viewBox="0 0 580 360"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto text-white"
        aria-hidden="true"
      >
        {/* Main isometric pipe system */}
        <g strokeWidth="2.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          {/* Left flange */}
          <rect x="48" y="154" width="16" height="62" rx="3" opacity="0.34" style={t(0, 0.8)} />

          {/* Main horizontal run - front and back edges kept parallel */}
          <path d="M64 164 L288 164" style={t(0.12, 1.3)} />
          <path d="M64 206 L286 206" style={t(0.12, 1.3)} opacity="0.52" />

          {/* Long-radius elbow into vertical drop — keep same apparent diameter as horizontal (dy ≈ 42 → dx ≈ 42 on vertical) */}
          <path d="M288 164 C334 164 367 182 367 226 L367 318" style={t(0.48, 1.15)} />
          <path d="M286 206 C318 206 325 218 325 254 L325 318" style={t(0.48, 1.15)} opacity="0.52" />

          {/* Bottom flange */}
          <rect x="325" y="318" width="42" height="12" rx="3" opacity="0.34" style={t(1.06, 0.55)} />

          {/* Branch spool with smoother tee and consistent wall spacing */}
          <path d="M184 164 L184 110 C184 104 188 100 194 100 L450 100" style={t(0.34, 1.2)} />
          <path d="M198 164 L198 122 C198 116 202 112 208 112 L450 112" style={t(0.34, 1.2)} opacity="0.52" />

          {/* Right flange on branch */}
          <rect x="450" y="91" width="16" height="30" rx="3" opacity="0.34" style={t(0.98, 0.55)} />
        </g>

        {/* Weld symbols */}
        <g strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <g className="text-amber-400" stroke="currentColor" style={fade(1.35)}>
            <path d="M118 158 L126 147 L134 158" />
            <path d="M118 212 L126 216 L134 212" />
          </g>
          <g className="text-amber-400" stroke="currentColor" style={fade(1.55)}>
            <path d="M242 158 L250 147 L258 158" />
            <path d="M242 212 L250 216 L258 212" />
          </g>
          <g className="text-amber-400" stroke="currentColor" style={fade(1.75)}>
            <path d="M186 108 L194 98 L202 108" />
          </g>
        </g>

        {/* Annotations */}
        <Annotation
          x={126} y={147} labelX={42} labelY={70}
          label="WELD" value="W-001 · SMAW"
          delay={2200} isVisible={drawn}
        />
        <Annotation
          x={250} y={147} labelX={242} labelY={52}
          label="STATUS" value="Complete ✓"
          delay={2500} isVisible={drawn}
        />
        <Annotation
          x={346} y={274} labelX={394} labelY={274}
          label="NDT" value="RT — pending"
          delay={2800} isVisible={drawn}
        />
        <Annotation
          x={194} y={100} labelX={402} labelY={44}
          label="SPOOL" value="SP-2204-A"
          delay={3100} isVisible={drawn}
        />
      </svg>
    </div>
  );
}
