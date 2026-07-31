# UX Principles & Module Identity — Phases 4–5

## Phase 4 — Principles

Every page must answer in **5 seconds**:

1. **Where am I?** — Workspace title + nav highlight + breadcrumb.  
2. **What can I do?** — Primary action visible above the fold.  
3. **What should I do next?** — Suggested next step (AI or rule-based).

### Rules

| Rule | Meaning |
|------|---------|
| Workspace > form | Split canvas: content + insight/AI rail |
| Never empty | EmptyState with one CTA + contextual tip |
| AI-primary | Where AI exists, make it the default path |
| Guided over long | Wizards / steps for LinkedIn, first resume, first apply |
| Reduce load | ≤1 primary + 2 secondary actions per section |
| Keyboard | ⌘K, `/` focus search, Esc closes |
| Accessible | Focus rings, labels, contrast AA, live regions for AI stream |
| Responsive | Desktop workspace → tablet stacked rails → mobile single column + bottom nav |

### State standards

- **Loading:** Skeleton matching layout (not only spinners).  
- **Error:** Inline banner + retry; toast for transient.  
- **Empty:** Illustration optional; always one CTA.  
- **Success:** Toast + optional undo for deletes.

---

## Phase 5 — Workspace identity

| Module (today) | Workspace name | Identity |
|----------------|----------------|----------|
| Overview | Career Command Center | Daily pulse + next action |
| Resume hub/builder/ATS | Resume Studio | Craft, score, ship resumes |
| LinkedIn | LinkedIn Optimization Center | Sync → audit → rewrite |
| Public profile | Portfolio Builder / Public Portfolio | Publish professional presence |
| Vault | Document Center | Secure career files |
| Jobs / detail | Job Discovery Workspace | Find & evaluate roles |
| Applications | Application CRM | Pipeline & next steps |
| Salary | Salary Insights | Comp confidence |
| Skills | Skills Intelligence | Gap & market demand |
| Learning | Learning Center | Paths & streak |
| Interview | Interview Simulator | Practice & score |
| AI Coach | Career Copilot | Always-on advisor |
| Analytics | Career Intelligence | Trends & export |
| Cover / Grammar / Paraphrase | Writing Tools | Polish communications |
| Settings | Settings | Account & privacy |
| Notifications | Notification Center | Actionable alerts |
| Extension | LinkedIn Assist | Capture → import |
| Timeline | Career Timeline | Chronology of progress |

Same design system; each workspace uses a distinct **eyebrow** + empty-state copy tone.
