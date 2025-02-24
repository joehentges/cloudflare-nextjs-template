import { updateAllSessionsOfUser } from "@/kv-session"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { eq } from "drizzle-orm"

import { CustomError } from "@/errors"
import { getDatabase } from "@/db"
import { userTable } from "@/db/schemas"
import { rateLimitByIp } from "@/lib/limiter"

export const dynamic = "force-dynamic"

export const GET = async (request: Request) => {
  try {
    await rateLimitByIp({ key: "verify-email", limit: 5, window: 60000 })

    const url = new URL(request.url)
    const token = url.searchParams.get("token")

    if (!token) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/sign-in"
        }
      })
    }

    const { env } = getCloudflareContext()
    const verifyEmailInfoStr = await env.NEXT_CACHE_WORKERS_KV.get(
      `email-verification:${token}`
    )

    if (!verifyEmailInfoStr) {
      throw new CustomError("Invalid token")
    }

    const verifyEmailInfo = JSON.parse(verifyEmailInfoStr) as {
      userId: string
      expiresAt: string
    }

    // Check if token is expired (although KV should have auto-deleted it)
    if (new Date() > new Date(verifyEmailInfo.expiresAt)) {
      throw new CustomError("Token has expired")
    }

    const database = getDatabase()

    const user = await database.query.userTable.findFirst({
      where: eq(userTable.id, verifyEmailInfo.userId)
    })

    if (!user) {
      throw new CustomError("User not found")
    }

    await database
      .update(userTable)
      .set({
        emailVerified: new Date()
      })
      .where(eq(userTable.id, verifyEmailInfo.userId))

    await updateAllSessionsOfUser(verifyEmailInfo.userId)

    await env.NEXT_CACHE_WORKERS_KV.delete(`email-verification:${token}`)

    return new Response(null, {
      status: 302,
      headers: {
        Location: "/verify-email-success"
      }
    })
    // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("api/auth/verify-email - error", error)
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/sign-in"
      }
    })
  }
}
