/** Known ATS brand segments → display names (first pipe segment / bare slug). */
const KNOWN_COMPANY_NAMES = {
  pwc: 'PwC',
  hpe: 'HPE',
  jll: 'JLL',
  ppg: 'PPG',
  ibm: 'IBM',
  aws: 'AWS',
  sap: 'SAP',
  hp: 'HP',
  ge: 'GE',
  bnp: 'BNP',
  ubs: 'UBS',
  ey: 'EY',
  kpmg: 'KPMG',
  nvidia: 'NVIDIA',
  bdx: 'BD',
  wf: 'Wells Fargo',
  livenation: 'Live Nation',
  salesforce: 'Salesforce',
  thermofisher: 'Thermo Fisher',
  purestorage: 'Pure Storage',
  trinityhealth: 'Trinity Health',
  theapexgroup: 'The Apex Group',
  ivytech: 'Ivy Tech',
  uottawa: 'uOttawa',
  allstate: 'Allstate',
  thales: 'Thales',
  sentara: 'Sentara',
  taskus: 'TaskUs',
  lilly: 'Lilly',
  hitachi: 'Hitachi',
  philips: 'Philips',
  medtronic: 'Medtronic',
  kyndryl: 'Kyndryl',
  meijer: 'Meijer',
  microsoft: 'Microsoft',
  google: 'Google',
  amazon: 'Amazon',
  meta: 'Meta',
  apple: 'Apple',
  oracle: 'Oracle',
  adobe: 'Adobe',
  cisco: 'Cisco',
  intel: 'Intel',
  netflix: 'Netflix',
}

const ACRONYM_RE = /^[a-z]{2,4}$/

/**
 * Turn ATS company slugs into a human-readable company name for UI.
 * e.g. "salesforce|wd12|external_career_site" → "Salesforce"
 */
export function formatCompanyDisplayName(raw) {
  if (raw == null) return ''
  let s = String(raw).trim()
  if (!s) return ''

  if (s.includes('|')) {
    s = s.split('|')[0].trim()
  }

  s = s.replace(/^(workday|greenhouse|lever|ashby|smartrecruiters):/i, '').trim()

  const key = s.toLowerCase().replace(/[\s_-]+/g, '')
  if (KNOWN_COMPANY_NAMES[key]) return KNOWN_COMPANY_NAMES[key]

  if (/[A-Z]/.test(s) && /[a-z]/.test(s) && !/\|/.test(s)) {
    return s
  }
  if (/\s/.test(s) && /[A-Z]/.test(s)) {
    return s
  }

  s = s
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const compact = s.toLowerCase().replace(/\s+/g, '')
  if (KNOWN_COMPANY_NAMES[compact]) return KNOWN_COMPANY_NAMES[compact]

  return s
    .split(' ')
    .filter(Boolean)
    .map((word) => {
      const lower = word.toLowerCase()
      if (KNOWN_COMPANY_NAMES[lower]) return KNOWN_COMPANY_NAMES[lower]
      if (ACRONYM_RE.test(lower)) return lower.toUpperCase()
      return lower.charAt(0).toUpperCase() + lower.slice(1)
    })
    .join(' ')
}
