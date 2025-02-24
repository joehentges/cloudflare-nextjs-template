import { getCloudflareContext } from "@opennextjs/cloudflare"
import { eq } from "drizzle-orm"

import { CustomError } from "@/errors"
import { afterSignInUrl } from "@/config"
import { getDatabase } from "@/db"
import { userTable } from "@/db/schemas"
import { getIp } from "@/lib/get-ip"
import { rateLimitByIp } from "@/lib/limiter"
import { setSession } from "@/lib/session"

export const dynamic = "force-dynamic"

export async function GET(request: Request): Promise<Response> {
  try {
    await rateLimitByIp({ key: "magic-token", limit: 5, window: 60000 })
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
    const magicSignInInfoStr = await env.NEXT_CACHE_WORKERS_KV.get(
      `magic-sign-in:${token}`
    )

    if (!magicSignInInfoStr) {
      throw new CustomError("Invalid token")
    }

    const magicSignInInfo = JSON.parse(magicSignInInfoStr) as {
      email: string
      expiresAt: string
    }

    // Check if token is expired (although KV should have auto-deleted it)
    if (new Date() > new Date(magicSignInInfo.expiresAt)) {
      throw new CustomError("Token has expired")
    }

    const database = getDatabase()

    const existingUser = await database.query.userTable.findFirst({
      where: eq(userTable.email, magicSignInInfo.email)
    })

    if (existingUser) {
      const user = await database
        .update(userTable)
        .set({
          emailVerified: new Date()
        })
        .where(eq(userTable.id, existingUser.email))
      await setSession(user.id)
    } else {
      const [newUser] = await database
        .insert(userTable)
        .values({
          email: magicSignInInfo.email,
          emailVerified: new Date(),
          signUpIpAddress: await getIp()
        })
        .returning()
      await setSession(newUser.id)
    }

    await env.NEXT_CACHE_WORKERS_KV.delete(`magic-sign-in:${token}`)

    return new Response(null, {
      status: 302,
      headers: {
        Location: afterSignInUrl
      }
    })
    // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("api/auth/magic - error", error)
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/sign-in/magic/error"
      }
    })
  }
}
