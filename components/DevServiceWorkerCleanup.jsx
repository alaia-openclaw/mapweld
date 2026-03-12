"use client";

import { useEffect } from "react";

/**
 * In development, unregister any service worker and clear caches so stale
 * precache entries (e.g. old CSS chunk URLs) don't 404 and trigger full reloads.
 */
function DevServiceWorkerCleanup() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    if (typeof navigator === "undefined" || !navigator.serviceWorker) return;

    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((reg) => reg.unregister());
    });

    if (typeof caches !== "undefined") {
      caches.keys().then((keys) => {
        keys.forEach((key) => caches.delete(key));
      });
    }
  }, []);

  return null;
}

export default DevServiceWorkerCleanup;
