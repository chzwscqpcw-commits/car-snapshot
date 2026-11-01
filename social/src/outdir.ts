/**
 * Where a relative --out means. The root scripts run through
 * `npm --prefix social`, which changes the working directory to social/, so
 * a bare path.resolve put `--out social/out/current` in social/social/out/current
 * and the workflow's next step found nothing there (every scheduled render
 * from 6 to 20 Nov 2026). npm records the directory it was started in as
 * INIT_CWD; use that, so the path means what it says wherever the script runs.
 */
export function outBase(env: NodeJS.ProcessEnv = process.env, cwd = process.cwd()): string {
  return env.INIT_CWD || cwd;
}
