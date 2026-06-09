"use client";

import { useState, useEffect, type FormEvent, type ReactNode } from "react";

// Shared soft password gate for the /preview/* mock-ups. Not real security —
// just keeps the in-progress mock-ups out of casual view so they can be shown to
// partners (carVertical, ClickMechanic) for sign-off. Pages are also noindexed
// via preview/layout.tsx. One unlock (sessionStorage) covers the whole preview
// area, so a partner can click between the microsite pages freely.
const PREVIEW_PASSWORD = "fpc-preview-2026";
const SESSION_KEY = "fpc_preview_unlocked";

export default function PreviewGate({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem(SESSION_KEY) === "1") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restore unlock from sessionStorage after mount (client-only; cannot run during SSR)
      setAuthed(true);
    }
  }, []);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (pw === PREVIEW_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setAuthed(true);
      setErr(false);
    } else {
      setErr(true);
    }
  }

  if (authed) return <>{children}</>;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h1 className="text-lg font-semibold text-white">Preview</h1>
        <p className="mt-1 text-sm text-slate-400">Enter the password to view this mock-up.</p>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Password"
          autoFocus
          className="mt-4 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
        {err && <p className="mt-2 text-sm text-red-400">Wrong password. Try again.</p>}
        <button
          type="submit"
          className="mt-4 w-full rounded-lg bg-cyan-500 px-4 py-2.5 font-medium text-white transition-colors hover:bg-cyan-600"
        >
          View mock-up
        </button>
      </form>
    </main>
  );
}
