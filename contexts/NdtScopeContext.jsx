"use client";

import { createContext, useContext, useMemo } from "react";

/** @type {import("react").Context<{ systems: object[]; lines: object[]; spools: object[] } | null>} */
const NdtScopeContext = createContext(null);

/**
 * Provides systems / lines / spools for NDT inheritance (project → system → line).
 * Must wrap client tree under /app where this data exists.
 */
export function NdtScopeProvider({ systems = [], lines = [], spools = [], children }) {
  const value = useMemo(
    () => ({
      systems: Array.isArray(systems) ? systems : [],
      lines: Array.isArray(lines) ? lines : [],
      spools: Array.isArray(spools) ? spools : [],
    }),
    [systems, lines, spools]
  );
  return <NdtScopeContext.Provider value={value}>{children}</NdtScopeContext.Provider>;
}

/** @returns {{ systems: object[]; lines: object[]; spools: object[] } | null} */
export function useNdtScope() {
  return useContext(NdtScopeContext);
}
