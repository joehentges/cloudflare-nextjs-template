import { cookies as nextCookies } from "next/headers"
import { sha256 } from "@oslojs/crypto/sha2"
import {
  encodeBase32LowerCaseNoPadding,
  encodeHexLowerCase
} from "@oslojs/encoding"
import { eq } from "drizzle-orm"

import { getDatabase } from "@/db"
import { User, userTable } from "@/db/schemas"

import { getKV } from "./client/kv"
import {
  createKVSession,
  CreateKVSessionParams,
  deleteKVSession,
  getSessionKey,
  KVSession,
  updateKVSession
} from "./kv-session"

export function getUserFromDatabase(userId: User["id"]) {
  const database = getDatabase()
  return database.query.userTable.findFirst({
    where: eq(userTable.id, userId),
    columns: {
      id: true,
      createdAt: true,
      updatedAt: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      emailVerified: true,
      avatar: true
    }
  })
}

export async function createSession(
  token: string,
  userId: User["id"],
  authenticationType?: CreateKVSessionParams["authenticationType"],
  passkeyCredentialId?: CreateKVSessionParams["passkeyCredentialId"]
): Promise<KVSession> {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)))

  const user = await getUserFromDatabase(userId)

  if (!user) {
    throw new Error("User not found")
  }

  return createKVSession({
    sessionId,
    userId,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    user,
    authenticationType,
    passkeyCredentialId
  })
}

async function validateSessionToken(
  token: string,
  userId: User["id"]
): Promise<SessionValidationResult | null> {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)))
  const kv = await getKV()

  const sessionStr = await kv.get(getSessionKey(userId, sessionId))
  if (!sessionStr) {
    return null
  }

  const session = JSON.parse(sessionStr) as KVSession

  if (Date.now() >= session.expiresAt) {
    await deleteKVSession(sessionId, userId)
    return null
  }

  if (Date.now() >= session.expiresAt - 1000 * 60 * 60 * 24 * 15) {
    await updateKVSession(
      sessionId,
      userId,
      new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
    )
  }

  return session
}

export async function invalidateSession(
  sessionId: string,
  userId: User["id"]
): Promise<void> {
  await deleteKVSession(sessionId, userId)
}

function encodeSessionCookie(userId: string, token: string): string {
  return `${userId}:${token}`
}

export async function setSessionTokenCookie(
  token: string,
  userId: User["id"],
  expiresAt: Date
): Promise<void> {
  const cookies = await nextCookies()
  cookies.set("session", encodeSessionCookie(userId, token), {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/"
  })
}

export async function deleteSessionTokenCookie(): Promise<void> {
  const cookies = await nextCookies()
  cookies.delete("session")
}

export function generateSessionToken(): string {
  const bytes = new Uint8Array(20)
  crypto.getRandomValues(bytes)
  const token = encodeBase32LowerCaseNoPadding(bytes)
  return token
}

function decodeSessionCookie(
  cookie: string
): { userId: string; token: string } | null {
  const parts = cookie.split(":")
  if (parts.length !== 2) return null
  return { userId: parts[0], token: parts[1] }
}

export async function validateRequest(): Promise<SessionValidationResult | null> {
  const cookies = await nextCookies()
  const sessionCookie = cookies.get("session")?.value ?? null
  if (!sessionCookie) {
    return null
  }

  const decoded = decodeSessionCookie(sessionCookie)

  if (!decoded || !decoded.token || !decoded.userId) {
    return null
  }

  const result = await validateSessionToken(decoded.token, decoded.userId)

  return result
}

export type SessionValidationResult = KVSession | null
