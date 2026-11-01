import path from "node:path";
import type { WebpackOverrideFn } from "@remotion/bundler";

/**
 * The compositions read the site's own data and helpers through the site's
 * `@/` alias (src/lib/valuation.ts, src/components/home/sample-cars.ts, the
 * JSON under src/data). Nothing from the site's app or its dependencies is
 * bundled: only pure modules are imported.
 */
export const withSiteAlias: WebpackOverrideFn = (config) => ({
  ...config,
  resolve: {
    ...config.resolve,
    alias: {
      ...(config.resolve?.alias ?? {}),
      "@": path.resolve(__dirname, "..", "..", "src"),
    },
  },
});
