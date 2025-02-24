"use server"

import { redirect } from "next/navigation"
import argon2 from "argon2"
import { eq } from "drizzle-orm"

import { CustomError } from "@/errors"
import { afterSignInUrl } from "@/config"
import { getDatabase } from "@/db"
import { userTable } from "@/db/schemas"
import { rateLimitByKey } from "@/lib/limiter"
import { unauthenticatedAction } from "@/lib/safe-action"
import { setSession } from "@/lib/session"

import { signInFormSchema } from "./validation"

export const signInAction = unauthenticatedAction
  .createServerAction()
  .input(signInFormSchema)
  .handler(async ({ input }) => {
    await rateLimitByKey({
      key: `${input.email}-sign-in`,
      limit: 3,
      window: 10000
    })

    const database = getDatabase()
    const user = await database.query.userTable.findFirst({
      where: eq(userTable.email, input.email.toLowerCase())
    })

    if (!user) {
      throw new CustomError("Invalid email or password")
    }

    const hashedPassword = user.passwordHash

    if (!hashedPassword) {
      return false
    }

    const isPasswordCorrect = argon2.verify(hashedPassword, input.password)

    if (!isPasswordCorrect) {
      throw new CustomError("Invalid email or password")
    }

    await setSession(user.id)

    redirect(afterSignInUrl)
  })
