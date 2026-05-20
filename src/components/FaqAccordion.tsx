import { ChevronDown } from "lucide-react";

export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * Collapsed-by-default FAQ list using native <details>/<summary> elements
 * for built-in accessibility. The visual FAQ collapses; the structured-data
 * markup (FAQPage JSON-LD in the parent page) stays intact for SEO.
 */
export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  return (
    <div className="divide-y divide-slate-800/70 border-y border-slate-800/70">
      {items.map((item, i) => (
        <details
          key={i}
          className="group [&_summary::-webkit-details-marker]:hidden"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-4 text-base font-semibold text-slate-100 transition-colors hover:text-blue-300">
            <span>{item.question}</span>
            <ChevronDown className="h-4 w-4 flex-shrink-0 text-slate-500 transition-transform group-open:rotate-180" />
          </summary>
          <div className="pb-5 text-slate-300 leading-relaxed">{item.answer}</div>
        </details>
      ))}
    </div>
  );
}
