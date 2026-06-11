---
name: TypeScript config quirks
description: Non-obvious TS compiler settings and library-specific type fixes for this project
---

## ignoreDeprecations must be "5.0"
`tsconfig.json` uses `"ignoreDeprecations": "5.0"`. Using `"6.0"` causes a hard TS error (TypeScript 6.0 does not exist yet).

**Why:** TypeScript only accepts the current major version string as a valid value.

## server/replit_integrations is excluded from tsc
`tsconfig.json` has `"exclude": ["node_modules", "dist", "server/replit_integrations/**/*"]`.

**Why:** The `replit_integrations/` folder has its own schema references (`@shared/schema`) and data models that are incompatible with the main server schema. The folder is not imported by `server/index.ts`, so excluding it from compilation is safe and keeps the build clean.

**How to apply:** If you add new code under `server/replit_integrations/`, it won't be type-checked unless you remove it from the exclude list and fix the import paths.

## Better Auth: advanced.generateId removed
`server/auth.ts` must NOT use `advanced.generateId`. This property was removed from `BetterAuthAdvancedOptions` in the version currently installed.

**Why:** Better Auth updated their API; `generateId` is no longer a valid advanced option.

## p-retry: AbortError is a named export
Import as `import pRetry, { AbortError } from "p-retry"` — `pRetry.AbortError` does not exist on the default export (p-retry v7+).

## Express req.params type
`req.params.id` has type `string | string[]` in strict mode. Always cast: `parseInt(String(req.params.id))`.
