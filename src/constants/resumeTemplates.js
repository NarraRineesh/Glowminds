export const RESUME_TEMPLATES = [
  { id: 'onyx', name: 'Onyx', desc: 'Single-column ATS-friendly grid. Best default for most roles.' },
  { id: 'kakuna', name: 'Kakuna', desc: 'Compact single-column — internships and entry-level.' },
  { id: 'ditto', name: 'Ditto', desc: 'Text-dense two-column for traditional / ATS-heavy applications.' },
  { id: 'lapras', name: 'Lapras', desc: 'Polished single-column for senior and enterprise roles.' },
  { id: 'rhyhorn', name: 'Rhyhorn', desc: 'Minimal whitespace — designers and content roles.' },
  { id: 'scizor', name: 'Scizor', desc: 'Uppercase headings — consulting, startup, executive.' },
]

export function templatePreviewSrc(id) {
  return `/templates/jpg/${id}.jpg`
}
