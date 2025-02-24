"use server"

import { getCloudflareContext } from "@opennextjs/cloudflare"
import { createId } from "@paralleldrive/cuid2"
import { eq } from "drizzle-orm"
import { z } from "zod"

import { CustomError } from "@/errors"
import { EMAIL_TTL } from "@/config"
import { getDatabase } from "@/db"
import { userTable } from "@/db/schemas"
import { rateLimitByKey } from "@/lib/limiter"
import { unauthenticatedAction } from "@/lib/safe-action"
import { sendResetPasswordEmail } from "@/lib/send-email"

import { forgotPasswordFormSchema } from "./validation"

export const sendForgotPasswordAction = unauthenticatedAction
  .createServerAction()
  .input(forgotPasswordFormSchema)
  .handler(async ({ input }) => {
    await rateLimitByKey({
      key: `${input.email}-send-forgot-password`,
      limit: 3,
      window: 10000
    })

    const database = getDatabase()

    const user = await database.query.userTable.findFirst({
      where: eq(userTable.email, input.email)
    })

    if (!user) {
      throw new CustomError("Email address not found")
    }

    const verificationToken = createId()
    const expiresAt = new Date(Date.now() + EMAIL_TTL)

    // Save verification token in KV with expiration
    const { env } = getCloudflareContext()
    await env.NEXT_CACHE_WORKERS_KV.put(
      `password-reset:${verificationToken}`,
      JSON.stringify({
        userId: user.id,
        expiresAt: expiresAt.toISOString()
      }),
      {
        expirationTtl: Math.floor((expiresAt.getTime() - Date.now()) / 1000)
      }
    )

    await sendResetPasswordEmail(input.email, verificationToken)
  })
