import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    root: './',
    include: ['src/**/*.spec.ts'],
    setupFiles: ['src/test-setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'src/test-setup.ts', 'src/main.ts', 'src/**/*.module.ts', 'src/**/dto/**'],
    },
  },
  plugins: [
    // Nest resolves constructor dependencies from `design:paramtypes`, which
    // only a decorator-metadata-aware transform emits. esbuild does not, so the
    // DI container would hand every provider `undefined` without this.
    swc.vite({
      module: { type: 'es6' },
      jsc: {
        target: 'es2022',
        parser: { syntax: 'typescript', tsx: true, decorators: true },
        transform: {
          legacyDecorator: true,
          decoratorMetadata: true,
          react: { runtime: 'automatic' },
        },
      },
    }),
  ],
});
