# Domain split
## Cloudflare
CNAME name=app target=glowminds.in

## Firebase Hosting
Create site glowminds-app. Target www -> glowminds-abc84. Target app -> glowminds-app. Custom domain app.glowminds.in on the app site only. /api rewrite on both sites.

## Sign-in hosts
Add app.glowminds.in in the Firebase Auth domain list and the Google Cloud web client origins.

## Local
localhost stays one origin. No production redirects.
