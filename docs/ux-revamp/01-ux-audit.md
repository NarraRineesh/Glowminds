# GlowMinds UX Audit — Phase 1

**Scope:** Authenticated product, public `/u/:slug`, Chrome LinkedIn assist.  
**Out of scope:** Marketing site, `/admin`.  
**Method:** Code-based review of section JSX, shell, nav, and extension (branch `_v2`).  
**Date:** 2026-07-17

---

## Cross-cutting findings

| Theme | Finding |
|-------|---------|
| Shell | No sticky page chrome (title, credits, breadcrumbs). Notifications buried in avatar submenu. Resume full-bleed vs padded routes feels inconsistent. |
| IA | Profile not in sidebar; Public Profile vs Profile confusing. Tools group default-closed hides Analytics. Naming drift: Learning vs Upskilling, Sync vs Optimizer. |
| Density | Overview and Jobs overload first viewport; long forms (Profile, Settings) lack guided workflows. |
| States | Uneven loading/empty/error; Analytics may show zeros without `loadApps()`; Overview swallows fetch errors. |
| AI-first | AI actions often secondary or credit-opaque until click. |
| A11y | Mixed heading levels; some tabs without `role="tablist"`; icon-only deletes; charts not keyboard-friendly. |
| Mobile | Kanban Applications collapse poorly; filter panels dominate Jobs; chat height calc fragile. |
| Friction | Overview search `?q=` not consumed by Jobs; Templates tab stub; extension UX is developer-facing. |

### Highest-impact opportunities (product later)

1. Career OS shell: title bar + credits + notifications + command palette  
2. Workspace IA (Career Hub / Job Search / Growth / Insights)  
3. Fix Jobs URL query + Analytics hydration  
4. Guided LinkedIn + Resume Studio flows  
5. Unify empty/loading/error + Pro upgrade patterns  

---

## Shell & global

### Dashboard shell + layout

- **Purpose:** Sidebar + main outlet; resume routes full-bleed.
- **UX problems:** No persistent top bar; mobile trigger + `pt-10` eats space; no global “next action.”
- **Visual problems:** Route-enter motion on every hop; resume vs padded rhythm jarring.
- **Nav/hierarchy:** Notifications only in profile menu; Profile not in sidebar groups.
- **A11y/mobile:** Weak landmarks/`h1` consistency; trigger lacks page context.
- **Empty/loading/error:** Per-section only; no shell error boundary UX.
- **Missing / friction:** Credits not visible in chrome.
- **Opportunities:** Sticky workspace header; mount NotificationsBell; command palette (⌘K).

### Toasts

- **Purpose:** Sonner via Zustand `addToast`.
- **UX problems:** Many screens use inline `msg` instead of toasts.
- **Opportunities:** Standardize; action toasts for destructive ops.

### Notifications

- **Purpose:** Firestore list in profile submenu; standalone bell unused by shell.
- **UX problems:** Two clicks deep; items don’t deep-link; no loading skeleton.
- **Opportunities:** Shell bell + route deep-links; unify with Overview activity.

### Chrome extension (`extensions/linkedin-assist`)

- **Purpose:** Copy LinkedIn profile JSON to clipboard.
- **UX problems:** Unbranded; repo-path instructions in app; no open-app deep link.
- **Opportunities:** Branded popup, field checklist, one-click handshake.

---

## Per-screen audits

### Dashboard (Overview)

- **Purpose:** Career hub — scores, action plan, matches, gaps, activity, coach chips.
- **UX problems:** 10+ cards, no single primary CTA; search doesn’t wire to Jobs `q`.
- **Visual problems:** Tiny type in tiles; score grid jumps 2→5 cols.
- **Nav/hierarchy:** Mirrors many sidebar destinations without hierarchy.
- **A11y/mobile:** Long scroll; MetricCards may lack button semantics.
- **Empty/loading/error:** Decent empties; silent fetch failures; skill gap can stick on loading copy.
- **Missing / friction:** Interview items don’t open applications.
- **Opportunities:** Hero “Start here” from action plan #1; collapse secondary rows.

### Resume Studio (Hub)

- **Purpose:** Tabs — Builder | ATS | My Resumes | Templates.
- **UX problems:** Templates stub; ATS always uses `resumes[0]`; Pro gate is error text.
- **Visual problems:** Tab wrap; builder hides hub chrome.
- **Nav/hierarchy:** Deep `/resume/:id` skips hub.
- **Empty/loading/error:** List empty OK; no list loading skeleton.
- **Opportunities:** Resume picker for ATS; real templates or remove tab; upgrade CTA.

### Resume Builder (embed)

- **Purpose:** `glowminds-resume` embed with cloud save.
- **UX problems:** Disconnected from hub; upgrade → Settings not billing.
- **Opportunities:** Mini-bar: Back | ATS | Saved.

### ATS Report (hub tab)

- **Purpose:** Gauge + scorecard + AI suggestions via resume-review.
- **UX problems:** Unclear which resume; no PDF upload (MVP JSON only — OK if labeled).
- **Opportunities:** Side-by-side suggestions → builder deep-links.

### LinkedIn Hub / Audit

- **Purpose:** Extension import, paste, AI audit, checklist, rewrites.
- **UX problems:** “Sync” naming vs paste; checklist score vs AI score; developer install copy.
- **Visual problems:** Mix of v2/legacy cards.
- **Opportunities:** 3-step wizard; branded extension card.

### Public Portfolio (manage)

- **Purpose:** Slug, visibility, publish, copy link.
- **UX problems:** Save/publish conflated; no section preview; slugify-on-keystroke friction.
- **Opportunities:** Live preview pane; publish checklist from Profile.

### Public Portfolio (`/u/:slug`)

- **Purpose:** Public career page.
- **UX problems:** No resume download despite download stats; duplicate skills; non-shareable tabs.
- **Opportunities:** Download CTA; owner “Edit” banner; stronger hero.

### Career Vault

- **Purpose:** Categorized docs + quota + ATS link for resumes.
- **UX problems:** Native `confirm` delete; category chips truncated; no drag-drop.
- **Opportunities:** Drag-drop; upgrade on quota; vault ↔ resume import.

### Job Discovery

- **Purpose:** Browse / Recommended / Saved + filters + match scores.
- **UX problems:** Filter-heavy; Recommended silent `minMatch: 70`; ignores `?q=`.
- **Empty/loading/error:** Strong patterns (skeleton, retry, Pro inline).
- **Opportunities:** Collapsible filters; URL sync; save-search.

### Job Details

- **Purpose:** Match, Apply Kit, track, cover letter, description.
- **UX problems:** Credit cost opaque; `navigate(-1)` unreliable; sticky apply missing.
- **Opportunities:** Sticky apply bar; post-apply → Applications.

### Application CRM

- **Purpose:** Kanban by status + manual add.
- **UX problems:** No DnD; mobile loses board; no job deep-link; no interview date.
- **Opportunities:** List/board toggle; calendar chip; link to job.

### Salary Insights

- **Purpose:** Comp ranges + negotiate script (Pro).
- **UX problems:** Locked content discoverability; weak link back to Profile CTC.
- **Opportunities:** “Update expected CTC” inline.

### Skills Intelligence

- **Purpose:** My Skills / Gap / Demand.
- **UX problems:** Defaults to Gap; My Skills read-only; silent gap errors; “proficiency” not real.
- **Opportunities:** Edit skills in place; timestamp; errors toast.

### Learning Center

- **Purpose:** Paths, gap, weekly plan (Upskilling under Learning header).
- **UX problems:** Double title Learning/Upskilling; credit cost easy to miss.
- **Opportunities:** Unify naming; first-path onboarding.

### Interview Simulator

- **Purpose:** MCQ mock sessions + history.
- **UX problems:** Expectation mismatch (prep vs conversational); large Q nav on mobile.
- **Opportunities:** Clarify mode; retake; link weak topics → Learning.

### Career Copilot (AI)

- **Purpose:** Streaming career chat + history.
- **UX problems:** Mobile height; credit cost not in header; clear chat without confirm.
- **Opportunities:** Context banner; cost on send; export.

### Career Intelligence (Analytics)

- **Purpose:** KPIs, charts, CSV export.
- **UX problems:** May not load apps on mount; buried in Tools; “Export Report” is apps CSV; no career scores.
- **A11y:** Charts weak for keyboard.
- **Opportunities:** Hydrate data; move to Insights; legends.

### Cover Letter Generator

- **Purpose:** Templates + AI generate + drafts.
- **UX problems:** Dual entry with Job Detail; drafts not linked to Applications.
- **Opportunities:** Import job; attach to tracker.

### Grammar Checker / Paraphrasing

- **Purpose:** Paste → AI results in tool sidebar layout.
- **UX problems:** Duplicate suggestion lists (grammar); results below fold on mobile.
- **Opportunities:** Apply all; pipe to Cover Letter.

### Settings

- **Purpose:** Account, billing, usage, appearance, notifications, privacy.
- **UX problems:** Overlap with Profile; long multi-panel.
- **Opportunities:** Consolidate Account ↔ Profile; credit hero in Usage.

### Profile (editor)

- **Purpose:** Full career data + completion + AI review.
- **UX problems:** Very long page; not in sidebar; quick links desktop-only.
- **Empty states:** Strong `ProfileEmptyState` pattern — reuse OS-wide.
- **Opportunities:** Career Hub item; mobile jump menu; public publish checklist.

### Notifications (surface)

- Covered under shell; needs first-class workspace treatment in redesign.

### Command Palette

- **Status:** Not implemented in main app (Command primitive exists in resume UI package only).
- **Opportunity:** Global ⌘K for navigation + AI actions (UX chrome, not domain feature).

### Career Timeline

- **Status:** Partial — Overview activity + interview history; no dedicated timeline workspace.
- **Opportunity:** Unified chronology widget on Dashboard + Insights.

---

## Audit summary scorecard

| Area | Severity |
|------|----------|
| Information architecture | High |
| Dashboard hierarchy | High |
| Cross-route data/query bugs | High |
| Empty/loading consistency | Medium |
| Accessibility | Medium |
| Mobile Applications/Jobs | High |
| AI cost transparency | Medium |
| Extension polish | Medium |
| Visual consistency (v2 vs legacy tools) | Medium |

**Verdict:** Product is feature-complete but reads as a dense admin dashboard of cards/forms. Redesign should prioritize shell + workspace IA + guided flows over new capabilities.
