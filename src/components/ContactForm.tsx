"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import Button from "@/components/Button";

type Category = "general" | "bug" | "feature" | "business" | "buy-this-site";

interface CategoryOption {
  value: Category;
  label: string;
  helper: string;
}

const CATEGORIES: CategoryOption[] = [
  { value: "general", label: "General question", helper: "Anything else." },
  { value: "bug", label: "Bug report", helper: "Something's broken." },
  { value: "feature", label: "Feature idea", helper: "Wish list / suggestion." },
  {
    value: "business",
    label: "Business / partnership",
    helper: "Affiliate, integration, press.",
  },
  {
    value: "buy-this-site",
    label: "Buying this site",
    helper: "Acquisition enquiry.",
  },
];

type SubmitState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "ok" }
  | { kind: "error"; message: string };

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState<Category>("general");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [state, setState] = useState<SubmitState>({ kind: "idle" });
  const mountedAt = useRef<number>(0);

  useEffect(() => {
    mountedAt.current = performance.now();
  }, []);

  const submitting = state.kind === "submitting";
  const succeeded = state.kind === "ok";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || succeeded) return;

    const timeOnPage = Math.round(performance.now() - mountedAt.current);

    setState({ kind: "submitting" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          category,
          message,
          website,
          timeOnPage,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setState({
          kind: "error",
          message: data?.error || "Something went wrong — please try again.",
        });
        return;
      }
      setState({ kind: "ok" });
    } catch {
      setState({
        kind: "error",
        message: "Couldn't reach the server — check your connection and try again.",
      });
    }
  };

  if (succeeded) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-900/25 via-slate-900/80 to-slate-950 p-8 text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/20 mb-4">
          <CheckCircle2 className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-xl font-bold text-white">Message sent.</h2>
        <p className="mt-2 text-sm text-slate-300">
          Thanks — we&#39;ll get back to you at{" "}
          <span className="text-cyan-300 font-medium">{email || "your email"}</span>{" "}
          as soon as we can.
        </p>
        <button
          type="button"
          onClick={() => {
            setName("");
            setEmail("");
            setCategory("general");
            setMessage("");
            setState({ kind: "idle" });
            mountedAt.current = performance.now();
          }}
          className="mt-5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          Send another →
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 sm:p-7 space-y-5"
      noValidate
    >
      {/* Honeypot — hidden from humans, visible to bots */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-9999px",
          width: "1px",
          height: "1px",
          overflow: "hidden",
        }}
      >
        <label htmlFor="contact-website">Website (leave blank)</label>
        <input
          id="contact-website"
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <Field
        label="Your name"
        helper="Optional — but it helps us address you properly."
        htmlFor="contact-name"
      >
        <input
          id="contact-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          disabled={submitting}
          autoComplete="name"
          className={inputClass}
          placeholder="Jane Smith"
        />
      </Field>

      <Field
        label="Your email"
        helper="So we can write back. Never shared, never marketed."
        htmlFor="contact-email"
        required
      >
        <input
          id="contact-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={submitting}
          autoComplete="email"
          inputMode="email"
          className={inputClass}
          placeholder="jane@example.com"
        />
      </Field>

      <Field label="Category" htmlFor="contact-category">
        <div className="grid gap-1.5 sm:grid-cols-2">
          {CATEGORIES.map((opt) => {
            const active = opt.value === category;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setCategory(opt.value)}
                disabled={submitting}
                aria-pressed={active}
                className={`text-left rounded-lg border px-3 py-2.5 transition-colors ${
                  active
                    ? "border-cyan-500/40 bg-cyan-500/10"
                    : "border-slate-700 bg-slate-950/50 hover:border-slate-600 hover:bg-slate-800/60"
                }`}
              >
                <span
                  className={`block text-sm font-medium ${
                    active ? "text-cyan-200" : "text-slate-200"
                  }`}
                >
                  {opt.label}
                </span>
                <span className="block text-[11px] text-slate-500 mt-0.5">
                  {opt.helper}
                </span>
              </button>
            );
          })}
        </div>
      </Field>

      <Field
        label="Your message"
        helper={`${message.length}/2000 — minimum 20 characters.`}
        htmlFor="contact-message"
        required
      >
        <textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          minLength={20}
          maxLength={2000}
          disabled={submitting}
          rows={6}
          className={`${inputClass} resize-y leading-relaxed`}
          placeholder="What's on your mind?"
        />
      </Field>

      {state.kind === "error" && (
        <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-950/30 px-3 py-2.5 text-sm text-rose-200">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{state.message}</span>
        </div>
      )}

      <Button
        type="submit"
        disabled={submitting || message.length < 20 || !email}
        className="w-full"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Send message
          </>
        )}
      </Button>

      <p className="text-[11px] text-slate-500 leading-relaxed">
        By submitting you agree to us storing the message and your email long
        enough to reply. We never share or sell contact details.
      </p>
    </form>
  );
}

const inputClass =
  "block w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-base text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/40 focus:ring-2 focus:ring-cyan-500/30 disabled:opacity-60 transition-colors";

function Field({
  label,
  helper,
  htmlFor,
  required,
  children,
}: {
  label: string;
  helper?: string;
  htmlFor?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-semibold text-slate-200 mb-1.5"
      >
        {label}
        {required && <span className="text-cyan-400 ml-1">*</span>}
      </label>
      {children}
      {helper && (
        <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
          {helper}
        </p>
      )}
    </div>
  );
}
