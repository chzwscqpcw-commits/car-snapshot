// Colour popularity lookup — UK new car registration colour share (SMMT 2025 data)

import colourData from "@/data/colour-popularity.json";

const data = colourData as Record<string, { rank: number; share: number; label: string }>;

export type ColourPopularity = {
  rank: number;
  share: number;
  label: string;
  isTopFive: boolean;
};

/**
 * Look up colour popularity by DVLA colour name.
 * Returns null if colour not found in lookup table.
 */
export function lookupColourPopularity(colour?: string): ColourPopularity | null {
  if (!colour) return null;
  const key = colour.toUpperCase().trim();
  const entry = data[key];
  if (!entry) return null;
  return {
    rank: entry.rank,
    share: entry.share,
    label: entry.label,
    isTopFive: entry.rank <= 5,
  };
}
