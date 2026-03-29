"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef } from "react";

const iconClass = "h-4 w-4 shrink-0";

function IconUser() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );
}

function IconLoadPdf() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  );
}

function IconFolderOpen() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
    </svg>
  );
}

function IconSave() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
    </svg>
  );
}

function IconCog() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function IconClipboard() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function IconHealth() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  );
}

function IconExport() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
      />
    </svg>
  );
}

function Toolbar({
  hasPdf,
  hasWelds,
  onLoadPdf,
  onLoadProject,
  onSaveProject,
  onOpenExport,
  onOpenParameters,
  onOpenProjects,
  onOpenNdt,
  onOpenStatus,
  onOpenHealth,
  /** Persist workspace to sessionStorage before SPA navigation (e.g. Catalog) so /app restores on return. */
  onPersistSessionDraft,
  exportTitle = "Export Excel or drawing PDF",
  /** `loading` while session is resolving — export stays disabled. */
  authSessionStatus = "authenticated",
  userEmail = "",
  onSignOut,
  showAuthActions = false,
}) {
  const router = useRouter();
  const projectInputRef = useRef(null);
  const btn = "btn btn-xs h-8 min-h-8 px-2 gap-1.5 md:min-w-0";
  const exportDisabled = (!hasPdf && !hasWelds) || authSessionStatus === "loading";

  const handleNavigateToCatalog = useCallback(
    async (e) => {
      if (!onPersistSessionDraft) return;
      e.preventDefault();
      await onPersistSessionDraft({ updateAlerts: false });
      router.push("/catalog");
    },
    [onPersistSessionDraft, router]
  );

  const desktopActions = (
    <>
      <label htmlFor="pdf-file-input" className={`${btn} btn-outline cursor-pointer`} title="Load PDF">
        <IconLoadPdf />
        <span className="hidden lg:inline">PDF</span>
      </label>
      <input
        id="pdf-file-input"
        type="file"
        accept=".pdf,application/pdf"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = e.target.files;
          if (files) {
            for (let i = 0; i < files.length; i++) onLoadPdf?.(files[i]);
          }
          e.target.value = "";
        }}
      />
      <button
        type="button"
        className={`${btn} btn-ghost`}
        onClick={() => projectInputRef.current?.click()}
        title="Load project"
      >
        <IconFolderOpen />
        <span className="hidden lg:inline">Open</span>
      </button>
      <input
        ref={projectInputRef}
        type="file"
        accept=".weldproject,.json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onLoadProject?.(file);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        className={`${btn} btn-primary`}
        onClick={onSaveProject}
        disabled={!hasPdf}
        title="Save project"
      >
        <IconSave />
        <span className="hidden lg:inline">Save</span>
      </button>
      <button
        type="button"
        className={`${btn} btn-secondary`}
        onClick={onOpenExport}
        disabled={exportDisabled}
        title={exportTitle}
      >
        <IconExport />
        <span className="hidden lg:inline">Export</span>
      </button>
      {showAuthActions && authSessionStatus === "unauthenticated" ? (
        <Link
          href="/login?callbackUrl=%2Fapp"
          className={`${btn} btn-ghost`}
          title="Sign in to export"
        >
          <IconUser />
          <span className="hidden lg:inline">Sign in</span>
        </Link>
      ) : null}
      {showAuthActions && authSessionStatus === "authenticated" && onSignOut ? (
        <div className="dropdown dropdown-end hidden md:block">
          <button
            type="button"
            tabIndex={0}
            className={`${btn} btn-ghost max-w-[10rem] truncate`}
            title={userEmail || "Account"}
          >
            <IconUser />
            <span className="truncate hidden lg:inline max-w-[7rem]">{userEmail || "Account"}</span>
          </button>
          <ul
            tabIndex={0}
            className="dropdown-content menu bg-base-100 rounded-box z-[100] w-52 p-2 shadow border border-base-300"
          >
            <li>
              <button type="button" onClick={() => onSignOut()}>
                Sign out
              </button>
            </li>
          </ul>
        </div>
      ) : null}
      {hasPdf && onOpenParameters && (
        <button type="button" className={`${btn} btn-ghost`} onClick={onOpenParameters} title="Settings">
          <IconCog />
          <span className="hidden xl:inline">Settings</span>
        </button>
      )}
      {onPersistSessionDraft ? (
        <button
          type="button"
          className={`${btn} btn-ghost hidden lg:inline-flex items-center`}
          title="View full part catalog"
          onClick={handleNavigateToCatalog}
        >
          Catalog
        </button>
      ) : (
        <Link
          href="/catalog"
          className={`${btn} btn-ghost hidden lg:inline-flex items-center`}
          title="View full part catalog"
        >
          Catalog
        </Link>
      )}
      {hasPdf && onOpenNdt && (
        <button type="button" className={`${btn} btn-outline border-base-300`} onClick={onOpenNdt} title="NDT">
          <IconClipboard />
          <span className="hidden xl:inline">NDT</span>
        </button>
      )}
      {hasPdf && onOpenStatus && (
        <button
          type="button"
          className={`${btn} btn-outline border-base-300`}
          onClick={onOpenStatus}
          title="Project progress — welds & spools"
        >
          <IconChart />
          <span className="hidden md:inline">Progress</span>
        </button>
      )}
      {hasPdf && onOpenHealth && (
        <button
          type="button"
          className={`${btn} btn-outline border-base-300`}
          onClick={onOpenHealth}
          title="Project health — data checks & missing links"
        >
          <IconHealth />
          <span className="hidden lg:inline">Health</span>
        </button>
      )}
    </>
  );

  return (
    <>
      {/* Desktop toolbar — static */}
      <div className="hidden md:flex items-center justify-between gap-2 bg-base-100 shadow-sm rounded-lg mb-3 px-2 py-1.5">
        <div className="flex items-center min-w-0 gap-2">
          <span className="text-lg font-bold truncate">Weld Dashboard</span>
        </div>
        <div className="flex items-center gap-1 flex-wrap justify-end">
          {desktopActions}
        </div>
      </div>

      {/* Mobile — always-visible small menu button, expands to full dropdown */}
      <div className="md:hidden fixed top-3 right-3 z-50">
        <div className="dropdown dropdown-end">
          <label
            tabIndex={0}
            className="btn btn-sm btn-circle bg-base-100/80 backdrop-blur-md border border-base-300/50 shadow-lg"
            aria-label="Menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </label>
          <ul
            tabIndex={0}
            className="dropdown-content menu p-2 shadow-lg bg-base-100 rounded-box z-50 w-52 mt-2 max-h-[80dvh] overflow-y-auto"
          >
            <li>
              <label htmlFor="pdf-file-input-mobile" className="cursor-pointer">
                Load PDF
              </label>
              <input
                id="pdf-file-input-mobile"
                type="file"
                accept=".pdf,application/pdf"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = e.target.files;
                  if (files) {
                    for (let i = 0; i < files.length; i++) onLoadPdf?.(files[i]);
                  }
                  e.target.value = "";
                }}
              />
            </li>
            <li>
              <button type="button" onClick={onOpenProjects}>
                Open project
              </button>
            </li>
            <li>
              <button type="button" onClick={onSaveProject} disabled={!hasPdf}>
                Save project
              </button>
            </li>
            <li>
              <button type="button" onClick={onOpenExport} disabled={exportDisabled}>
                Export
              </button>
            </li>
            {showAuthActions && authSessionStatus === "unauthenticated" ? (
              <li>
                <Link href="/login?callbackUrl=%2Fapp">Sign in</Link>
              </li>
            ) : null}
            {showAuthActions && authSessionStatus === "authenticated" && onSignOut ? (
              <li>
                <button type="button" onClick={() => onSignOut()}>
                  Sign out
                </button>
              </li>
            ) : null}
            {hasPdf && onOpenParameters && (
              <li>
                <button type="button" onClick={onOpenParameters}>
                  Settings
                </button>
              </li>
            )}
            {hasPdf && onOpenNdt && (
              <li>
                <button type="button" onClick={onOpenNdt}>
                  NDT
                </button>
              </li>
            )}
            <li>
              {onPersistSessionDraft ? (
                <button type="button" className="w-full text-left" onClick={handleNavigateToCatalog}>
                  Catalog
                </button>
              ) : (
                <Link href="/catalog">Catalog</Link>
              )}
            </li>
            {hasPdf && onOpenStatus && (
              <li>
                <button type="button" onClick={onOpenStatus}>
                  Progress
                </button>
              </li>
            )}
            {hasPdf && onOpenHealth && (
              <li>
                <button type="button" onClick={onOpenHealth}>
                  Health
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>
    </>
  );
}

export default Toolbar;
