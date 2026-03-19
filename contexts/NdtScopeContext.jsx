"use client";

import { createContext, useContext, useMemo } from "react";

/** @type {import("react").Context<{ systems: object[]; lines: object[]; spools: object[]; parts: object[] } | null>} */
const NdtScopeContext = createContext(null);

/**
 * Provides systems / lines / spools for NDT inheritance (project → system → line),
 * and parts for weld joint dimension resolution (fit-up / status).
 */
export function NdtScopeProvider({ systems = [], lines = [], spools = [], parts = [], children }) {
  const value = useMemo(
    () => ({
      systems: Array.isArray(systems) ? systems : [],
      lines: Array.isArray(lines) ? lines : [],
      spools: Array.isArray(spools) ? spools : [],
      parts: Array.isArray(parts) ? parts : [],
    }),
    [systems, lines, spools, parts]
  );
  return <NdtScopeContext.Provider value={value}>{children}</NdtScopeContext.Provider>;
}

/** @returns {{ systems: object[]; lines: object[]; spools: object[]; parts: object[] } | null} */
export function useNdtScope() {
  return useContext(NdtScopeContext);
}
