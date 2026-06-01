"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Search,
  ShieldCheck,
  Receipt,
  Gauge,
  Wind,
  AlertTriangle,
  PoundSterling,
  GitCompare,
  Bell,
  CalendarCheck,
  Code,
  Calculator,
  Wrench,
  BarChart3,
  Fuel,
  BookOpen,
  Car,
  FileText,
  CornerDownLeft,
  ArrowRight,
  Clock,
  X,
} from "lucide-react";
import {
  PRIMARY_NAV,
  SITE_ITEMS,
  detectReg,
  scoreItem,
  type SiteItem,
} from "@/lib/site-index";

interface CommandPaletteContext {
  open: () => void;
  close: () => void;
  isOpen: boolean;
}

const Ctx = createContext<CommandPaletteContext>({
  open: () => {},
  close: () => {},
  isOpen: false,
});

export const useCommandPalette = () => useContext(Ctx);

interface PostIndexItem {
  slug: string;
  title: string;
  description: string;
  keywords: string[];
}

interface RecentVehicle {
  reg: string;
  label?: string;
  ts: number;
}

const RECENT_KEY = "fpc:cmdk-recent-vehicles";
const RECENT_MAX = 5;

function readRecentVehicles(): RecentVehicle[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.slice(0, RECENT_MAX);
  } catch {
    return [];
  }
}

function rememberVehicle(reg: string, label?: string) {
  if (typeof window === "undefined") return;
  try {
    const existing = readRecentVehicles().filter((v) => v.reg !== reg);
    const next = [{ reg, label, ts: Date.now() }, ...existing].slice(0, RECENT_MAX);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* localStorage unavailable */
  }
}

const ICON_MAP: Record<string, typeof Search> = {
  search: Search,
  "shield-check": ShieldCheck,
  receipt: Receipt,
  gauge: Gauge,
  wind: Wind,
  "alert-triangle": AlertTriangle,
  "pound-sterling": PoundSterling,
  "git-compare": GitCompare,
  bell: Bell,
  "calendar-check": CalendarCheck,
  code: Code,
  calculator: Calculator,
  wrench: Wrench,
  "bar-chart-3": BarChart3,
  fuel: Fuel,
  "book-open": BookOpen,
  car: Car,
};

function iconFor(item: SiteItem) {
  if (item.icon && ICON_MAP[item.icon]) return ICON_MAP[item.icon];
  return ArrowRight;
}

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isK = e.key === "k" || e.key === "K";
      if (isK && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((v) => !v);
        return;
      }
      // Forward-slash also opens (GitHub-style) when nothing is focused
      if (e.key === "/" && !isOpen) {
        const t = e.target as HTMLElement | null;
        const inField =
          t &&
          (t.tagName === "INPUT" ||
            t.tagName === "TEXTAREA" ||
            t.isContentEditable);
        if (!inField) {
          e.preventDefault();
          setIsOpen(true);
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen]);

  // Lock background scroll when open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  return (
    <Ctx.Provider value={{ open, close, isOpen }}>
      {children}
      {isOpen && <Palette onClose={close} />}
    </Ctx.Provider>
  );
}

interface Hit {
  item: SiteItem;
  score: number;
}

function Palette({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const [posts, setPosts] = useState<PostIndexItem[] | null>(null);
  const [recent, setRecent] = useState<RecentVehicle[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus the input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Read recents once on mount
  useEffect(() => {
    // Recent vehicles come from localStorage, unavailable during SSR render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecent(readRecentVehicles());
  }, []);

  // Fetch blog post index lazily
  useEffect(() => {
    let cancelled = false;
    fetch("/api/search-index")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setPosts(data);
      })
      .catch(() => {
        /* offline / fetch failure — palette still works without blog index */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const reg = useMemo(() => detectReg(query), [query]);

  const results = useMemo(() => {
    const trimmed = query.trim();

    // Site item matches
    const siteHits: Hit[] = trimmed
      ? SITE_ITEMS.map((item) => ({ item, score: scoreItem(item, trimmed) }))
          .filter((h) => h.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 8)
      : [];

    // Blog post matches (converted to SiteItem shape so render is uniform)
    const postHits: Hit[] =
      trimmed && posts
        ? posts
            .map<Hit>((p) => {
              const fake: SiteItem = {
                title: p.title,
                subtitle: p.description,
                href: `/blog/${p.slug}`,
                category: "guide",
                keywords: p.keywords,
              };
              return { item: fake, score: scoreItem(fake, trimmed) };
            })
            .filter((h) => h.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 6)
        : [];

    return { siteHits, postHits };
  }, [query, posts]);

  // Build a flat ordered list of selectable rows so arrow keys can step
  // through every visible action in one stream.
  type Row =
    | { kind: "reg"; reg: string }
    | { kind: "recent"; vehicle: RecentVehicle }
    | { kind: "site"; item: SiteItem }
    | { kind: "post"; item: SiteItem };

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    if (reg) out.push({ kind: "reg", reg });
    if (!query.trim() && recent.length > 0) {
      recent.forEach((v) => out.push({ kind: "recent", vehicle: v }));
    }
    if (!query.trim()) {
      // Empty state — show all items grouped naturally
      SITE_ITEMS.forEach((item) => out.push({ kind: "site", item }));
    } else {
      results.siteHits.forEach((h) => out.push({ kind: "site", item: h.item }));
      results.postHits.forEach((h) => out.push({ kind: "post", item: h.item }));
    }
    return out;
  }, [reg, query, recent, results]);

  // Clamp selection when rows change
  useEffect(() => {
    // Clamp the keyboard selection when the row count shrinks.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelected((s) => Math.min(s, Math.max(0, rows.length - 1)));
  }, [rows.length]);

  // Reset selection when query changes
  useEffect(() => {
    // Reset the keyboard selection to the top when the query changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelected(0);
  }, [query]);

  // Scroll selected row into view
  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>(
      `[data-row-index="${selected}"]`
    );
    node?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  const runRow = useCallback(
    (row: Row) => {
      if (row.kind === "reg") {
        rememberVehicle(row.reg);
        window.location.href = `/?vrm=${encodeURIComponent(row.reg)}`;
        return;
      }
      if (row.kind === "recent") {
        rememberVehicle(row.vehicle.reg, row.vehicle.label);
        window.location.href = `/?vrm=${encodeURIComponent(row.vehicle.reg)}`;
        return;
      }
      window.location.href = row.item.href;
    },
    []
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(rows.length - 1, s + 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(0, s - 1));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const row = rows[selected];
      if (row) runRow(row);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-start sm:pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Search and navigate Free Plate Check"
      onKeyDown={onKeyDown}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close search"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-cmdk-fade"
      />

      {/* Panel */}
      <div className="relative w-full sm:max-w-xl mx-0 sm:mx-4 bg-slate-900 border-t sm:border border-slate-700/80 sm:rounded-2xl shadow-2xl shadow-cyan-500/5 overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[70vh] animate-cmdk-pop">
        {/* Input row */}
        <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5 border-b border-slate-800">
          <Search className="h-4 w-4 text-slate-500 flex-shrink-0" aria-hidden />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a reg, page, or topic…"
            className="flex-1 bg-transparent text-base sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none font-[family-name:var(--font-geist-mono)]"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
          <button
            type="button"
            onClick={onClose}
            className="sm:hidden text-slate-400 hover:text-slate-200 p-1 -m-1"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium text-slate-500 bg-slate-800 border border-slate-700 rounded">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="flex-1 overflow-y-auto py-2">
          {rows.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-slate-500">
              No matches. Try a different word — or paste a reg.
            </div>
          )}

          {/* Reg-detected row (always first) */}
          {rows.length > 0 && rows[0].kind === "reg" && (
            <Section label="Check this vehicle">
              <Row
                index={0}
                selected={selected === 0}
                onSelect={() => setSelected(0)}
                onRun={() => runRow(rows[0])}
                title={`Check ${(rows[0] as { kind: "reg"; reg: string }).reg}`}
                subtitle="Full report — MOT, tax, valuation & more"
                icon={Search}
                accent="cyan"
              />
            </Section>
          )}

          {/* Recents (empty-query state) */}
          {!query.trim() && recent.length > 0 && (
            <Section label="Recent vehicles">
              {recent.map((v, i) => {
                const rowIndex =
                  rows.findIndex(
                    (r) => r.kind === "recent" && r.vehicle.reg === v.reg
                  );
                return (
                  <Row
                    key={v.reg}
                    index={rowIndex}
                    selected={selected === rowIndex}
                    onSelect={() => setSelected(rowIndex)}
                    onRun={() => runRow({ kind: "recent", vehicle: v })}
                    title={v.reg}
                    subtitle={v.label || "Reopen this vehicle"}
                    icon={Clock}
                  />
                );
              })}
            </Section>
          )}

          {/* Empty state — show all items */}
          {!query.trim() && (
            <>
              <ItemGroup
                label="Checks"
                items={SITE_ITEMS.filter((i) => i.category === "check")}
                rows={rows}
                selected={selected}
                setSelected={setSelected}
                runRow={runRow}
              />
              <ItemGroup
                label="Tools"
                items={SITE_ITEMS.filter(
                  (i) => i.category === "tool" || i.category === "action"
                )}
                rows={rows}
                selected={selected}
                setSelected={setSelected}
                runRow={runRow}
              />
              <ItemGroup
                label="Stats & guides"
                items={SITE_ITEMS.filter(
                  (i) => i.category === "stats" || i.category === "guide"
                )}
                rows={rows}
                selected={selected}
                setSelected={setSelected}
                runRow={runRow}
              />
              <ItemGroup
                label="Site"
                items={SITE_ITEMS.filter((i) => i.category === "site")}
                rows={rows}
                selected={selected}
                setSelected={setSelected}
                runRow={runRow}
              />
            </>
          )}

          {/* Query-state — pages + posts */}
          {query.trim() && results.siteHits.length > 0 && (
            <Section label="Pages & tools">
              {results.siteHits.map((h) => {
                const rowIndex = rows.findIndex(
                  (r) => r.kind === "site" && r.item.href === h.item.href
                );
                return (
                  <Row
                    key={h.item.href}
                    index={rowIndex}
                    selected={selected === rowIndex}
                    onSelect={() => setSelected(rowIndex)}
                    onRun={() => runRow({ kind: "site", item: h.item })}
                    title={h.item.title}
                    subtitle={h.item.subtitle}
                    icon={iconFor(h.item)}
                  />
                );
              })}
            </Section>
          )}

          {query.trim() && results.postHits.length > 0 && (
            <Section label="Guides">
              {results.postHits.map((h) => {
                const rowIndex = rows.findIndex(
                  (r) => r.kind === "post" && r.item.href === h.item.href
                );
                return (
                  <Row
                    key={h.item.href}
                    index={rowIndex}
                    selected={selected === rowIndex}
                    onSelect={() => setSelected(rowIndex)}
                    onRun={() => runRow({ kind: "post", item: h.item })}
                    title={h.item.title}
                    subtitle={h.item.subtitle}
                    icon={FileText}
                  />
                );
              })}
            </Section>
          )}
        </div>

        {/* Footer hint */}
        <div className="hidden sm:flex items-center justify-between px-5 py-2.5 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd>
              <span>navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <Kbd>
                <CornerDownLeft className="h-2.5 w-2.5" />
              </Kbd>
              <span>open</span>
            </span>
            <span className="flex items-center gap-1">
              <Kbd>esc</Kbd>
              <span>close</span>
            </span>
          </div>
          <span className="text-slate-600">⌘K · /</span>
        </div>
      </div>

      <style jsx>{`
        @keyframes cmdkFade {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes cmdkPop {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes cmdkSlideUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        :global(.animate-cmdk-fade) {
          animation: cmdkFade 0.15s ease-out;
        }
        :global(.animate-cmdk-pop) {
          animation: cmdkSlideUp 0.18s ease-out;
        }
        @media (min-width: 640px) {
          :global(.animate-cmdk-pop) {
            animation: cmdkPop 0.15s ease-out;
          }
        }
      `}</style>
    </div>
  );
}

function ItemGroup({
  label,
  items,
  rows,
  selected,
  setSelected,
  runRow,
}: {
  label: string;
  items: SiteItem[];
  rows: Array<{ kind: "site"; item: SiteItem } | unknown>;
  selected: number;
  setSelected: (n: number) => void;
  runRow: (row: { kind: "site"; item: SiteItem }) => void;
}) {
  if (items.length === 0) return null;
  return (
    <Section label={label}>
      {items.map((item) => {
        const rowIndex = rows.findIndex(
          (r) =>
            typeof r === "object" &&
            r !== null &&
            (r as { kind: string }).kind === "site" &&
            (r as { item: SiteItem }).item.href === item.href
        );
        return (
          <Row
            key={item.href}
            index={rowIndex}
            selected={selected === rowIndex}
            onSelect={() => setSelected(rowIndex)}
            onRun={() => runRow({ kind: "site", item })}
            title={item.title}
            subtitle={item.subtitle}
            icon={iconFor(item)}
          />
        );
      })}
    </Section>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="px-2 py-1.5">
      <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}

function Row({
  index,
  selected,
  onSelect,
  onRun,
  title,
  subtitle,
  icon: Icon,
  accent,
}: {
  index: number;
  selected: boolean;
  onSelect: () => void;
  onRun: () => void;
  title: string;
  subtitle?: string;
  icon: typeof Search;
  accent?: "cyan";
}) {
  return (
    <button
      type="button"
      data-row-index={index}
      onMouseEnter={onSelect}
      onClick={onRun}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
        selected
          ? accent === "cyan"
            ? "bg-gradient-to-r from-cyan-500/15 to-blue-500/10 text-white"
            : "bg-slate-800 text-white"
          : "text-slate-300 hover:bg-slate-800/60"
      }`}
    >
      <span
        className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md ${
          accent === "cyan"
            ? "bg-gradient-to-br from-cyan-500 to-blue-500 text-white"
            : selected
            ? "bg-slate-700 text-cyan-300"
            : "bg-slate-800 text-slate-400"
        }`}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{title}</span>
        {subtitle && (
          <span className="block truncate text-xs text-slate-500">
            {subtitle}
          </span>
        )}
      </span>
      {selected && (
        <CornerDownLeft className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
      )}
    </button>
  );
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 text-[10px] font-medium text-slate-400 bg-slate-800 border border-slate-700 rounded">
      {children}
    </kbd>
  );
}

/** Exposed for completeness — currently consumed by SiteNav. */
export { PRIMARY_NAV };
