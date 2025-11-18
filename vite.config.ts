import { cloudflare } from '@cloudflare/vite-plugin'
import { defineConfig } from 'vite'
import ssrPlugin from 'vite-ssr-components/plugin'

export default defineConfig({
  plugins: [
    cloudflare({
      configPath: './wrangler.test.jsonc',
      persistState: true
    }), 
    ssrPlugin()
  ],
  server: {
    port: 5173,
    strictPort: true,
    host: true,
    hmr: {
      port: 5173
    }
  },
  build: {
    outDir: 'dist',
    ssr: true,
    minify: true,
    rollupOptions: {
      input: './src/index.tsx',
      output: {
        entryFileNames: 'index.js',
        format: 'es'
      }
    }
  },
  ssr: {
    target: 'webworker',
    noExternal: true
  },
  resolve: {
    conditions: ['worker', 'webworker']
  }
})