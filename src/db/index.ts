import { getCloudflareContext } from "@opennextjs/cloudflare"
import { drizzle } from "drizzle-orm/d1"
import type { DrizzleD1Database } from "drizzle-orm/d1"

import * as schema from "./schemas"

export let db: DrizzleD1Database<typeof schema> | null = null

export function getDatabase() {
  if (db) {
    return db
  }

  const { env } = getCloudflareContext()

  db = drizzle(env.DATABASE, { schema, logger: true })

  return db
}
