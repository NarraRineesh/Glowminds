# Design System — Phase 3 (Career OS)

Preview gallery: `/design/system` (design-lab tokens only — does **not** mutate `src/app-theme.css` until Phase 10).

## Design intent

Premium AI Career OS: Linear density + Notion clarity + Stripe confidence.  
Dark-first; light supported. Blue primary retained for brand continuity; hierarchy and spacing rewritten.

## Typography

| Role | Spec |
|------|------|
| Display | Outfit 600/700, 28–36px, tight tracking |
| Title | Outfit 600, 20–24px |
| Body | Outfit/Inter 400, 14px, line 1.5 |
| Meta | 12–13px, muted |
| Mono | JetBrains Mono for scores, IDs, code |

## Color tokens (design-lab)

Semantic names mirror production for migration:

- `background` / `foreground` / `card` / `muted` / `border`
- `primary` / `destructive` / `success` / `warning` / `ai` (subtle accent for AI surfaces)
- `sidebar-*` for OS chrome

Dark: near-black canvas (`#07090f`), elevated cards (`#0f1623`), primary `#388bfd`.  
Light: `#f4f6f9` canvas, white cards, primary `#2563eb`.  
Avoid purple gradients and cream/serif tropes.

## Spacing & grid

- Base unit **4px**; common: 8, 12, 16, 24, 32  
- Page padding: 24 desktop / 16 mobile  
- Content max: **1280px** (tools), **1440px** (boards)  
- 12-col grid; workspace split often **7+5** or **8+4**

## Radius & elevation

- Radius: 6 / 8 / 12 (controls / cards / panels)  
- Elevation: border-first (1px border + subtle inset), soft shadow only on floating (dialogs, palette)

## Components (library)

| Component | Notes |
|-----------|-------|
| Button | Primary / Secondary / Ghost / Destructive / AI |
| Input, Select, Textarea | Shared height 36px |
| Card / WorkspacePanel | Header + optional actions + body |
| Tabs | Underline variant for workspaces |
| Table | Sparse; prefer boards/lists |
| Dialog / Sheet | Sheet on mobile |
| StatusBadge | applied / interview / offer / rejected |
| Progress / ScoreRing | Career scores |
| Timeline | Activity + career events |
| AI Card | Soft `ai` border, spark icon, primary action |
| EmptyState | Icon + title + one CTA |
| Skeleton | Match final layout blocks |
| Command Palette | Modal list, keyboard |
| SearchField | Global + in-workspace |
| NotificationItem | Title, time, deep-link |
| Chart chrome | Axis muted; series from CSS vars |

## Iconography

Reuse `AppIcon` set; 16/20 default; never emoji as UI.

## Motion

- 120–200ms ease for hover/focus  
- 200–280ms for panel enter  
- Respect `prefers-reduced-motion`  
- Dashboard widgets: stagger ≤ 40ms  

## Do / Don’t

**Do:** One primary action per viewport; AI as first-class CTA; dense but scannable.  
**Don’t:** Admin table dumps; huge empty white; purple glow; card-in-card nesting >1.
