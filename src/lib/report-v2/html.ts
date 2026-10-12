// Tiny HTML builder for the report template. `html` escapes every
// interpolated value unless it is already a `Safe` (the output of another
// `html` call, or `raw()` for trusted literals). Vehicle data reaches this
// template from the request body, so nothing user-supplied may be emitted
// unescaped: the headless browser renders with JS off and no network, but
// escaping is still the first line of defence.

export class Safe {
  constructor(readonly value: string) {}
  toString(): string {
    return this.value;
  }
}

/** Mark a trusted literal (CSS, SVG we wrote) as safe. Never pass request data. */
export function raw(value: string): Safe {
  return new Safe(value);
}

export function escapeHtml(value: unknown): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type Interp = Safe | string | number | null | undefined | false | Interp[];

function render(v: Interp): string {
  if (v === null || v === undefined || v === false) return "";
  if (v instanceof Safe) return v.value;
  if (Array.isArray(v)) return v.map(render).join("");
  return escapeHtml(v);
}

export function html(strings: TemplateStringsArray, ...values: Interp[]): Safe {
  let out = strings[0];
  for (let i = 0; i < values.length; i++) out += render(values[i]) + strings[i + 1];
  return new Safe(out);
}
