import type { ComponentPropsWithoutRef, ReactNode } from "react";
import Link from "next/link";

/**
 * The single source of truth for CTA styling (site-audit Q3). Before this, the
 * primary gradient had drifted into ~9 variants — reversed direction, off shades,
 * and stray violet/amber one-offs — because every button hand-rolled its classes.
 * Use <Button> for CTAs so the canonical cyan→blue primary (and its hover) is
 * defined once.
 *
 * Rendering:
 *   - internal href (starts with "/") → next/link (keeps client-side nav + prefetch)
 *   - external href                   → <a>
 *   - no href                         → <button>
 */
type Variant = "primary" | "secondary";
type Size = "sm" | "md" | "lg";

const VARIANT: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-md shadow-cyan-500/20",
  secondary:
    "border border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-700 hover:text-white",
};

const SIZE: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

const BASE =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-semibold transition-all disabled:opacity-70 disabled:cursor-not-allowed";

type BaseProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

type AsButton = BaseProps & Omit<ComponentPropsWithoutRef<"button">, "className" | "children"> & { href?: undefined };
type AsLink = BaseProps & Omit<ComponentPropsWithoutRef<"a">, "className" | "children"> & { href: string };

function isInternal(href: string): boolean {
  return href.startsWith("/") && !href.startsWith("//");
}

export default function Button(props: AsButton | AsLink) {
  const { variant = "primary", size = "md", className = "", children } = props;
  const cls = `${BASE} ${SIZE[size]} ${VARIANT[variant]} ${className}`;

  if (props.href !== undefined) {
    const { variant: _v, size: _s, className: _c, children: _ch, href, ...rest } = props;
    // Internal routes keep client-side navigation + prefetch via next/link;
    // external / partner links render a plain <a>.
    if (isInternal(href)) {
      return (
        <Link href={href} className={cls} {...rest}>
          {children}
        </Link>
      );
    }
    return (
      <a href={href} className={cls} {...rest}>
        {children}
      </a>
    );
  }

  const { variant: _v, size: _s, className: _c, children: _ch, ...rest } = props;
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}
