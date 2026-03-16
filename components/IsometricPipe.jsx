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
          <rect x="50" y="148" width="14" height="64" rx="3" opacity="0.35" style={t(0, 0.8)} />

          {/* Main horizontal run */}
          <path d="M64 155 L280 155" style={t(0.15, 1.4)} />
          <path d="M64 200 L280 200" style={t(0.15, 1.4)} opacity="0.5" />

          {/* Elbow down */}
          <path d="M280 155 Q325 155 325 200" style={t(0.6, 0.9)} />
          <path d="M280 200 Q315 200 315 230" style={t(0.6, 0.9)} opacity="0.5" />

          {/* Vertical drop */}
          <path d="M315 230 L315 310" style={t(0.9, 0.8)} opacity="0.5" />
          <path d="M325 200 L325 310" style={t(0.9, 0.8)} />

          {/* Bottom flange */}
          <rect x="308" y="310" width="24" height="12" rx="3" opacity="0.35" style={t(1.3, 0.6)} />

          {/* Tee branch going up-right */}
          <path d="M170 155 L170 105 L430 105" style={t(0.5, 1.3)} />
          <path d="M180 155 L180 115 L430 115" style={t(0.5, 1.3)} opacity="0.5" />

          {/* Right flange on branch */}
          <rect x="430" y="95" width="14" height="30" rx="3" opacity="0.35" style={t(1.1, 0.6)} />
        </g>

        {/* Weld symbols */}
        <g strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <g className="text-amber-400" stroke="currentColor" style={fade(1.4)}>
            <path d="M110 149 L118 138 L126 149" />
            <path d="M110 206 L118 210 L126 206" />
          </g>
          <g className="text-amber-400" stroke="currentColor" style={fade(1.6)}>
            <path d="M230 149 L238 138 L246 149" />
            <path d="M230 206 L238 210 L246 206" />
          </g>
          <g className="text-amber-400" stroke="currentColor" style={fade(1.8)}>
            <path d="M165 105 L173 95 L181 105" />
          </g>
        </g>

        {/* Annotations */}
        <Annotation
          x={118} y={138} labelX={40} labelY={68}
          label="WELD" value="W-001 · SMAW"
          delay={2200} isVisible={drawn}
        />
        <Annotation
          x={238} y={138} labelX={240} labelY={50}
          label="STATUS" value="Complete ✓"
          delay={2500} isVisible={drawn}
        />
        <Annotation
          x={320} y={270} labelX={380} labelY={268}
          label="NDT" value="RT — pending"
          delay={2800} isVisible={drawn}
        />
        <Annotation
          x={175} y={95} labelX={400} labelY={42}
          label="SPOOL" value="SP-2204-A"
          delay={3100} isVisible={drawn}
        />
      </svg>
    </div>
  );
}
