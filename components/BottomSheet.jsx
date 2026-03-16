"use client";

import { useRef, useState, useCallback, useEffect } from "react";

const SNAP_CLOSED = 0;
const SNAP_HALF = 0.5;
const SNAP_FULL = 0.92;

function BottomSheet({ isOpen, onClose, activeTab, onTabChange, children }) {
  const sheetRef = useRef(null);
  const dragRef = useRef(null);
  const [snapHeight, setSnapHeight] = useState(SNAP_HALF);

  useEffect(() => {
    if (isOpen) setSnapHeight(SNAP_HALF);
  }, [isOpen]);

  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    dragRef.current = {
      startY: touch.clientY,
      startSnap: snapHeight,
      moved: false,
    };
  }, [snapHeight]);

  const handleTouchMove = useCallback((e) => {
    if (!dragRef.current) return;
    const touch = e.touches[0];
    const dy = dragRef.current.startY - touch.clientY;
    const vh = window.innerHeight;
    const deltaFrac = dy / vh;
    const newSnap = Math.max(0.1, Math.min(SNAP_FULL, dragRef.current.startSnap + deltaFrac));
    dragRef.current.moved = true;
    setSnapHeight(newSnap);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!dragRef.current) return;
    const wasMoved = dragRef.current.moved;
    dragRef.current = null;
    if (!wasMoved) return;

    setSnapHeight((current) => {
      if (current < 0.25) {
        onClose?.();
        return SNAP_CLOSED;
      }
      if (current < 0.7) return SNAP_HALF;
      return SNAP_FULL;
    });
  }, [onClose]);

  if (!isOpen) return null;

  const tabs = [
    { id: "welds", label: "Welds" },
    { id: "spools", label: "Spools" },
    { id: "parts", label: "Parts" },
  ];

  return (
    <div
      ref={sheetRef}
      className="md:hidden fixed inset-x-0 bottom-0 z-40 flex flex-col bg-base-100 rounded-t-2xl shadow-2xl border-t border-base-300 transition-[height] duration-200 ease-out"
      style={{ height: `${snapHeight * 100}dvh` }}
    >
      {/* Drag handle */}
      <div
        className="flex-shrink-0 flex justify-center pt-2 pb-1 cursor-grab active:cursor-grabbing"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="w-10 h-1 rounded-full bg-base-content/20" />
      </div>

      {/* Tab switcher */}
      <div className="flex-shrink-0 flex items-center gap-0 px-2 pb-2 border-b border-base-300">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`flex-1 btn btn-sm btn-ghost rounded-lg ${
              activeTab === tab.id
                ? "btn-active font-semibold"
                : "text-base-content/60"
            }`}
            onClick={() => onTabChange?.(tab.id)}
          >
            {tab.label}
          </button>
        ))}
        <button
          type="button"
          className="btn btn-sm btn-ghost btn-circle ml-1"
          onClick={onClose}
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content area */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain mobile-no-scrollbar">
        {children}
      </div>
    </div>
  );
}

export default BottomSheet;
