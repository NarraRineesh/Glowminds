# Interaction, Motion, Responsive & Accessibility — Phase 8 companion

## Interaction specs

| Pattern | Spec |
|---------|------|
| Primary CTA | One per viewport; Enter activates focused primary |
| Command palette | ⌘K / Ctrl+K open; Esc close; ↑↓ select; Enter run |
| Global search | `/` focuses workspace search when not in input |
| Tabs | Arrow keys when `role="tablist"` |
| Boards | Desktop board; mobile list (Applications) |
| AI stream | `aria-live="polite"` on assistant region |
| Destructive | Confirm sheet; undo toast 5s where safe |
| Credits | Show cost on AI buttons before click |

## Animation specs

| Motion | Duration | Easing | Notes |
|--------|----------|--------|-------|
| Hover / focus ring | 120ms | ease-out | Opacity/border only |
| Panel / sheet enter | 220ms | ease | Transform Y 8→0 |
| Route (workspace) | 180ms | ease | Prefer opacity only if reduced-motion |
| Score ring fill | 400ms | ease-out | On mount once |
| Skeleton shimmer | 1.2s | linear | Infinite until data |
| Stagger widgets | 40ms step | — | Max 6 items |

Respect `prefers-reduced-motion: reduce` — disable stagger and route motion.

## Responsive strategy

| Breakpoint | Shell | Content |
|------------|-------|---------|
| ≥1200px | Sidebar 220 + topbar | Split rails 7/5 or 8/4 |
| 768–1199 | Collapsible sidebar | Stack secondary rail below |
| &lt;768 | Bottom nav 4 + More sheet | Single column; sticky primary CTA |

## Accessibility review (pre-implementation checklist)

- [ ] One `h1` per workspace  
- [ ] Focus visible on all controls (2px ring)  
- [ ] Icon-only buttons have `aria-label`  
- [ ] Color not sole status cue (badges include text)  
- [ ] Contrast AA for muted text on cards  
- [ ] Dialogs trap focus; Esc closes  
- [ ] Charts have text summary alternative  
- [ ] Forms associate labels  

## Design-lab query params

- `?theme=light` — light preview  
- `?state=empty|loading|default` — state variants  
