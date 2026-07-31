# Implementation Roadmap — Phase 10

**Phase 9 mocks approved.** Product incorporation in progress on `_v2`.

## Order

1. **Design system** — migrate `design-lab/tokens.css` → [`src/app-theme.css`](../../src/app-theme.css); shared primitives (`Sparkline`, `ScoreSparkCard`, `StreakCard`, `WorkspaceHeader`).
2. **Navigation + shell** — IA labels in [`sidebarNav.js`](../../src/constants/sidebarNav.js); topbar (title, search, bell, avatar); mobile dock.
3. **Gamification data** — `users/{uid}.gamification` + score history snapshots.
4. **Dashboard** — Command Center layout in Overview (real data).
5. **Jobs** — Discovery + detail apply kit.
6. **Applications** — CRM board/list polish.
7. **LinkedIn Hub** — Import → Audit → Rewrite chrome (extension path unchanged).
8. **Portfolio + Public** — builder preview + public hero.
9. **Vault** — Document Center density.
10. **Skills / Learning** — layout unify.
11. **Interview + Copilot** — chrome polish.
12. **Analytics + Writing** — Insights; Rewrite dual-pane.
13. **Settings** — Gamification panel (same doc as Dashboard).
14. **Notifications + Timeline** — inbox filters; `/dashboard/timeline`.

## Exclusions

- Resume Studio / Builder / Library stay **v1** (`packages/glowminds-resume` untouched).
- No Command Palette product build.
- No Chrome Extension popup redesign.

## Rules

- One module per PR / batch.
- Keep stores/APIs; replace layouts only.
- Never ship Design Lab hardcoded numbers — empty states when missing.
- Dark + light regression each module.
- Keep `/design` DEV-only as visual reference.

## Success criteria

5-second test passes on each workspace; empty/loading/error standardized; Dashboard + Settings gamification share one data source.
