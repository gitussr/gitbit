import { defineConfig } from 'vitest/config'
import path from 'node:path'

/**
 * Kept separate from `vite.config.ts` on purpose.
 *
 * Pushing to `main` deploys to production, and importing `vitest/config`
 * into the build config would put a dev dependency on the critical path of
 * every deploy. The cost is repeating the `@` alias in four lines here.
 *
 * Tests cover `src/services/git-sim/**` only — the engine is pure
 * functions, and it is where a wrong answer would teach someone something
 * false about Git (see docs/VISUALIZER.md).
 */
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  test: {
    include: ['src/services/git-sim/**/*.test.ts'],
    environment: 'node',
  },
})
