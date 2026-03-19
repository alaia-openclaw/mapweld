"use client";

import Link from "next/link";

/**
 * First-run chooser: open file, saved projects, or new project wizard.
 */
function ProjectSetupHub({
  onNewProject,
  onOpenSavedProjects,
  onLoadProjectFile,
  onSkipToWorkspace,
  projectFileInputRef,
}) {
  return (
    <div className="flex flex-1 min-h-[min(70dvh,36rem)] w-full flex-col items-center justify-center py-12 px-4">
      <div className="max-w-lg w-full rounded-2xl border border-base-300 bg-base-200/40 shadow-lg p-8 space-y-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-base-content">Project setup</h1>
          <p className="text-sm text-base-content/70 leading-relaxed">
            Open an existing <span className="font-mono text-xs">.weldproject</span> file, continue from a saved copy on this
            device, or start a new project and walk through the basics.
          </p>
        </div>

        <input
          ref={projectFileInputRef}
          type="file"
          accept=".weldproject,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onLoadProjectFile?.(file);
            e.target.value = "";
          }}
        />

        <div className="flex flex-col gap-3">
          <button
            type="button"
            className="btn btn-primary gap-2 w-full"
            onClick={() => projectFileInputRef?.current?.click()}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"
              />
            </svg>
            Open project file
          </button>
          <button type="button" className="btn btn-outline gap-2 w-full border-base-300" onClick={onOpenSavedProjects}>
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7C5 4 4 5 4 7zm8 3v6m-3-3h6"
              />
            </svg>
            Saved projects on this device
          </button>
          <button type="button" className="btn btn-ghost gap-2 w-full" onClick={onNewProject}>
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New project (guided setup)
          </button>
        </div>

        <div className="text-center text-xs text-base-content/50 space-y-2">
          {onSkipToWorkspace && (
            <div>
              <button type="button" className="link link-hover text-base-content/70" onClick={onSkipToWorkspace}>
                Skip — use the toolbar to load a PDF or project
              </button>
            </div>
          )}
          <div>
            <Link href="/" className="link link-hover">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectSetupHub;
