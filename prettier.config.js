/** @type {import('prettier').Config} */
module.exports = {
  printWidth: 80,
  endOfLine: "lf",
  semi: false,
  singleQuote: false,
  tabWidth: 2,
  trailingComma: "none",
  importOrder: [
    "^(react/(.*)$)|^(react$)",
    "^(next/(.*)$)|^(next$)",
    "<THIRD_PARTY_MODULES>",
    "",
    "^types$",
    "^@/types$",
    "^@/env(.*)$",
    "^@/types/(.*)$",
    "^@/errors",
    "^@/config",
    "^@/config/(.*)$",
    "^@/providers",
    "^@/db",
    "^@/db/(.*)$",
    "^@/data-access/(.*)$",
    "^@/auth",
    "^@/client/(.*)$",
    "^@/lib/(.*)$",
    "^@/use-cases/(.*)$",
    "^@/containers/(.*)$",
    "^@/components/ui/(.*)$",
    "^@/components/(.*)$",
    "^@/hooks/(.*)$",
    "^@/emails/(.*)$",
    "^@/styles/(.*)$",
    "^@/app/(.*)$",
    "",
    "^[./]"
  ],
  importOrderParserPlugins: ["typescript", "jsx", "decorators-legacy"],
  plugins: [
    "@ianvs/prettier-plugin-sort-imports",
    "prettier-plugin-tailwindcss"
  ]
}
