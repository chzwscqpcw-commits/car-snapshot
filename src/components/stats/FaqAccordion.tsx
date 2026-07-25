"use client";

import { useState } from "react";

interface FaqItem {
  question: string;
  answer: string;
}

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="my-10">
      <h3 className="mb-4 text-lg font-semibold text-slate-100">
        Frequently Asked Questions
      </h3>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div
            key={i}
            className="rounded-lg border border-[#1e293b] bg-[#0f172a]"
          >
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="flex w-full items-center justify-between p-4 text-left text-sm font-medium text-slate-100"
            >
              {item.question}
              <span className="ml-2 text-slate-500">
                {openIndex === i ? "−" : "+"}
              </span>
            </button>
            {openIndex === i && (
              <div className="border-t border-[#1e293b] px-4 pb-4 pt-3 text-sm leading-relaxed text-slate-400">
                {item.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
