/**
 * Parse a display string (e.g. "£6,980", "84.2%", "+38%") into its numeric
 * value plus surrounding prefix and suffix. Returns numeric=null if no number
 * is present (e.g. "Toyota", "EVs"), in which case the caller should render
 * the original string without animation.
 *
 * Examples:
 *   "84.2%"     → { prefix: "",   numeric: 84.2, suffix: "%",   decimals: 1 }
 *   "£6,980"    → { prefix: "£",  numeric: 6980, suffix: "",    decimals: 0 }
 *   "~£6,980/yr"→ { prefix: "~£", numeric: 6980, suffix: "/yr", decimals: 0 }
 *   "+38%"      → { prefix: "+",  numeric: 38,   suffix: "%",   decimals: 0 }
 *   "~10k mi"   → { prefix: "~",  numeric: 10,   suffix: "k mi",decimals: 0 }
 *   "Toyota"    → { prefix: "",   numeric: null, suffix: "",    decimals: 0 }
 *
 * Lives in a plain .ts module (not a "use client" component file) so it can
 * be imported and invoked from both server and client components.
 */
export function parseDisplayValue(value: string): {
  prefix: string;
  numeric: number | null;
  suffix: string;
  decimals: number;
} {
  const match = value.match(/^([^\d\-]*?)(-?[\d,]+(?:\.\d+)?)(.*)$/);
  if (!match) return { prefix: "", numeric: null, suffix: "", decimals: 0 };

  const [, prefix, numStr, suffix] = match;
  const cleaned = numStr.replace(/,/g, "");
  const numeric = parseFloat(cleaned);
  if (Number.isNaN(numeric)) {
    return { prefix: "", numeric: null, suffix: "", decimals: 0 };
  }

  const decimals = numStr.includes(".") ? numStr.split(".")[1].length : 0;
  return { prefix, numeric, suffix, decimals };
}
