import { cloudflare } from '@cloudflare/vite-plugin'
import { defineConfig } from 'vite'
import ssrPlugin from 'vite-ssr-components/plugin'

export default defineConfig({
  plugins: [
    cloudflare({
      configPath: './wrangler.jsonc'
    }), 
    ssrPlugin()
  ],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
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
  },
  publicDir: false
})
