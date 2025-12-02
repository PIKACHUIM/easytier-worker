import {serveStatic} from 'hono/cloudflare-workers' // @ts-ignore
// import manifest from '__STATIC_CONTENT_MANIFEST'
import * as index from './index'
import type {Env} from "./types";

// index.app.use("*", serveStatic({manifest: manifest, root: "./"}));
// export default index.app
index.app.fire()

// 定时任务 ############################################################################################################
export default {
    async fetch(request: Request, env: index.Bindings, ctx: ExecutionContext) {
        return index.app.fetch(request, env, ctx);
    },
    async scheduled(event: any, env: Env, ctx: any): Promise<void> {
        await index.scheduled(event, env, ctx);
    }
};