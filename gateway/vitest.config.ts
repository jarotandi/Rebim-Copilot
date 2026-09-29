import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const gatewayRoot = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = resolve(gatewayRoot, '..');
const testsGlob = resolve(repoRoot, 'tests/**/*.test.ts').replace(/\\/g, '/');

export default defineConfig({
  root: gatewayRoot,
  server: {
    fs: {
      allow: [repoRoot]
    }
  },
  test: {
    include: [testsGlob],
    environment: 'node'
  }
});
