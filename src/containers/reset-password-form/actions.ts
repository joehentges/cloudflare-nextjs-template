"use server"

import { redirect } from "next/navigation"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import argon2 from "argon2"
import { eq } from "drizzle-orm"
import { z } from "zod"

import { CustomError } from "@/errors"
import { signInUrl } from "@/config"
import { getDatabase } from "@/db"
import { userTable } from "@/db/schemas"
import { rateLimitByKey } from "@/lib/limiter"
import { unauthenticatedAction } from "@/lib/safe-action"

export const resetPasswordAction = unauthenticatedAction
  .createServerAction()
  .input(
    z.object({
      token: z.string().min(1),
      password: z.string().min(8)
    })
  )
  .handler(async ({ input }) => {
    await rateLimitByKey({
      key: `${input.token}-reset-password`,
      limit: 3,
      window: 10000
    })

    const { env } = getCloudflareContext()

    const passwordResetInfoStr = await env.NEXT_CACHE_WORKERS_KV.get(
      `password-reset:${input.token}`
    )

    if (!passwordResetInfoStr) {
      throw new CustomError("Invalid token")
    }

    const passwordResetInfo = JSON.parse(passwordResetInfoStr) as {
      userId: string
      expiresAt: string
    }

    if (new Date() > new Date(passwordResetInfo.expiresAt)) {
      throw new CustomError("Token has expired")
    }

    const database = getDatabase()

    const user = await database.query.userTable.findFirst({
      where: eq(userTable.id, passwordResetInfo.userId)
    })

    if (!user) {
      throw new CustomError("User not found")
    }

    const passwordHash = await argon2.hash(input.password)

    await database
      .update(userTable)
      .set({
        passwordHash
      })
      .where(eq(userTable.id, user.id))

    await env.NEXT_CACHE_WORKERS_KV.delete(`password-reset:${input.token}`)

    redirect(signInUrl)
  })
