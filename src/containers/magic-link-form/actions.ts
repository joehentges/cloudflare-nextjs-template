"use server"

import { getCloudflareContext } from "@opennextjs/cloudflare"
import { createId } from "@paralleldrive/cuid2"
import { z } from "zod"

import { EMAIL_TTL } from "@/config"
import { rateLimitByKey } from "@/lib/limiter"
import { unauthenticatedAction } from "@/lib/safe-action"
import { sendMagicLinkEmail } from "@/lib/send-email"

import { magicLinkFormSchema } from "./validation"

export const sendMagicLinkAction = unauthenticatedAction
  .createServerAction()
  .input(magicLinkFormSchema)
  .handler(async ({ input }) => {
    await rateLimitByKey({
      key: `${input.email}-send-magic-link`,
      limit: 3,
      window: 10000
    })

    const magicLinkToken = createId()
    const expiresAt = new Date(Date.now() + EMAIL_TTL)

    // Save verification token in KV with expiration
    const { env } = getCloudflareContext()
    await env.NEXT_CACHE_WORKERS_KV.put(
      `magic-sign-in:${magicLinkToken}`,
      JSON.stringify({
        email: input.email,
        expiresAt: expiresAt.toISOString()
      }),
      {
        expirationTtl: Math.floor((expiresAt.getTime() - Date.now()) / 1000)
      }
    )

    await sendMagicLinkEmail(input.email, magicLinkToken)
  })
