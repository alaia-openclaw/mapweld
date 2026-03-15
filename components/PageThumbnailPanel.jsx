"use client";

import { Document, Page, pdfjs } from "react-pdf";
import { useMemo, useEffect, useRef } from "react";

function PageThumbnailPanel({
  pdfBlob,
  numPages,
  currentPage,
  onPageSelect,
  weldPoints = [],
  spoolMarkers = [],
  partMarkers = [],
  isOpen,
  onToggle,
}) {
  const scrollContainerRef = useRef(null);
  const activeThumbRef = useRef(null);

  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
  }, []);

  useEffect(() => {
    if (!isOpen || !activeThumbRef.current) return;
    activeThumbRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [currentPage, isOpen]);

  const pageCounts = useMemo(() => {
    const counts = [];
    for (let i = 0; i < (numPages || 0); i++) {
      counts.push({
        welds: weldPoints.filter((w) => (w.pageNumber ?? 0) === i).length,
        spools: spoolMarkers.filter((m) => (m.pageNumber ?? 0) === i).length,
        parts: partMarkers.filter((m) => (m.pageNumber ?? 0) === i).length,
      });
    }
    return counts;
  }, [numPages, weldPoints, spoolMarkers, partMarkers]);

  if (!pdfBlob || !numPages || numPages <= 1) return null;

  return (
    <div className="flex h-full flex-shrink-0" data-print-hide>
      <div
        className={`flex flex-col h-full bg-base-200/60 border-r border-base-300 transition-[width] duration-200 ease-out overflow-hidden ${
          isOpen ? "w-44" : "w-0"
        }`}
      >
        <div className="flex items-center justify-between px-3 py-2 border-b border-base-300/60 bg-base-200/80 shrink-0">
          <span className="text-xs font-semibold text-base-content/70 uppercase tracking-wider">
            Pages
          </span>
          <span className="text-xs tabular-nums text-base-content/50">
            {numPages}
          </span>
        </div>

        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 py-2 px-2 space-y-2 scrollbar-thin">
          <Document file={pdfBlob} loading={null} error={null}>
            {Array.from({ length: numPages }, (_, i) => {
              const pageNum = i + 1;
              const isActive = pageNum === currentPage;
              const counts = pageCounts[i] || { welds: 0, spools: 0, parts: 0 };
              const hasItems = counts.welds + counts.spools + counts.parts > 0;

              return (
                <button
                  key={i}
                  ref={isActive ? activeThumbRef : undefined}
                  type="button"
                  className={`group relative w-full rounded-lg overflow-hidden cursor-pointer transition-all duration-150 ${
                    isActive
                      ? "ring-2 ring-primary ring-offset-1 ring-offset-base-200 shadow-md"
                      : "ring-1 ring-base-300/60 hover:ring-base-content/20 hover:shadow-sm"
                  }`}
                  onClick={() => onPageSelect(pageNum)}
                  aria-label={`Go to page ${pageNum}`}
                  title={`Page ${pageNum}`}
                >
                  <div className="bg-white w-full">
                    <Page
                      pageNumber={pageNum}
                      width={152}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      loading={
                        <div className="w-full aspect-[8.5/11] bg-base-100 animate-pulse" />
                      }
                    />
                  </div>

                  <div className="absolute bottom-0 inset-x-0 flex items-center justify-between px-1.5 py-1 bg-gradient-to-t from-black/60 via-black/30 to-transparent">
                    <span
                      className={`text-[10px] font-bold tabular-nums ${
                        isActive ? "text-primary-content bg-primary" : "text-white/90"
                      } rounded px-1 py-0.5 leading-none`}
                    >
                      {pageNum}
                    </span>

                    {hasItems && (
                      <div className="flex items-center gap-1">
                        {counts.welds > 0 && (
                          <span className="flex items-center gap-0.5 text-[9px] font-semibold text-white/90 bg-error/80 rounded px-1 py-0.5 leading-none" title={`${counts.welds} weld${counts.welds > 1 ? "s" : ""}`}>
                            <svg className="w-2.5 h-2.5" viewBox="0 0 16 16" fill="currentColor">
                              <circle cx="8" cy="8" r="3" />
                            </svg>
                            {counts.welds}
                          </span>
                        )}
                        {counts.parts > 0 && (
                          <span className="flex items-center gap-0.5 text-[9px] font-semibold text-white/90 bg-info/80 rounded px-1 py-0.5 leading-none" title={`${counts.parts} part${counts.parts > 1 ? "s" : ""}`}>
                            <svg className="w-2.5 h-2.5" viewBox="0 0 16 16" fill="currentColor">
                              <rect x="4" y="4" width="8" height="8" rx="1" />
                            </svg>
                            {counts.parts}
                          </span>
                        )}
                        {counts.spools > 0 && (
                          <span className="flex items-center gap-0.5 text-[9px] font-semibold text-white/90 bg-warning/80 rounded px-1 py-0.5 leading-none" title={`${counts.spools} spool${counts.spools > 1 ? "s" : ""}`}>
                            <svg className="w-2.5 h-2.5" viewBox="0 0 16 16" fill="currentColor">
                              <polygon points="8,2 14,14 2,14" />
                            </svg>
                            {counts.spools}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </Document>
        </div>
      </div>

      <button
        type="button"
        className="flex items-center justify-center w-5 h-full bg-base-200/40 hover:bg-base-200/80 border-r border-base-300/40 transition-colors cursor-pointer group shrink-0"
        onClick={onToggle}
        aria-label={isOpen ? "Hide page panel" : "Show page panel"}
        title={isOpen ? "Hide page panel" : "Show page panel"}
      >
        <svg
          className={`w-3 h-3 text-base-content/40 group-hover:text-base-content/70 transition-transform duration-200 ${
            isOpen ? "" : "rotate-180"
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
    </div>
  );
}

export default PageThumbnailPanel;
