/**
 * The props of every composition. Pickers (src/pickers) build them from the
 * site's data; compositions (src/compositions) draw them. Everything here is
 * plain JSON so Remotion can pass it as inputProps.
 */

export interface Common {
  /** Burned-in hook, as segments; `{ em }` parts render italic cyan. */
  hook: Array<string | { em: string }>;
  eyebrow: string;
  source: string;
  cta: string;
  /** The sample plate on the closing card (never a real registration). */
  plate: string;
  music: boolean;
}

export interface RankRow {
  label: string;
  value: number;
  display: string;
  sub?: string;
}

/** Theft: a ranked list against a national line. */
export interface TheftProps extends Common {
  variant: "most-stolen" | "least-stolen" | "vans" | "risers" | "by-age";
  rows: RankRow[];
  national: number;
  nationalLabel: string;
  unit: string;
  intro: string;
  outro: string;
}

export interface HowManyLeftProps extends Common {
  name: string;
  licensed: number;
  sorn: number;
  category: string;
  outro: string;
}

export interface ColoursProps extends Common {
  variant: "top" | "rare";
  rows: Array<RankRow & { swatch: string }>;
  intro: string;
  outro: string;
}

export interface RegistrationsProps extends Common {
  variant: "total" | "bev" | "diesel";
  columns: Array<{ label: string; value: number; highlight?: boolean }>;
  line: Array<{ x: string; y: number }>;
  intro: string;
  outro: string;
}

export interface WrongTurnProps extends Common {
  lines: string[];
}

export interface ValueTableProps extends Common {
  variant: "holders" | "losers";
  rows: RankRow[];
  intro: string;
  outro: string;
}

export interface WorthAfterProps extends Common {
  name: string;
  newPrice: number;
  points: Array<{ age: number; value: number }>;
  intro: string;
  outro: string;
}

export interface UsedPriceTrendProps extends Common {
  line: Array<{ x: string; y: number }>;
  annotations: Array<{ index: number; text: string }>;
  intro: string;
  outro: string;
}

export interface FailReasonsProps extends Common {
  subject: string;
  rows: RankRow[];
  ranked: boolean;
  intro: string;
  outro: string;
}

export interface PassByAreaProps extends Common {
  variant: "best" | "worst" | "spotlight";
  rows: RankRow[];
  national: number;
  /** The town of a spotlight clip: its own pass rate against the UK's. */
  spotlight?: { name: string; passRate: number; tests: number };
  intro: string;
  outro: string;
}

export interface PassByModelProps extends Common {
  variant: "best" | "worst" | "makes";
  rows: RankRow[];
  national: number;
  intro: string;
  outro: string;
}

export interface SeasonDueProps extends Common {
  monthIndex: number;
  columns: Array<{ label: string; value: number; highlight?: boolean }>;
  intro: string;
  outro: string;
}

export type CompositionId =
  | "Theft"
  | "HowManyLeft"
  | "Colours"
  | "Registrations"
  | "WrongTurn"
  | "ValueTable"
  | "WorthAfter"
  | "UsedPriceTrend"
  | "FailReasons"
  | "PassByArea"
  | "PassByModel"
  | "SeasonDue";

export type AnyProps =
  | TheftProps
  | HowManyLeftProps
  | ColoursProps
  | RegistrationsProps
  | WrongTurnProps
  | ValueTableProps
  | WorthAfterProps
  | UsedPriceTrendProps
  | FailReasonsProps
  | PassByAreaProps
  | PassByModelProps
  | SeasonDueProps;

/** What a picker returns: the composition, its props, and the words around it. */
export interface Picked<P extends AnyProps = AnyProps> {
  composition: CompositionId;
  props: P;
  /** Short, for the email list and the release notes. */
  title: string;
  /** The caption body (no hashtags, no link): templated from the data. */
  caption: string;
  /** Topic hashtags, beyond the audience's standard set. */
  tags: string[];
  /** Where the numbers come from, and the data's date. */
  source: string;
  sourceDate: string;
}
