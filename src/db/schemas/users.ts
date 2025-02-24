import { createId } from "@paralleldrive/cuid2"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

const ROLES_ENUM = {
  ADMIN: "admin",
  USER: "user"
} as const

const roleTuple = Object.values(ROLES_ENUM) as [string, ...string[]]

export const userTable = sqliteTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId())
    .notNull(),
  createdAt: integer("created_at", {
    mode: "timestamp"
  })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", {
    mode: "timestamp"
  })
    .$onUpdateFn(() => new Date())
    .notNull(),
  firstName: text("first_name", {
    length: 255
  }),
  lastName: text("last_name", {
    length: 255
  }),
  email: text("email", {
    length: 255
  })
    .notNull()
    .unique(),
  passwordHash: text("password_hash"),
  role: text("role", {
    enum: roleTuple
  })
    .default(ROLES_ENUM.USER)
    .notNull(),
  emailVerified: integer("email_verified", {
    mode: "timestamp"
  }),
  signUpIpAddress: text("sign_up_ip_address", {
    length: 100
  }),
  googleAccountId: text("google_account_id", {
    length: 255
  }),
  /**
   * This can either be an absolute or relative path to an image
   */
  avatar: text("avatar")
})

export type User = typeof userTable.$inferSelect
