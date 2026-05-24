/**
 * Cascading education options (Naukri-style). Extend SPECIALIZATIONS_BY_COURSE
 * for finer mappings; unknown courses fall back to ENGINEERING_SPECIALIZATIONS.
 */

export const EDUCATION_LEVELS = [
  { id: 'phd', label: 'Doctorate / PhD' },
  { id: 'masters', label: 'Masters / Post-Graduation' },
  { id: 'bachelors', label: 'Graduation / Diploma' },
  { id: 'diploma', label: 'Diploma / Polytechnic' },
  { id: 'class12', label: '12th / Higher Secondary' },
  { id: 'class10', label: '10th / Secondary' },
]

const COURSES_BY_LEVEL = {
  phd: ['Ph.D.', 'M.Phil.', 'Doctor of Science (Sc.D.)', 'Other'],
  masters: [
    'MBA / PGDM',
    'M.Tech',
    'MS / M.Sc (Science)',
    'MCA',
    'M.Com',
    'MA',
    'M.Arch',
    'M.Pharm',
    'LLM',
    'MD / MS (Medicine)',
    'PG Diploma',
    'Other',
  ],
  bachelors: [
    'B.Tech / B.E.',
    'B.Sc',
    'BCA',
    'B.Com',
    'BBA',
    'B.Arch',
    'B.Pharm',
    'LLB',
    'MBBS',
    'BAMS',
    'B.Des',
    'Other',
  ],
  diploma: [
    'Diploma in Engineering',
    'Diploma in Computer Applications',
    'Polytechnic',
    'Hotel Management Diploma',
    'Other',
  ],
  class12: ['Higher Secondary (12th)', 'Other'],
  class10: ['Secondary (10th)', 'Other'],
}

const MBA_SPECS = [
  'Finance',
  'Marketing',
  'Human Resources',
  'Operations',
  'Business Analytics',
  'IT / Systems',
  'International Business',
  'Strategy',
  'Other',
]

const COMMERCE_SPECS = ['General', 'Accounting', 'Taxation', 'Banking', 'Other']

/** Course-specific specialization lists (label must match COURSES_BY_LEVEL strings). */
const SPECIALIZATIONS_BY_COURSE = {
  'MBA / PGDM': MBA_SPECS,
  'M.Com': COMMERCE_SPECS,
  'B.Com': COMMERCE_SPECS,
  BBA: ['General', 'Finance', 'Marketing', 'HR', 'Other'],
}

const ENGINEERING_SPECIALIZATIONS = [
  'Aeronautical',
  'Aerospace Engineering',
  'Agricultural Engineering',
  'Apparel Technology',
  'Applied Electronics and Instrumentation',
  'Artificial Intelligence',
  'Automobile Engineering',
  'Biomedical Engineering',
  'Biotechnology',
  'Chemical Engineering',
  'Civil Engineering',
  'Computer Science',
  'Computer Science and Engineering',
  'Cyber Security',
  'Data Science',
  'Electrical and Electronics Engineering',
  'Electrical Engineering',
  'Electronics and Communication',
  'Environmental Engineering',
  'Industrial Engineering',
  'Information Technology',
  'Instrumentation and Control',
  'Mechanical Engineering',
  'Metallurgical Engineering',
  'Mining Engineering',
  'Petroleum Engineering',
  'Production Engineering',
  'Robotics',
  'Structural Engineering',
  'Telecommunication',
  'Other',
]

const SCIENCE_SPECS = [
  'Physics',
  'Chemistry',
  'Mathematics',
  'Statistics',
  'Life Sciences',
  'Environmental Science',
  'Other',
]

SPECIALIZATIONS_BY_COURSE['MS / M.Sc (Science)'] = SCIENCE_SPECS
SPECIALIZATIONS_BY_COURSE['B.Sc'] = SCIENCE_SPECS

const PHD_SPECS = [...new Set([...ENGINEERING_SPECIALIZATIONS, ...SCIENCE_SPECS])]
SPECIALIZATIONS_BY_COURSE['Ph.D.'] = PHD_SPECS
SPECIALIZATIONS_BY_COURSE['M.Phil.'] = PHD_SPECS

const ENGINEERING_COURSE_NAMES = new Set([
  'B.Tech / B.E.',
  'M.Tech',
  'Diploma in Engineering',
  'Polytechnic',
  'MCA',
  'BCA',
])

export function coursesForLevel(levelId) {
  if (!levelId) return []
  return COURSES_BY_LEVEL[levelId] || []
}

export function specializationsForCourse(course) {
  if (!course || course === 'Other') return ['Other']
  if (SPECIALIZATIONS_BY_COURSE[course]) return [...SPECIALIZATIONS_BY_COURSE[course]]
  if (ENGINEERING_COURSE_NAMES.has(course)) return [...ENGINEERING_SPECIALIZATIONS]
  return ['General', 'Other']
}

export function buildDegreeLabel(course, specialization, fallbackDegree) {
  const c = (course || '').trim()
  const s = (specialization || '').trim()
  if (c && s && s !== 'General') return `${c} — ${s}`
  if (c) return c
  return (fallbackDegree || '').trim()
}
