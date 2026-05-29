# Resume Builder

Local-only resume builder. Resumes save to browser `localStorage` — no server, auth, or database required.

## Run

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000/local

Use another port if 3000 is busy:

```bash
PORT=3005 pnpm dev
```

## Commands

| Task       | Command          |
| ---------- | ---------------- |
| Dev server | `pnpm dev`       |
| Build      | `pnpm build`     |
| Preview    | `pnpm preview`   |
| Typecheck  | `pnpm typecheck` |

## Structure

```
src/
  routes/          /local resume list, /builder/:id editor
  features/        Builder, preview, export
  lib/
    schema/        Resume data model (Zod)
    pdf/           PDF templates & rendering
    docx/          Word export
    ui/            Shared UI components
    fonts/         Font list
    utils/         Helpers
public/templates/  Template preview images
locales/           en-US translations
```

## Backup

Export JSON from the builder sidebar (Export → JSON). Data lives in `localStorage` under keys prefixed with `rr:local-resume:`.
