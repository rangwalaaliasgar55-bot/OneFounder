---
name: Tailwind + Vite PostCSS config
description: How PostCSS/Tailwind must be wired in this monorepo to avoid config-not-found errors
---

## Rule
- `tailwind.config.js` lives at the **workspace root** (`/home/runner/workspace/tailwind.config.js`), not inside `client/`.
- Content paths inside it must reference `./client/src/**/*.{js,ts,jsx,tsx}` and `./client/index.html`.
- Do NOT use a `postcss.config.js` / `.mjs` / `.cjs` file — PostCSS config discovery from inside `client/` cannot reliably locate the root-level tailwind config.
- Instead, configure PostCSS **inline inside `client/vite.config.ts`** using `css.postcss.plugins`:
  ```ts
  const tailwindConfig = require('../tailwind.config.js')
  css: {
    postcss: {
      plugins: [tailwindcss(tailwindConfig), autoprefixer()],
    },
  }
  ```

**Why:** postcss-load-config searches for the postcss config starting from the CSS file's directory, then upward. When it finds `client/postcss.config.mjs`, the CWD used by Tailwind for its own config resolution is the workspace root (Vite's process CWD). Specifying a `config:` path relative to the postcss file failed silently (Tailwind got `undefined`). Inline Vite config with an explicit `require('../tailwind.config.js')` is unambiguous and deterministic.

**How to apply:** Any time Tailwind styles don't render, check that the content paths in `tailwind.config.js` match the actual file locations (`client/src/`) and that vite.config.ts has inline PostCSS. Never add a postcss.config.* file.
