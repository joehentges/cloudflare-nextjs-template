import { getCloudflareContext } from "@opennextjs/cloudflare"

export async function getKV() {
  const { env } = getCloudflareContext()
  return env.NEXT_CACHE_WORKERS_KV
}
