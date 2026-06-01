import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated build output — `vercel build` writes here locally; it's
    // gitignored and minified/vendored, so linting it is noise (was ~113
    // phantom errors: no-this-alias, no-require-imports, etc.).
    ".vercel/**",
  ]),
]);

export default eslintConfig;
