/** @type {import('prettier').Config} */
const prettierConfig = {
  endOfLine: "lf",
  semi: false,
  singleQuote: false,
  tabWidth: 2,
  trailingComma: "es5",
  arrowParens: "always",
  bracketSpacing: true,
  plugins: [
    "@ianvs/prettier-plugin-sort-imports",
    "prettier-plugin-tailwindcss",
  ],
  importOrder: [
    "^(react/(.*)$)|^(react$)",
    "^(electron|fs|path|os|url|crypto|stream|util|child_process)(/.*)?$",
    "<BUILTIN_MODULES>",
    "<THIRD_PARTY_MODULES>",
    "",
    "^@/types$",
    "^@/types/(.*)$",
    "^@/config/(.*)$",
    "^@/lib/(.*)$",
    "^@/hooks/(.*)$",
    "^@/components/ui/(.*)$",
    "^@/components/(.*)$",
    "^@/app/(.*)$",
    "^@/context/(.*)$",
    "^@/utils/(.*)$",
    "^@/data/(.*)$",
    "",
    "^[./]",
    ".css$",
  ],
  importOrderParserPlugins: ["typescript", "jsx", "decorators-legacy"],
}

module.exports = prettierConfig
