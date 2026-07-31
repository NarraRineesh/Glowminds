# Information Architecture — Phase 2

## Product metaphor

**GlowMinds Career Operating System** — workspaces, not an admin sidebar of forms.

## Primary navigation (proposed)

```mermaid
flowchart TB
  subgraph shell [CareerOS_Shell]
    Cmd[CommandPalette]
    Notif[Notifications]
    Credits[CreditsChip]
  end
  Dash[Dashboard_CommandCenter]
  subgraph career [Career_Hub]
    Resume[Resume_Studio]
    LinkedIn[LinkedIn_Hub]
    Portfolio[Portfolio_Builder]
    Vault[Document_Center]
    Profile[Career_Profile]
  end
  subgraph jobs [Job_Search]
    Explore[Job_Discovery]
    Apps[Application_CRM]
    Salary[Salary_Insights]
  end
  subgraph growth [Growth]
    Skills[Skills_Intelligence]
    Learn[Learning_Center]
    Interview[Interview_Simulator]
    Coach[Career_Copilot]
  end
  subgraph insights [Insights]
    Analytics[Career_Intelligence]
    Tools[Writing_Tools]
  end
  Settings[Settings]
  Dash --> career
  Dash --> jobs
  Dash --> growth
  Dash --> insights
```

### Nav structure

| Group | Label in UI | Items | Routes (unchanged) |
|-------|-------------|-------|--------------------|
| — | Dashboard | Command Center | `/dashboard` |
| Career Hub | Career | Resume Studio, LinkedIn Hub, Portfolio, Vault, Profile | `/dashboard/resume`, `/linkedin`, `/profile/public`, `/vault`, `/profile` |
| Job Search | Jobs | Discovery, Applications, Salary | `/jobs`, `/applications`, `/salary` |
| Growth | Grow | Skills, Learning, Interview, Copilot | `/skills`, `/learning`, `/interview`, `/ai` |
| Insights | Insights | Analytics; Writing Tools (Cover, Grammar, Paraphrase) | `/analytics`, `/cover-letters`, `/grammar-check`, `/paraphrase` |
| — | Settings | Account / Privacy / Preferences | `/dashboard/settings` |

**Changes vs today**

- Rename labels only in Phase 10 (URLs stay for bookmarks).
- Move **Profile** into Career Hub (today: avatar menu only).
- Promote **Analytics** out of collapsed Tools into **Insights**.
- Writing tools become secondary under Insights (or ⌘K).
- Default: Career + Jobs + Grow open; Insights collapsed.

## Shell chrome

1. **Left:** Workspace nav (icon + label; collapse to icons).
2. **Top:** Workspace title · breadcrumb · global search · ⌘K · notifications · credits · avatar.
3. **Main:** Workspace canvas (never bare).
4. **Mobile:** Bottom bar — Home | Jobs | Growth | More (sheet with Career + Insights + Settings). Notifications in top of More sheet.

## Command palette destinations

- Navigate to any workspace route  
- “Run ATS check”, “Start mock interview”, “Open Copilot with seed…”  
- “Go to application: {company}” (when data loaded)  
- Theme toggle, Settings  

## Dashboard deep-links

| Widget | Destination |
|--------|-------------|
| Resume Health | `/dashboard/resume?tab=ats` |
| LinkedIn Health | `/dashboard/linkedin` |
| Today’s Focus item | contextual route |
| Job recommendations | `/dashboard/jobs/:id` |
| Upcoming interviews | `/dashboard/applications` |
| Learning progress | `/dashboard/learning` |
| Weekly progress | `/dashboard/analytics` |
| Copilot chips | `/dashboard/ai` with seed |
| Career Timeline | `#timeline` on Dashboard or Insights |

## Public surfaces

| Surface | Route | Auth |
|---------|-------|------|
| Portfolio | `/u/:slug` | Public |
| Portfolio Builder | `/dashboard/profile/public` | Owner |
| Extension | Chrome MV3 popup | Desktop |

## Scalability rule

New features land under an existing workspace group first. Only add a top-level group when ≥3 related destinations exist.
