"use client";

import { createContext, useContext, useState, useMemo, useCallback } from "react";

const CatalogToolbarContext = createContext(null);

export function CatalogToolbarProvider({ children }) {
  const [toolbar, setToolbarState] = useState(null);
  const setToolbar = useCallback((node) => {
    setToolbarState(node);
  }, []);
  const value = useMemo(() => ({ toolbar, setToolbar }), [toolbar, setToolbar]);
  return <CatalogToolbarContext.Provider value={value}>{children}</CatalogToolbarContext.Provider>;
}

export function useCatalogToolbar() {
  const ctx = useContext(CatalogToolbarContext);
  if (!ctx) {
    return { toolbar: null, setToolbar: () => {} };
  }
  return ctx;
}
