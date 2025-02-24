"use server"

import { redirect } from "next/navigation"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { createId } from "@paralleldrive/cuid2"
import argon2 from "argon2"
import { eq } from "drizzle-orm"

import { env as appEnv } from "@/env"
import { CustomError } from "@/errors"
import { afterSignInUrl, EMAIL_TTL } from "@/config"
import { getDatabase } from "@/db"
import { userTable } from "@/db/schemas"
import { getIp } from "@/lib/get-ip"
import { rateLimitByKey } from "@/lib/limiter"
import { unauthenticatedAction } from "@/lib/safe-action"
import { sendVerifyEmail } from "@/lib/send-email"
import { setSession } from "@/lib/session"
import { validateTurnstileToken } from "@/lib/validate-turnstile-token"

import { signUpFormSchema } from "./validation"

export const signUpAction = unauthenticatedAction
  .createServerAction()
  .input(signUpFormSchema)
  .handler(async ({ input }) => {
    await rateLimitByKey({
      key: `${input.email}-sign-up`,
      limit: 3,
      window: 10000
    })

    if (
      Boolean(appEnv.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY) &&
      input.captchaToken
    ) {
      const success = await validateTurnstileToken(input.captchaToken)

      if (!success) {
        throw new CustomError("Please complete the captcha")
      }
    }

    const database = getDatabase()

    const [existingUser] = await database
      .select({ id: userTable.id })
      .from(userTable)
      .where(eq(userTable.email, input.email))

    if (existingUser) {
      throw new CustomError("Email is already in use")
    }

    const passwordHash = await argon2.hash(input.password)
    const [user] = await database
      .insert(userTable)
      .values({
        email: input.email,
        passwordHash,
        signUpIpAddress: await getIp()
      })
      .returning()

    const verificationToken = createId()
    const expiresAt = new Date(Date.now() + EMAIL_TTL)

    const { env } = getCloudflareContext()
    await env.NEXT_CACHE_WORKERS_KV.put(
      `email-verification:${verificationToken}`,
      JSON.stringify({
        userId: user.id,
        expiresAt: expiresAt.toISOString()
      }),
      {
        expirationTtl: Math.floor((expiresAt.getTime() - Date.now()) / 1000)
      }
    )

    await sendVerifyEmail(user.email, verificationToken)

    await setSession(user.id, "password")

    redirect(afterSignInUrl)
  })
