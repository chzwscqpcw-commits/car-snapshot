"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { facts } from "@/data/did-you-know";

/** Fisher-Yates shuffle — guarantees all facts shown before any repeat */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function DidYouKnow() {
  const [queue, setQueue] = useState<typeof facts>([]);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  // Shuffle on mount (SSR-safe — renders null until effect fires)
  useEffect(() => {
    setQueue(shuffle(facts));
    setVisible(true);
  }, []);

  // Auto-rotate every 50 seconds with 400ms crossfade
  const advance = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      setIndex((prev) => {
        const next = prev + 1;
        if (next >= queue.length) {
          // Reshuffle when we've shown all facts
          setQueue(shuffle(facts));
          return 0;
        }
        return next;
      });
      setVisible(true);
    }, 400);
  }, [queue.length]);

  useEffect(() => {
    if (queue.length === 0) return;
    const timer = setInterval(advance, 50_000);
    return () => clearInterval(timer);
  }, [advance, queue.length]);

  if (queue.length === 0) {
    // Reserve space to prevent layout shift
    return <div className="min-h-[20px] sm:min-h-[24px]" />;
  }

  const fact = queue[index];

  return (
    <div
      className="min-h-[20px] sm:min-h-[24px] text-xs sm:text-sm"
      aria-live="polite"
    >
      <p
        className="transition-opacity duration-400"
        style={{ opacity: visible ? 1 : 0 }}
      >
        <span className="text-slate-500">Did you know? </span>
        {fact.href ? (
          <Link
            href={fact.href}
            className="text-slate-500 hover:text-slate-400 transition-colors"
          >
            {fact.text}
            <span className="ml-1 text-slate-600">→</span>
          </Link>
        ) : (
          <span className="text-slate-500">{fact.text}</span>
        )}
      </p>
    </div>
  );
}
