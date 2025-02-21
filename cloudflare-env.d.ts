// Generated by Wrangler by running `wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts`

interface CloudflareEnv {
	NEXT_CACHE_WORKERS_KV: KVNamespace;
	EMAIL_FROM: "hello@saas-stack.startup-studio.dev";
	EMAIL_FROM_NAME: "Startup Studio";
	EMAIL_REPLY_TO: "startupstudio.dev@gmail.com";
	DATABASE: D1Database;
	ASSETS: Fetcher;
}
