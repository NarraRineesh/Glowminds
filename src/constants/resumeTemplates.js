export const SECTION_TYPES = Object.freeze({
  PARAGRAPH: 'paragraph',
  INLINE: 'inline',
  LIST: 'list',
  EXPERIENCE: 'experience',
  EDUCATION: 'education',
  ACHIEVEMENTS: 'achievements',
})

export const LAYOUTS = Object.freeze({
  SINGLE: 'single',
  TWO_COLUMN: 'two-column',
})

export const DEFAULT_DESIGN = Object.freeze({
  template: 'onyx',
  accent: '#1f2330',
  fontFamily: 'Source Serif 4',
  fontSize: 'medium',
  lineHeight: 1,
  margins: 1,
  spacing: 1,
  background: 'plain',
  pageBackground: '#ffffff',
  sidebarBackground: '',
  sidebarText: '',
  docSize: 'A4',
})

export const EMPTY_CONTENT = Object.freeze({
  header: { name: '', headline: '', contact: '' },
  sections: [],
  main: [],
  sidebar: [],
})

export const RESUME_TEMPLATES = [
  { id: 'onyx', name: 'Onyx', desc: 'Single-column ATS-friendly grid. Best default for most roles.' },
  { id: 'kakuna', name: 'Kakuna', desc: 'Compact single-column — internships and entry-level.' },
  { id: 'ditto', name: 'Ditto', desc: 'Text-dense two-column for traditional / ATS-heavy applications.' },
  { id: 'lapras', name: 'Lapras', desc: 'Polished single-column for senior and enterprise roles.' },
  { id: 'rhyhorn', name: 'Rhyhorn', desc: 'Minimal whitespace — designers and content roles.' },
  { id: 'scizor', name: 'Scizor', desc: 'Uppercase headings — consulting, startup, executive.' },
  { id: 'azurill', name: 'Azurill', desc: 'Two-column with a bold sidebar and skill bars — creative and tech.' },
  { id: 'bronzor', name: 'Bronzor', desc: 'Clean two-column — corporate, finance, consulting.' },
  { id: 'chikorita', name: 'Chikorita', desc: 'Soft header accent and photo — marketing, HR, client-facing.' },
  { id: 'ditgar', name: 'Ditgar', desc: 'Dark teal sidebar and skills grid — developers and technical PMs.' },
  { id: 'gengar', name: 'Gengar', desc: 'Accent colors and clean type — analysts and operations.' },
  { id: 'glalie', name: 'Glalie', desc: 'Light sidebar, understated — legal, finance, executive.' },
  { id: 'leafish', name: 'Leafish', desc: 'Muted sidebar — healthcare, nonprofit, sustainability.' },
  { id: 'meowth', name: 'Meowth', desc: 'Compact single-column with inline dates — dense ATS layouts.' },
  { id: 'pikachu', name: 'Pikachu', desc: 'Simple two-column with a left accent — junior and editorial.' },
]

export function templatePreviewSrc(id) {
  return `/templates/jpg/${id}.jpg`
}

export function getTemplateById(id) {
  return RESUME_TEMPLATES.find((t) => t.id === id)
    || RESUME_TEMPLATES.find((t) => t.id === 'onyx')
    || RESUME_TEMPLATES[0]
}

export function cloneTemplate(template) {
  return JSON.parse(JSON.stringify(template))
}
