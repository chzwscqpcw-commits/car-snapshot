import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";
import BoltMark from "@/components/BoltMark";

export const metadata: Metadata = {
  title: "Contact — Free Plate Check",
  description:
    "Get in touch with the team behind Free Plate Check. Ideas, bug reports, business enquiries — we read every message.",
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk/contact",
  },
  openGraph: {
    title: "Contact — Free Plate Check",
    description:
      "Get in touch with the team behind Free Plate Check. Ideas, bug reports, business enquiries — we read every message.",
    url: "https://www.freeplatecheck.co.uk/contact",
    siteName: "Free Plate Check",
    type: "website",
  },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden border-b border-slate-800/60 bg-gradient-to-b from-slate-900/80 to-slate-950">
        <div className="absolute inset-0 opacity-30 pointer-events-none [background-image:radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.18),transparent_55%)]" />
        <div className="relative mx-auto max-w-2xl px-4 pt-10 pb-8 sm:pt-14 sm:pb-10">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-cyan-400 mb-3">
            <BoltMark className="h-3.5 w-3.5" />
            Contact
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Tell us what's on your mind.
          </h1>
          <p className="mt-3 max-w-xl text-base text-slate-400 leading-relaxed">
            Free Plate Check is built by a small team on zero budget. Spotted a
            bug, got a feature idea, or want to talk business? Drop a note below —
            it lands straight in our inbox.
          </p>
        </div>
      </section>

      {/* ─── Form ─── */}
      <section className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        <ContactForm />
      </section>

      {/* ─── Notes ─── */}
      <section className="mx-auto max-w-2xl px-4 pb-16">
        <div className="grid gap-3 sm:grid-cols-2 text-xs text-slate-400">
          <NoteCard title="What happens to your message">
            It's sent direct to our inbox, with your email as the Reply-To so we
            can respond. We don't add you to any list.
          </NoteCard>
          <NoteCard title="Response time">
            We're a tiny team. Most messages get a reply within a few days. Bug
            reports and business enquiries get priority.
          </NoteCard>
          <NoteCard title="Privacy">
            Your message and email are stored only long enough for us to reply.
            Nothing is shared or sold. See the{" "}
            <a href="/privacy" className="text-cyan-400 hover:text-cyan-300">
              privacy policy
            </a>
            .
          </NoteCard>
          <NoteCard title="Bug or data problem?">
            Include the registration number (if relevant) and what you expected vs
            what you saw. The more specific, the quicker we can fix it.
          </NoteCard>
        </div>
      </section>
    </div>
  );
}

function NoteCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
        {title}
      </p>
      <p className="leading-relaxed">{children}</p>
    </div>
  );
}
