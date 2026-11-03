import { defineConfig } from 'vite';

export default defineConfig({
  // Model bakes run in module workers (see src/bake.worker.js), which need ES-format worker bundles.
  worker: { format: 'es' },
  // Set MADNESS_ENGINE_DIR to a local checkout of the engine (linked into node_modules) to develop both together.
  server: { fs: { allow: ['.', ...(process.env.MADNESS_ENGINE_DIR ? [process.env.MADNESS_ENGINE_DIR] : [])] } },
});
