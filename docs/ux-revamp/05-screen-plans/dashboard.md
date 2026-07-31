# Career Command Center

## UX Goals
Answer “How is my career progressing today?” in one viewport. Drive one next action. Surface AI without leaving the OS shell.

## Information Hierarchy
1. Greeting + Today’s Focus (primary CTA)
2. Health row: Career / Resume / LinkedIn / Interview / Skills scores
3. Split: Action plan + Upcoming interviews | Copilot mini + Job matches
4. Progress strip → Analytics · Skill gap · Timeline/activity · Achievements

## User Flow
Land → read Focus → complete or dismiss → optional score drill-down → Copilot seed or job open.

## Component Layout
`ShellHeader` · `FocusHero` · `ScoreRow` · `ActionPlanList` · `InterviewList` · `AICard` · `JobMatchRail` · `GapStrip` · `Timeline` · `WeeklyProgress`

## Desktop
12-col: Focus full width; scores 5-up; left 7 (plan+interviews+timeline) / right 5 (AI+matches+progress).

## Tablet
Scores 3+2 wrap; AI below plan; matches horizontal scroll.

## Mobile
Focus → scores carousel → plan → AI → matches → timeline. Bottom nav Home active.
