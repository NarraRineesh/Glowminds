# Glowminds design contract

This file is the visual authority for the app (`app.glowminds.in`) and the public site (`glowminds.in`). They share one system. Do not replace it with a Uizze Pack, a clay palette, or a gray rebrand.

## Authority

- **Preserve** the brand colors already in `src/app-theme.css`.
- **Expand** layout, spacing, and component craft inside that palette.
- Product behavior, routes, plan limits, credit costs, prompts, Firebase, and data contracts stay as they are.

## Color

Dark is the primary setting. Light uses the same roles.

| Role | Dark | Light |
| --- | --- | --- |
| Canvas | `#06080d` | `#f3f5f8` |
| Card / sidebar | `#0c121c` | `#ffffff` |
| Elevated | `#121a27` | `#f1f5f9` |
| Text | `#e8eef5` | `#0f172a` |
| Muted text | `#a8b4c7` | `#475569` |
| Primary | `#2563eb` | `#2563eb` |
| AI | `#22d3ee` | `#0891b2` |
| Success | `#34d399` | `#059669` |
| Warning | `#fbbf24` | `#d97706` |
| Danger | `#f87171` | `#dc2626` |

Primary is a flat fill on buttons and the active state. It is not a gradient, a glow, or a mesh.

## Type

- UI: Outfit, then Inter, then system-ui.
- Scores, credits, and IDs: JetBrains Mono, tabular numbers.
- Body 14px. Mobile fields are at least 16px so iOS does not zoom the page. Never set `maximum-scale` or `user-scalable=no`.

## Surfaces

Cards match the resume-picker option cards:

- Fill: the card color above.
- Border: 1px, `var(--border)`.
- Radius: 14px (`--radius-panel`).
- Shadow: none. Dialogs may use a light scrim. They do not use glass, blur, or a heavy drop shadow.

Hover darkens the border (`foreground` at low opacity). It does not lift the card.

## Chrome

- Mobile drawers and page gutters: 20px.
- Nav rows, drawer rows, and the resume builder’s Edit / Preview / Design tabs: 44px minimum.
- Respect `env(safe-area-inset-*)` on the header, drawers, and bottom tabs.
- Desktop sidebar can be denser (36px rows). Mobile does not.

## Icons and decoration

Phosphor icons through `AppIcon`, one weight. No emoji as icons, no sparkle marks, no purple-to-blue headline gradients, no glassmorphism, no dot grids, no blurred color orbs.

## States

- Loading: spinner plus a short label. Do not invent progress.
- Empty: one icon, one sentence, one action.
- Error: what failed and how to retry.
- Success: toast or inline confirmation already used by that flow.

## Resume builder, phones

- Bottom tabs: Edit, Preview, Design. One panel at a time.
- Preview pages stack vertically and scale to the screen width.
- Reorder handles are at least 44px on the touch axis.
