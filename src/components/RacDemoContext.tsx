"use client";

/**
 * RAC Placement Demo — context provider.
 * Reads the `fpc_demo` cookie to toggle demo mode for affiliate partner review.
 * When the cookie is absent every consumer returns false / no-ops — zero cost for real users.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface RacDemoCtx {
  isRacDemo: boolean;
  exitDemo: () => void;
}

const RacDemoContext = createContext<RacDemoCtx>({ isRacDemo: false, exitDemo: () => {} });

export function RacDemoProvider({ children }: { children: ReactNode }) {
  const [isRacDemo, setIsRacDemo] = useState(false);

  useEffect(() => {
    setIsRacDemo(document.cookie.split("; ").some((c) => c === "fpc_demo=rac"));
  }, []);

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
