import react from '@vitejs/plugin-react';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

const publicDir = fileURLToPath(new URL('./public', import.meta.url));
const workerSource = fileURLToPath(new URL('./service-worker.js', import.meta.url));

/** Emits dist/sw.js, which caches every built and public file so the installed app opens offline. */
function serviceWorker(): Plugin {
  return {
    name: 'pinggan-service-worker',
    apply: 'build',
    // After Vite's own plugins, so the bundle already includes index.html.
    enforce: 'post',
    generateBundle(_options, bundle) {
      const files = new Map<string, string | Uint8Array>();
      for (const [name, output] of Object.entries(bundle)) {
        files.set(name, output.type === 'chunk' ? output.code : output.source);
      }
      for (const entry of readdirSync(publicDir, { withFileTypes: true })) {
        if (entry.isFile()) files.set(entry.name, readFileSync(`${publicDir}/${entry.name}`));
      }
      const names = [...files.keys()].sort();
      const hash = createHash('sha256');
      for (const name of names) hash.update(name).update(files.get(name)!);
      const source = readFileSync(workerSource, 'utf8')
        .replace('__VERSION__', hash.digest('hex').slice(0, 12))
        .replace('__PRECACHE__', JSON.stringify(names.map((name) => `/${name}`)));
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}

export default defineConfig({
  plugins: [react(), serviceWorker()],
  server: {
    host: true,
    port: 5173,
    proxy: { '/api': 'http://127.0.0.1:8000' },
    // The nutrition database lives in ../data so the backend can share it.
    fs: { allow: ['..'] },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
