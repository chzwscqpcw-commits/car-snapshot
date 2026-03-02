"use client";

/**
 * RAC Placement Demo — context provider.
 * Reads the `fpc_demo` cookie to toggle demo mode for affiliate partner review.
 * When the cookie is absent every consumer returns false / no-ops — zero cost for real users.
 */

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";

interface RacDemoCtx {
  isRacDemo: boolean;
  exitDemo: () => void;
}

const RacDemoContext = createContext<RacDemoCtx>({ isRacDemo: false, exitDemo: () => {} });

function checkCookie(): boolean {
  return typeof document !== "undefined" &&
    document.cookie.split("; ").some((c) => c === "fpc_demo=rac");
}

export function RacDemoProvider({ children }: { children: ReactNode }) {
  const [isRacDemo, setIsRacDemo] = useState(false);

  const sync = useCallback(() => setIsRacDemo(checkCookie()), []);

  useEffect(() => {
    // Check immediately on mount
    sync();

    // Re-check when the tab becomes visible (covers navigations, redirects, tab switches)
    document.addEventListener("visibilitychange", sync);

    // Re-check on popstate (back/forward navigation)
    window.addEventListener("popstate", sync);

    // Poll briefly after mount to catch cookie set just before a client-side redirect.
    // The gate page sets the cookie then calls router.push('/') — the layout stays
    // mounted so the mount-time effect won't re-fire. This interval catches it.
    const interval = setInterval(sync, 500);
    const timeout = setTimeout(() => clearInterval(interval), 5000);

    return () => {
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("popstate", sync);
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [sync]);

  function exitDemo() {
    document.cookie = "fpc_demo=; path=/; max-age=0";
    window.location.reload();
  }

  return (
    <RacDemoContext.Provider value={{ isRacDemo, exitDemo }}>
      {children}
    </RacDemoContext.Provider>
  );
}

export function useRacDemo() {
  return useContext(RacDemoContext);
}
