"use client";

import { createContext, useContext, useState, useCallback } from "react";

/**
 * Tiny global state for "has the homepage loaded a result?".
 * Used by SiteNav to decide whether to show the wordmark next to the
 * bolt on `/` — when the page-level hero is visible the wordmark would
 * stack, when the result has replaced the hero it's the only place the
 * brand can appear.
 */
const HomeResultContext = createContext<{
  hasResult: boolean;
  setHasResult: (v: boolean) => void;
}>({ hasResult: false, setHasResult: () => {} });

export function HomeResultProvider({ children }: { children: React.ReactNode }) {
  const [hasResult, setHasResultState] = useState(false);
  // Stable identity so callers can include setHasResult in deps arrays
  // without triggering re-render loops.
  const setHasResult = useCallback((v: boolean) => setHasResultState(v), []);
  return (
    <HomeResultContext.Provider value={{ hasResult, setHasResult }}>
      {children}
    </HomeResultContext.Provider>
  );
}

export function useHomeResult() {
  return useContext(HomeResultContext);
}
