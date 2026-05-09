import {defineConfig, type PluginOption} from 'vite'
import ssrPlugin from 'vite-ssr-components/plugin'

const isEdgeOne = process.env.DEPLOY_TARGET === 'edgeone' || process.env.EDGEONE === '1'

export default defineConfig(async () => {
    const plugins: PluginOption[] = []

    // cloudflare 插件仅在非 EdgeOne 环境下加载（EdgeOne 不需要 wrangler 配置）
    if (!isEdgeOne) {
        try {
            const {cloudflare} = await import('@cloudflare/vite-plugin')
            plugins.push(cloudflare({
                persistState: true,
                configPath: './wrangler.jsonc',
            }))
        } catch {
            // 如果 cloudflare 插件不可用则跳过
        }
    }

    plugins.push(ssrPlugin())

    return {
        plugins,
        esbuild: {
            keepNames: true,
        },
        server: {
            port: 5175,
            strictPort: true,
            host: true,
            hmr: {
                port: 5175
            }
        },
        build: {
            outDir: 'dist',
            ssr: true,
            minify: true,
            rollupOptions: {
                input: './src/cfapp.ts',
                external: ['cloudflare:sockets'],
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
    }
})