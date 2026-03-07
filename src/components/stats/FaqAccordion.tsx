"use client";

import { useState } from "react";

interface FaqItem {
  question: string;
  answer: string;
}

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <div className="my-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h3 className="mb-4 text-lg font-semibold text-gray-100">
        Frequently Asked Questions
      </h3>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div
            key={i}
            className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a]"
          >
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="flex w-full items-center justify-between p-4 text-left text-sm font-medium text-gray-100"
            >
              {item.question}
              <span className="ml-2 text-gray-500">
                {openIndex === i ? "−" : "+"}
              </span>
            </button>
            {openIndex === i && (
              <div className="border-t border-[#2a2a2a] px-4 pb-4 pt-3 text-sm leading-relaxed text-gray-400">
                {item.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
