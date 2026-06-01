# Free Plate Check

[![CI](https://github.com/chzwscqpcw-commits/car-snapshot/actions/workflows/ci.yml/badge.svg)](https://github.com/chzwscqpcw-commits/car-snapshot/actions/workflows/ci.yml)

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Development

Useful local commands:

```bash
npm run dev          # start the dev server (http://localhost:3000)
npm run build        # production build (also runs the prebuild data scripts)
npm run typecheck    # tsc --noEmit — catch type errors
npm run lint         # eslint
npm test             # PDF report smoke-test (alias of test:pdf)
```

## Continuous Integration (CI)

[![CI](https://github.com/chzwscqpcw-commits/car-snapshot/actions/workflows/ci.yml/badge.svg)](https://github.com/chzwscqpcw-commits/car-snapshot/actions/workflows/ci.yml)

**CI = Continuous Integration** — an automated set of checks that GitHub runs in
the cloud on every push and pull request to `main`. It spins up a clean machine,
installs the project from scratch, and runs the checks below. The point is to
catch regressions *before* they reach the live site, without anyone having to
remember to test by hand.

The pipeline is defined in [`.github/workflows/ci.yml`](.github/workflows/ci.yml)
and runs three steps:

| Step | What it checks | Blocking? |
|------|----------------|-----------|
| **Typecheck** | TypeScript holds together (`tsc --noEmit`) | ✅ fails the build |
| **Lint** | Code style/quality (`eslint`) | ✅ fails the build |
| **PDF report smoke-test** | A report still generates correctly — right valuation figure + range, and mileage shown in **miles not km** ([`scripts/test-pdf-report.ts`](scripts/test-pdf-report.ts)) | ✅ fails the build |

### How to use it

You don't trigger CI manually — it runs automatically when you `git push`. In
practice:

1. **Push your change** as normal.
2. **Watch the badge / the [Actions tab](https://github.com/chzwscqpcw-commits/car-snapshot/actions).**
   Green ✅ = all checks passed. Red ❌ = something failed.
3. **If it's red,** click the failed run to see which step broke and read the
   log — it tells you exactly what failed (e.g. a type error, or the report
   test finding a wrong figure). Fix it and push again.
4. **To check before pushing,** run the same checks locally: `npm run typecheck`
   and `npm test`.

The live status is also shown on the internal **Data Health dashboard**
(`/data-health`, under *Build*), so you can see build health alongside data
freshness.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
