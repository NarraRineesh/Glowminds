/* =====================================================
   Resume Builder — JSON template library (v3)
   -------------------------------------------------------
   Each template is a complete resume JSON: it carries
   `design`, a `layout` (single or two-column), an optional
   `sidebarSide` (which side the sidebar sits on), and a
   `content` block with the editable strings.

   Layouts:
     - "single"      content.sections    rendered top→bottom.
     - "two-column"  content.main + content.sidebar
                     rendered side-by-side. `sidebarSide`
                     decides which column is the narrower
                     "sidebar" (it can also have its own
                     background fill via design.sidebarBackground).

   Section `type`s the canvas understands:
     - "paragraph"   single rich text block
                     (variant:"highlight" → soft pink box).
     - "inline"      single-line list (centered).
     - "list"        bulleted list of plain strings.
     - "experience"  list of jobs/roles with bullets.
     - "education"   list of degrees / schools.
     - "achievements" list of { title, description}.

   Add a new template by copying any block below and
   tweaking the JSON. The renderer handles the rest —
   no React changes needed.
===================================================== */

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
  template: 'ivy',
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

/* ---------- Reusable copy fragments ---------- */

const CONTACT_JOSHUA =
  '+1-(234)-555-1234 • help@enhancv.com • linkedin.com/in/joshua • Los Angeles, California'
const CONTACT_AIDEN =
  '+1-(234)-555-1234 • aiden@example.com • linkedin.com/in/aiden • Indianapolis, IN'

/* =========================================================
   Template library
========================================================= */

export const RESUME_TEMPLATES = [
  /* ---------- 1. Double column ---------- */
  {
    id: 'double-column',
    name: 'Double column',
    thumb: 'col2',
    meta: 'Sidebar right',
    layout: LAYOUTS.TWO_COLUMN,
    sidebarSide: 'right',
    design: {
      ...DEFAULT_DESIGN,
      template: 'double-column',
      accent: '#0d6cf2',
      fontFamily: 'Inter',
      pageBackground: '#ffffff',
      sidebarBackground: '#f4f6fa',
      sidebarText: '#1f2330',
    },
    content: {
      header: {
        name: 'Ethan Smith',
        headline: 'Chief Experience Officer · Customer-Centric Strategies · Digital Transformation',
        contact: '+1-(234)-555-1234 • ethan@example.com • linkedin.com/in/esmith • Indianapolis, IN',
      },
      main: [
        {
          id: 'summary',
          title: 'Summary',
          type: SECTION_TYPES.PARAGRAPH,
          body:
            'Customer-experience leader with 15+ years aligning service, product and digital strategies in mid-market tech and retail. I rebuild voice-of-customer programs end to end and ship programs that move NPS, churn, and CSAT in the same quarter.',
        },
        {
          id: 'experience',
          title: 'Experience',
          type: SECTION_TYPES.EXPERIENCE,
          items: [
            {
              company: 'Northwave Retail',
              location: 'Indianapolis, IN',
              role: 'Chief Experience Officer',
              dates: '01/2020 – Present',
              bullets: [
                'Built the company-wide CX operating model across 38 retail markets; raised NPS from 41 → 64 in 18 months.',
                'Designed a closed-loop customer-feedback platform; resolved 88% of issues within one shift cycle.',
                'Led a cross-functional digital transformation that lifted online attribution by 32% YoY.',
                'Shaped exec-level dashboards that became the default narrative in monthly board reviews.',
              ],
            },
            {
              company: 'Lumis Brands',
              location: 'Cincinnati, OH',
              role: 'VP, Customer Experience',
              dates: '2016 – 2019',
              bullets: [
                'Re-built service ops across 4 BUs; removed 12 hand-offs and dropped average resolution time by 41%.',
                'Authored the customer-recognition program now embedded in onboarding for 1,400 employees.',
              ],
            },
          ],
        },
        {
          id: 'cx-leadership',
          title: 'Customer Experience Leadership',
          type: SECTION_TYPES.EXPERIENCE,
          items: [
            {
              company: 'Driftwood Hospitality',
              location: 'Chicago, IL',
              role: 'Customer Experience Manager',
              dates: '2013 – 2016',
              bullets: [
                'Designed the loyalty rewards program; doubled active members in two seasons.',
                'Standardized the on-property experience playbook; CSAT moved from 71 → 86.',
              ],
            },
          ],
        },
      ],
      sidebar: [
        {
          id: 'achievements',
          title: 'Key Achievements',
          type: SECTION_TYPES.ACHIEVEMENTS,
          items: [
            {
              title: 'Revamped Customer-Feedback System',
              description: 'Doubled active customer participation and reduced unresolved tickets by 43%.',
            },
            {
              title: 'Increased Customer Retention',
              description: 'Cross-functional program shifted retention from 78% → 91% in 18 months.',
            },
            {
              title: 'Elevated Service Quality',
              description: 'Service playbook adopted across 38 markets; CSAT improved 19 points.',
            },
          ],
        },
        {
          id: 'skills',
          title: 'Skills',
          type: SECTION_TYPES.LIST,
          items: [
            'Customer Experience Strategy',
            'Voice of Customer Programs',
            'Digital Transformation',
            'Service Design',
            'Stakeholder Communication',
            'Operational Excellence',
          ],
        },
        {
          id: 'education',
          title: 'Education',
          type: SECTION_TYPES.EDUCATION,
          items: [
            {
              degree: 'Master of Business Administration (MBA)',
              school: 'University of Indiana',
              dates: '2010 – 2012',
            },
            {
              degree: 'B.S. Marketing',
              school: 'Purdue University',
              dates: '2005 – 2009',
            },
          ],
        },
        {
          id: 'training',
          title: 'Training / Courses',
          type: SECTION_TYPES.LIST,
          items: [
            'Customer Experience Management — CXPA',
            'Service Design Bootcamp — IDEO U',
          ],
        },
        {
          id: 'languages',
          title: 'Languages',
          type: SECTION_TYPES.LIST,
          items: ['English — Native', 'Spanish — Advanced'],
        },
      ],
    },
  },

  /* ---------- 2. Ivy League ---------- */
  {
    id: 'ivy',
    name: 'Ivy League',
    thumb: 'ivy',
    meta: 'Centered, classic',
    layout: LAYOUTS.SINGLE,
    design: {
      ...DEFAULT_DESIGN,
      template: 'ivy',
      accent: '#1f2330',
      fontFamily: 'Source Serif 4',
    },
    content: {
      header: {
        name: 'Abigail Hall',
        headline: 'Senior Business Analyst · Data & Analytics Growth',
        contact: 'abigail@example.com • linkedin.com/in/ahall • San Francisco, CA',
      },
      sections: [
        {
          id: 'summary',
          title: 'Summary',
          type: SECTION_TYPES.PARAGRAPH,
          variant: 'highlight',
          body:
            'Senior IT business analyst with over 11 years in modern analytics and product growth. Track record building cross-functional alignment between engineering, design and finance, with a focus on operational metrics that move the business.',
        },
        {
          id: 'experience',
          title: 'Experience',
          type: SECTION_TYPES.EXPERIENCE,
          items: [
            {
              company: 'Sandfit Inc.',
              location: 'San Francisco, CA',
              role: 'Senior Business Analyst',
              dates: '06/2020 – Present',
              bullets: [
                'Led the development of a data-product roadmap that became the basis for two new business lines.',
                'Owned the launch of a self-serve operational metrics layer used by 600+ employees daily.',
                'Reduced churn-prediction false-positives by 23% by re-engineering input features and adding domain rules.',
              ],
            },
            {
              company: 'Anigec',
              location: 'Mountain View, CA',
              role: 'Business Systems Analyst',
              dates: '01/2017 – 12/2019',
              bullets: [
                'Implemented a stage-gate integration plan that drove revenue lift across the company $2.8M annually.',
                'Mapped 60+ workflow primitives, sunsetting 14 legacy spreadsheets and exposing them as APIs.',
              ],
            },
            {
              company: 'BrightLink Pharmaceuticals',
              location: 'Foster City, CA',
              role: 'Data Analyst',
              dates: '01/2015 – 12/2016',
              bullets: [
                'Authored monthly research deliverables consumed by 4 R&D leaders; cut prep time from 5d → 1d.',
                'Built core dashboards still used in clinical-trial operations today.',
              ],
            },
          ],
        },
        {
          id: 'education',
          title: 'Education',
          type: SECTION_TYPES.EDUCATION,
          items: [
            {
              degree: 'Master of Science in Information Systems',
              school: 'University of San Francisco',
              dates: '2013 – 2015',
            },
            {
              degree: 'Bachelor of Science in Computer Science',
              school: 'University of California, Berkeley',
              dates: '2009 – 2013',
            },
          ],
        },
        {
          id: 'achievements',
          title: 'Key Achievements',
          type: SECTION_TYPES.ACHIEVEMENTS,
          items: [
            {
              title: 'Streamlined Reporting Processes',
              description: 'Reduced time spent on monthly reports from 5 days to 1, freeing team capacity.',
            },
            {
              title: 'Award for Innovation',
              description: 'Recognized for the launch of the cross-functional data-product roadmap.',
            },
          ],
        },
        {
          id: 'skills',
          title: 'Skills',
          type: SECTION_TYPES.INLINE,
          body: 'Data Visualization · Agile Methodologies · SQL · Python · Tableau · Power BI · Stakeholder Communication',
        },
        {
          id: 'certs',
          title: 'Certifications',
          type: SECTION_TYPES.LIST,
          items: [
            'Certified Scrum Product Owner — Scrum Alliance',
            'Tableau Desktop Specialist — Tableau',
          ],
        },
      ],
    },
  },

  /* ---------- 3. Elegant ---------- */
  {
    id: 'elegant',
    name: 'Elegant',
    thumb: 'dark',
    meta: 'Dark right sidebar',
    layout: LAYOUTS.TWO_COLUMN,
    sidebarSide: 'right',
    design: {
      ...DEFAULT_DESIGN,
      template: 'elegant',
      accent: '#1e3a5f',
      fontFamily: 'Inter',
      pageBackground: '#ffffff',
      sidebarBackground: '#1e3a5f',
      sidebarText: '#ffffff',
      spacing: 1.05,
    },
    content: {
      header: {
        name: 'Aiden Williams',
        headline: 'Senior Project Manager · Treasury & Expense Management',
        contact: CONTACT_AIDEN,
      },
      main: [
        {
          id: 'summary',
          title: 'Summary',
          type: SECTION_TYPES.PARAGRAPH,
          body:
            'Accomplished Senior Project Manager with 14+ years of experience guiding global priority portfolios in treasury, payments and expense management. Deep partnerships across product, engineering and operations to deliver programs that quantifiably move metrics.',
        },
        {
          id: 'experience',
          title: 'Experience',
          type: SECTION_TYPES.EXPERIENCE,
          items: [
            {
              company: 'JPMorgan Chase',
              location: 'Indianapolis, IN',
              role: 'Senior Project Manager — Treasury Systems',
              dates: '06/2019 – Present',
              bullets: [
                'Led development of a $4M treasury operations modernization across 7 squads with no missed milestones.',
                'Reduced operational expenses by 14% through process redesign and vendor renegotiations.',
                'Drove a 25% increase in cross-team productivity by introducing portfolio-level OKRs.',
              ],
            },
            {
              company: 'PNC Bank',
              location: 'Cincinnati, OH',
              role: 'Risk Management Operations Analyst',
              dates: '2014 – 2019',
              bullets: [
                'Co-led migration of legacy expense tooling to a cloud-native platform; saved 2,400 manual hours/year.',
                'Built the executive risk dashboard now used in monthly leadership reviews.',
              ],
            },
          ],
        },
        {
          id: 'education',
          title: 'Education',
          type: SECTION_TYPES.EDUCATION,
          items: [
            {
              degree: 'Master of Business Administration (MBA)',
              school: 'Indiana University Kelley School of Business',
              dates: '2011 – 2013',
            },
            {
              degree: 'B.S. Finance',
              school: 'Purdue University',
              dates: '2007 – 2011',
            },
          ],
        },
        {
          id: 'languages',
          title: 'Languages',
          type: SECTION_TYPES.LIST,
          items: ['English — Native', 'Spanish — Advanced'],
        },
      ],
      sidebar: [
        {
          id: 'achievements',
          title: 'Key Achievements',
          type: SECTION_TYPES.ACHIEVEMENTS,
          items: [
            {
              title: 'Enterprise-Wide System Implementation',
              description: 'Led the rollout of a new expense-management system across 12 markets.',
            },
            {
              title: 'Process Efficiency Optimization',
              description: 'Designed an end-to-end ops review that removed 11 hand-offs.',
            },
            {
              title: 'Risk Management Framework Development',
              description: 'Authored the framework now embedded in onboarding for 800+ employees.',
            },
            {
              title: 'Financial Leadership Recognition',
              description: 'Recognized as one of the top 25 emerging leaders in financial services.',
            },
          ],
        },
        {
          id: 'skills',
          title: 'Skills',
          type: SECTION_TYPES.LIST,
          items: [
            'Project Management',
            'Treasury Operations',
            'Risk Management',
            'Process Optimization',
            'Portfolio OKRs',
            'Stakeholder Comms',
          ],
        },
        {
          id: 'courses',
          title: 'Courses',
          type: SECTION_TYPES.LIST,
          items: [
            'Certifications in Project Management — PMI',
            'Pro Cert in Lean Six Sigma Green Belt',
          ],
        },
        {
          id: 'passions',
          title: 'Passions',
          type: SECTION_TYPES.LIST,
          items: ['Financial Markets Education', 'Mentoring early-career talent', 'Sailing'],
        },
      ],
    },
  },

  /* ---------- 4. Modern ---------- */
  {
    id: 'modern',
    name: 'Modern',
    thumb: 'modern',
    meta: 'Accent-led, two-col',
    layout: LAYOUTS.TWO_COLUMN,
    sidebarSide: 'right',
    design: {
      ...DEFAULT_DESIGN,
      template: 'modern',
      accent: '#16b981',
      fontFamily: 'Inter',
      pageBackground: '#ffffff',
      sidebarBackground: '#f6fbf8',
      sidebarText: '#1f2330',
      lineHeight: 1.15,
    },
    content: {
      header: {
        name: 'Ellen Johnson',
        headline: 'Digital Marketing Manager · Growth Strategy · Data Analysis',
        contact: 'ellen@example.com • linkedin.com/in/ejohnson • San Francisco, CA',
      },
      main: [
        {
          id: 'experience',
          title: 'Experience',
          type: SECTION_TYPES.EXPERIENCE,
          items: [
            {
              company: 'TechReach',
              location: 'San Francisco, CA',
              role: 'Senior Digital Marketing Specialist',
              dates: '01/2020 – Present',
              bullets: [
                'Led the development and execution of a multi-channel digital marketing strategy that grew SQLs by 35% YoY.',
                'Owned the rebuild of the paid-acquisition stack (Google + Meta + LinkedIn); CAC dropped 28%.',
                'Designed an experimentation rubric used across 4 teams; A/B win-rate moved from 18% → 31%.',
              ],
            },
            {
              company: 'MarketCues',
              location: 'San Francisco, CA',
              role: 'Digital Marketing Manager',
              dates: '06/2017 – 12/2019',
              bullets: [
                'Managed paid + organic search and social spend ($2.2M/yr); ROAS lifted from 3.4 → 5.1.',
                'Hired and grew a team of 6 specialists; 4 promoted into senior roles.',
              ],
            },
            {
              company: 'BrightWeb Agency',
              location: 'San Francisco, CA',
              role: 'Performance Marketing Manager',
              dates: '01/2015 – 05/2017',
              bullets: [
                'Owned the performance pod for 9 enterprise clients; net retention 134%.',
                'Wrote the Google Ads playbook still used in agency onboarding.',
              ],
            },
          ],
        },
        {
          id: 'education',
          title: 'Education',
          type: SECTION_TYPES.EDUCATION,
          items: [
            {
              degree: 'Master of Science in Marketing Analytics',
              school: 'University of California, Berkeley',
              dates: '2013 – 2015',
            },
            {
              degree: 'Bachelor of Science in Business Administration',
              school: 'San Francisco State University',
              dates: '2009 – 2013',
            },
          ],
        },
      ],
      sidebar: [
        {
          id: 'summary',
          title: 'Summary',
          type: SECTION_TYPES.PARAGRAPH,
          body:
            'Motivated digital-marketing manager with 8+ years of experience in driving user acquisition and growth through strategic paid campaigns, experimentation, and revenue analytics.',
        },
        {
          id: 'achievements',
          title: 'Key Achievements',
          type: SECTION_TYPES.ACHIEVEMENTS,
          items: [
            {
              title: '40% User Acquisition Increase',
              description: 'Spearheaded a digital-marketing campaign that grew the user base 40% in twelve months.',
            },
            {
              title: '30% ROAS Improvement',
              description: 'Built and ran the multi-channel paid stack with sustained ROAS gains across two years.',
            },
            {
              title: 'Market Share Expansion',
              description: 'Identified and captured a new audience segment; produced $2.2M in new pipeline.',
            },
            {
              title: 'Conversion-Rate Optimization Innovation',
              description: 'Designed CRO rituals that lifted on-site conversion 19% across 4 product lines.',
            },
          ],
        },
        {
          id: 'skills',
          title: 'Skills',
          type: SECTION_TYPES.LIST,
          items: [
            'Data Analysis',
            'Test Automation',
            'Conversion Rate Optimization',
            'Paid Search · Paid Social',
            'Google Ads · Meta Ads',
            'A/B Testing',
            'Lifecycle Marketing',
          ],
        },
        {
          id: 'certs',
          title: 'Certifications',
          type: SECTION_TYPES.LIST,
          items: [
            'Advanced Google Analytics',
            'Effective Channel Testing — Reforge',
          ],
        },
      ],
    },
  },

  /* ---------- 5. Polished ---------- */
  {
    id: 'polished',
    name: 'Polished',
    thumb: 'col2',
    meta: 'Dark left sidebar',
    layout: LAYOUTS.TWO_COLUMN,
    sidebarSide: 'left',
    design: {
      ...DEFAULT_DESIGN,
      template: 'polished',
      accent: '#0e8d8d',
      fontFamily: 'Inter',
      pageBackground: '#ffffff',
      sidebarBackground: '#0e8d8d',
      sidebarText: '#ffffff',
    },
    content: {
      header: {
        name: 'Jason Reed',
        headline: 'Vice President, Manufacturing · Strategic Leadership · Process Optimization',
        contact: 'jason@example.com • +1-(415) 555 0188 • Seattle, WA',
      },
      sidebar: [
        {
          id: 'achievements',
          title: 'Key Achievements',
          type: SECTION_TYPES.ACHIEVEMENTS,
          items: [
            {
              title: '20% Production Efficiency Increase',
              description: 'Implemented lean manufacturing across 4 plants, lifting OEE 17 → 21.',
            },
            {
              title: '30% Revenue Growth',
              description: 'Negotiated and onboarded a flagship retail client that drove a 30% YoY lift.',
            },
            {
              title: '40% Customer Satisfaction',
              description: 'Customer council and quality-loop program raised CSAT 40 points.',
            },
          ],
        },
        {
          id: 'certs',
          title: 'Certifications',
          type: SECTION_TYPES.LIST,
          items: [
            'Lean Manufacturing Certification',
            'Advanced Project Management Certification — PMI',
          ],
        },
        {
          id: 'languages',
          title: 'Languages',
          type: SECTION_TYPES.LIST,
          items: ['English — Native', 'Spanish — Conversational'],
        },
        {
          id: 'passions',
          title: 'Passions',
          type: SECTION_TYPES.LIST,
          items: ['Sustainable Manufacturing', 'Operational Excellence', 'Mentorship'],
        },
      ],
      main: [
        {
          id: 'summary',
          title: 'Summary',
          type: SECTION_TYPES.PARAGRAPH,
          body:
            'With over 18 years of leadership in manufacturing, I excel in strategic planning, process optimization, and team leadership. My greatest achievement was spearheading a $20M cost-reduction initiative that delivered better outcomes for customers and operators.',
        },
        {
          id: 'experience',
          title: 'Experience',
          type: SECTION_TYPES.EXPERIENCE,
          items: [
            {
              company: 'XYZ Industries',
              location: 'Seattle, WA',
              role: 'Vice President, Manufacturing',
              dates: '01/2018 – Present',
              bullets: [
                'Led a year-long supply-chain transformation across 5 plants; cost-to-serve dropped 18%.',
                'Negotiated a multi-year supplier agreement that locked in pricing for 4 critical inputs.',
              ],
            },
            {
              company: 'ABC Manufacturing',
              location: 'Seattle, WA',
              role: 'Director of Operations',
              dates: '06/2013 – 12/2017',
              bullets: [
                'Implemented Six Sigma across 3 facilities; defect rate fell from 1.4% to 0.6%.',
                'Owned the post-merger ops integration of two factories; achieved synergy targets a quarter early.',
              ],
            },
            {
              company: 'PQR Inc.',
              location: 'Tacoma, WA',
              role: 'Senior Process Engineer',
              dates: '2009 – 2013',
              bullets: [
                'Designed and shipped 11 process-engineering improvements that reduced scrap 12% on average.',
              ],
            },
          ],
        },
        {
          id: 'skills',
          title: 'Skills',
          type: SECTION_TYPES.INLINE,
          body: 'Strategic Planning · Lean Manufacturing · Process Optimization · Team Leadership · Supplier Negotiation · OKRs',
        },
        {
          id: 'education',
          title: 'Education',
          type: SECTION_TYPES.EDUCATION,
          items: [
            {
              degree: 'Master of Science in Chemical Engineering',
              school: 'Massachusetts Institute of Technology',
              dates: '2003 – 2005',
            },
            {
              degree: 'Bachelor of Science in Chemical Engineering',
              school: 'University of Washington',
              dates: '1999 – 2003',
            },
          ],
        },
      ],
    },
  },

  /* ---------- 6. Contemporary ---------- */
  {
    id: 'contemporary',
    name: 'Contemporary',
    thumb: 'modern',
    meta: 'Single, photo-friendly',
    layout: LAYOUTS.SINGLE,
    design: {
      ...DEFAULT_DESIGN,
      template: 'contemporary',
      accent: '#16b981',
      fontFamily: 'Inter',
      pageBackground: '#ffffff',
    },
    content: {
      header: {
        name: 'Aiden Williams',
        headline: 'Digital Marketing Manager',
        contact: CONTACT_AIDEN,
      },
      sections: [
        {
          id: 'summary',
          title: 'Summary',
          type: SECTION_TYPES.PARAGRAPH,
          body:
            'Motivated digital-marketing manager with 8 years of experience driving user acquisition and growth through strategic paid campaigns, experimentation, and revenue analytics.',
        },
        {
          id: 'experience',
          title: 'Experience',
          type: SECTION_TYPES.EXPERIENCE,
          items: [
            {
              company: 'TechReach',
              location: 'San Francisco, CA',
              role: 'Senior Digital Marketing Specialist',
              dates: '01/2020 – Present',
              bullets: [
                'Led development of a multi-channel digital strategy that grew SQLs by 35% YoY.',
                'Re-built the paid-acquisition stack (Google + Meta + LinkedIn); CAC dropped 28%.',
                'Designed an experimentation rubric used across 4 teams; A/B win-rate moved from 18% → 31%.',
              ],
            },
            {
              company: 'MarketCues',
              location: 'San Francisco, CA',
              role: 'Digital Marketing Manager',
              dates: '06/2017 – 12/2019',
              bullets: [
                'Managed paid + organic search and social spend ($2.2M/yr); ROAS lifted from 3.4 → 5.1.',
                'Hired and grew a team of 6 specialists; 4 promoted into senior roles.',
              ],
            },
          ],
        },
        {
          id: 'achievements',
          title: 'Key Achievements',
          type: SECTION_TYPES.ACHIEVEMENTS,
          items: [
            {
              title: '40% User Acquisition Increase',
              description: 'Spearheaded a marketing campaign that grew the user base 40% in twelve months.',
            },
            {
              title: 'Market Share Expansion',
              description: 'Identified and captured a new audience segment generating $2.2M in pipeline.',
            },
          ],
        },
        {
          id: 'certs',
          title: 'Certification',
          type: SECTION_TYPES.LIST,
          items: ['Advanced Google Analytics', 'Effective Channel Testing — Reforge'],
        },
        {
          id: 'education',
          title: 'Education',
          type: SECTION_TYPES.EDUCATION,
          items: [
            {
              degree: 'Master of Science in Marketing Analytics',
              school: 'University of California, Berkeley',
              dates: '2013 – 2015',
            },
            {
              degree: 'Bachelor of Science in Business Administration',
              school: 'San Francisco State University',
              dates: '2009 – 2013',
            },
          ],
        },
      ],
    },
  },

  /* ---------- 7. Creative ---------- */
  {
    id: 'creative',
    name: 'Creative',
    thumb: 'col2',
    meta: 'Dark right sidebar',
    layout: LAYOUTS.TWO_COLUMN,
    sidebarSide: 'right',
    design: {
      ...DEFAULT_DESIGN,
      template: 'creative',
      accent: '#0e8d8d',
      fontFamily: 'Inter',
      pageBackground: '#ffffff',
      sidebarBackground: '#0e8d8d',
      sidebarText: '#ffffff',
    },
    content: {
      header: {
        name: 'Brandon Hale',
        headline: 'Senior Business Development Director · Biotech & Pharma Expertise',
        contact: 'brandon@example.com • +1 415 555 0188 • Boston, MA',
      },
      main: [
        {
          id: 'experience',
          title: 'Experience',
          type: SECTION_TYPES.EXPERIENCE,
          items: [
            {
              company: 'GenoTech',
              location: 'Boston, MA',
              role: 'Business Development Manager',
              dates: '06/2019 – Present',
              bullets: [
                'Generated $30M in new sales revenue in two thirds and one year.',
                'Negotiated a multi-year deal with a strategic biotech partner that delivered $9M in upside.',
                'Owned the pricing model and lifted gross margin 7pp by re-tiering accounts.',
              ],
            },
            {
              company: 'Regeneron Pharmaceuticals',
              location: 'Tarrytown, NY',
              role: 'Regional Sales Director',
              dates: '01/2014 – 05/2019',
              bullets: [
                'Exceeded sales goals by 30% for two consecutive years; grew region from #6 to #1.',
                'Designed and orchestrated a top-physician advisory program now run quarterly.',
              ],
            },
            {
              company: 'Pfizer Inc.',
              location: 'New York, NY',
              role: 'Pharmaceutical Sales Representative',
              dates: '06/2011 – 12/2013',
              bullets: [
                'Managed the growth of a 60-customer territory in 11 product lines and added 14 new accounts.',
              ],
            },
          ],
        },
        {
          id: 'education',
          title: 'Education',
          type: SECTION_TYPES.EDUCATION,
          items: [
            {
              degree: 'Master of Business Administration',
              school: 'University of Florida',
              dates: '2009 – 2011',
            },
            {
              degree: 'Bachelor of Science in Biotechnology',
              school: 'Florida State University',
              dates: '2005 – 2009',
            },
          ],
        },
        {
          id: 'skills',
          title: 'Skills',
          type: SECTION_TYPES.INLINE,
          body: 'Business Development · Strategic Sales Planning · Client Retention Strategies · CRM Systems · Market Analysis',
        },
      ],
      sidebar: [
        {
          id: 'summary',
          title: 'Summary',
          type: SECTION_TYPES.PARAGRAPH,
          body:
            'I bring a decade of excellence in the biopharmaceutical industry; the perfect partner for any business looking to take their development pipeline to the next level.',
        },
        {
          id: 'achievements',
          title: 'Key Achievements',
          type: SECTION_TYPES.ACHIEVEMENTS,
          items: [
            { title: 'Top Regional Sales Performer', description: 'Recognized as the top-performing sales director two years running.' },
            { title: 'Successful Product Launch', description: 'Co-led the launch of an oncology product that hit $25M ARR in year one.' },
            { title: 'Strategic Accounts Revenue Growth', description: 'Doubled enterprise contracts in 18 months; increased average ACV by 31%.' },
            { title: 'Sales Team Development Award', description: 'Recognized for designing the regional ramp program now used company-wide.' },
          ],
        },
        {
          id: 'courses',
          title: 'Courses',
          type: SECTION_TYPES.LIST,
          items: ['Advanced Bio-Pharmaceutical Business Development', 'Regulatory Affairs for Biologics'],
        },
        {
          id: 'passions',
          title: 'Passions',
          type: SECTION_TYPES.LIST,
          items: ['Leadership and Mentoring', 'Community Outreach'],
        },
      ],
    },
  },

  /* ---------- 8. Timeline ---------- */
  {
    id: 'timeline',
    name: 'Timeline',
    thumb: 'col2',
    meta: 'Date rail on left',
    layout: LAYOUTS.TWO_COLUMN,
    sidebarSide: 'right',
    design: {
      ...DEFAULT_DESIGN,
      template: 'timeline',
      accent: '#16b981',
      fontFamily: 'Inter',
      pageBackground: '#ffffff',
      sidebarBackground: '#f6fbf8',
      sidebarText: '#1f2330',
    },
    content: {
      header: {
        name: 'Grace Jackson',
        headline: 'Data Scientist · Advanced Analytics · Machine Learning',
        contact: 'grace@example.com • +1 415 555 0188 • linkedin.com/in/gjackson • San Francisco, CA',
      },
      main: [
        {
          id: 'experience',
          title: 'Experience',
          type: SECTION_TYPES.EXPERIENCE,
          items: [
            {
              company: 'Tech Innovations Inc.',
              location: 'San Francisco, CA',
              role: 'Senior Data Scientist',
              dates: '01/2022 – Present',
              bullets: [
                'Built end-to-end pipelines that reduced model retraining time from days to hours, saving 40+ engineering hours per week.',
                'Spearheaded the design of a new recommendation engine resulting in a 35% boost in user engagement.',
                'Hired and grew the analytics team from 3 → 9 over 18 months; 4 promoted to senior IC roles.',
              ],
            },
            {
              company: 'Innovate Tech',
              location: 'San Francisco, CA',
              role: 'Data Scientist',
              dates: '01/2018 – 12/2021',
              bullets: [
                'Owned the customer-segmentation refresh that lifted email-campaign CTR by 18%.',
                'Productionized 4 ML services on Kubernetes; designed the on-call rotation still in use today.',
              ],
            },
            {
              company: 'Insightful Analytics',
              location: 'San Jose, CA',
              role: 'Junior Data Scientist',
              dates: '01/2015 – 12/2017',
              bullets: [
                'Implemented data-cleaning utilities that reduced load time across nightly jobs by 38%.',
              ],
            },
          ],
        },
        {
          id: 'education',
          title: 'Education',
          type: SECTION_TYPES.EDUCATION,
          items: [
            {
              degree: 'M.S. Applied Mathematics',
              school: 'University of California, Berkeley',
              dates: '2013 – 2015',
            },
          ],
        },
      ],
      sidebar: [
        {
          id: 'summary',
          title: 'Summary',
          type: SECTION_TYPES.PARAGRAPH,
          body:
            'With over 9 years of experience in data science, machine learning and statistical modeling, I am eager to apply analytical thinking to ambiguous problems with measurable outcomes.',
        },
        {
          id: 'skills',
          title: 'Skills',
          type: SECTION_TYPES.LIST,
          items: ['Statistical Modeling', 'Data Visualization', 'Python · SQL', 'PyTorch · scikit-learn', 'Airflow · DBT'],
        },
        {
          id: 'achievements',
          title: 'Key Achievements',
          type: SECTION_TYPES.ACHIEVEMENTS,
          items: [
            { title: 'New Workflow Architecture', description: 'Designed an auto-deploy pipeline that cut ML deploy time by 60%.' },
            { title: 'New Lead Predictive Model', description: 'Created a model with 92% AUC on hold-out; doubled qualified-lead volume.' },
          ],
        },
      ],
    },
  },

  /* ---------- 9. Stylish ---------- */
  {
    id: 'stylish',
    name: 'Stylish',
    thumb: 'col2',
    meta: 'Sidebar left, neutral',
    layout: LAYOUTS.TWO_COLUMN,
    sidebarSide: 'left',
    design: {
      ...DEFAULT_DESIGN,
      template: 'stylish',
      accent: '#dd6b20',
      fontFamily: 'Inter',
      pageBackground: '#ffffff',
      sidebarBackground: '#fdf6ee',
      sidebarText: '#1f2330',
    },
    content: {
      header: {
        name: 'Violet Rodriguez',
        headline: 'Sr Software Engineer · Full-Stack Development · Cloud Solutions',
        contact: 'violet@example.com • +1 415 555 0188 • Seattle, WA',
      },
      sidebar: [
        {
          id: 'skills',
          title: 'Skills',
          type: SECTION_TYPES.LIST,
          items: [
            'HTML · CSS · JavaScript',
            'React · Node · Express',
            'AWS · GCP · Lambda',
            'Jenkins · Kubernetes',
            'Postgres · Redis',
          ],
        },
        {
          id: 'projects',
          title: 'My Projects',
          type: SECTION_TYPES.ACHIEVEMENTS,
          items: [
            {
              title: 'Open-Source Contribution to ChatHype',
              description: 'Improved real-time chat reliability across mobile and desktop clients.',
            },
            {
              title: 'Development of WordZN System',
              description: 'Built a lightweight CMS platform for small businesses using Node + Postgres.',
            },
          ],
        },
        {
          id: 'achievements',
          title: 'My Achievements',
          type: SECTION_TYPES.ACHIEVEMENTS,
          items: [
            { title: 'Lead Project to Boost Engagement', description: 'Built a 4-week sprint that lifted weekly active users 11%.' },
            { title: 'Recognised for Marketing Code', description: 'Open-sourced an attribution-tracking library now used by 14 startups.' },
            { title: 'Mentoring Excellence Award', description: 'Recognized internally for mentoring 8 engineers across two sister teams.' },
          ],
        },
      ],
      main: [
        {
          id: 'summary',
          title: 'Summary',
          type: SECTION_TYPES.PARAGRAPH,
          body:
            'With over 9 years of professional experience, I deliver scalable, full-stack solutions that move the needle on revenue and product velocity. Comfortable owning the contract from API to UI.',
        },
        {
          id: 'experience',
          title: 'Experience',
          type: SECTION_TYPES.EXPERIENCE,
          items: [
            {
              company: 'TechSolutions Inc.',
              location: 'Seattle, WA',
              role: 'Senior Full-Stack Developer',
              dates: '01/2020 – Present',
              bullets: [
                'Spearheaded the rewrite of a 7-year-old AngularJS dashboard to React + TypeScript.',
                'Cut p95 page render time from 2.1s → 700ms by removing waterfall API calls.',
                'Mentored 5 mid-level engineers and ran fortnightly architecture reviews.',
              ],
            },
            {
              company: 'CodeReach Inc.',
              location: 'Seattle, WA',
              role: 'Software Engineer II',
              dates: '06/2017 – 12/2019',
              bullets: [
                'Designed and implemented an internal feature-flag system used by 4 product teams.',
                'Owned the migration to AWS Lambda for 9 background jobs; cost dropped 41% MoM.',
              ],
            },
            {
              company: 'CodeBase Inc.',
              location: 'Seattle, WA',
              role: 'Software Developer',
              dates: '06/2014 – 05/2017',
              bullets: [
                'Built the customer-support API used by an internal tooling team for 3 years.',
              ],
            },
          ],
        },
        {
          id: 'education',
          title: 'Education',
          type: SECTION_TYPES.EDUCATION,
          items: [
            {
              degree: "Master's in Computer Science",
              school: 'University of Washington',
              dates: '2012 – 2014',
            },
            {
              degree: "Bachelor's in Software Engineering",
              school: 'San Jose State University',
              dates: '2008 – 2012',
            },
          ],
        },
      ],
    },
  },

  /* ---------- 10. Single column ---------- */
  {
    id: 'single-column',
    name: 'Single column',
    thumb: '',
    meta: 'ATS · 1 column',
    layout: LAYOUTS.SINGLE,
    design: {
      ...DEFAULT_DESIGN,
      template: 'single-column',
      accent: '#374151',
      fontFamily: 'Inter',
      pageBackground: '#ffffff',
      margins: 1.05,
    },
    content: {
      header: {
        name: 'Mason Turner',
        headline: 'Experienced Sales Professional · B2B · Networking',
        contact: 'mason@example.com • +1 415 555 0188 • linkedin.com/in/mturner • San Francisco, CA',
      },
      sections: [
        {
          id: 'summary',
          title: 'Summary',
          type: SECTION_TYPES.PARAGRAPH,
          body:
            'Accomplished sales professional with a proven track record in B2B sales. 11 years of carrying and over-quota selling enterprise software, with a knack for building durable customer partnerships and mentoring early-career reps.',
        },
        {
          id: 'experience',
          title: 'Experience',
          type: SECTION_TYPES.EXPERIENCE,
          items: [
            {
              company: 'TechSolutions Co.',
              location: 'San Jose, CA',
              role: 'Senior Account Executive',
              dates: '06/2020 – Present',
              bullets: [
                'Drove a 165% increase in B2B sales over three years by re-segmenting the territory and chasing fewer, larger accounts.',
                'Closed the largest deal in company history ($4.2M ARR over 5 years).',
                'Designed the current sales-enablement stack adopted by 32 reps.',
              ],
            },
            {
              company: 'Global Logistics Solutions',
              location: 'San Jose, CA',
              role: 'Account Manager',
              dates: '06/2016 – 05/2020',
              bullets: [
                'Managed 20+ major accounts and partnered with success to increase NRR from 102% → 124%.',
                'Implemented a feedback-loop with product that turned 6 customer feature requests into wins.',
              ],
            },
            {
              company: 'Bay Area SaaS Inc.',
              location: 'San Francisco, CA',
              role: 'Sales Associate',
              dates: '06/2014 – 05/2016',
              bullets: [
                'Developed the prospecting playbook used by 11 sales reps; bookings/rep increased 38%.',
              ],
            },
          ],
        },
        {
          id: 'education',
          title: 'Education',
          type: SECTION_TYPES.EDUCATION,
          items: [
            {
              degree: 'Master of Business Administration',
              school: 'University of Denver',
              dates: '2012 – 2014',
            },
            {
              degree: 'Bachelor of Science in Marketing',
              school: 'Colorado State University',
              dates: '2008 – 2012',
            },
          ],
        },
        {
          id: 'achievements',
          title: 'Key Achievements',
          type: SECTION_TYPES.ACHIEVEMENTS,
          items: [
            { title: 'Maximized Market Reach', description: 'Initiated a multi-channel campaign that doubled inbound from the upper market.' },
            { title: 'Strategic Account Growth', description: 'Designed an account-management cadence that lifted ACV 27% on the top 10.' },
          ],
        },
      ],
    },
  },

  /* ---------- 11. Compact ---------- */
  {
    id: 'compact',
    name: 'Compact',
    thumb: 'col2',
    meta: '2 cols, soft accent',
    layout: LAYOUTS.TWO_COLUMN,
    sidebarSide: 'right',
    design: {
      ...DEFAULT_DESIGN,
      template: 'compact',
      accent: '#0ea5a8',
      fontFamily: 'Inter',
      pageBackground: '#ffffff',
      sidebarBackground: '#eaf6f7',
      sidebarText: '#1f2330',
      spacing: 0.92,
      fontSize: 'small',
    },
    content: {
      header: {
        name: 'Isabella Adams',
        headline: 'Educational Leader · Curriculum Development · Innovative Teaching',
        contact: 'isabella@example.com • +1 415 555 0188 • Los Angeles, CA',
      },
      main: [
        {
          id: 'experience',
          title: 'Experience',
          type: SECTION_TYPES.EXPERIENCE,
          items: [
            {
              company: 'Innovative Charter School',
              location: 'Los Angeles, CA',
              role: 'Senior Curriculum Coordinator',
              dates: '06/2020 – Present',
              bullets: [
                'Spearheaded the redesign of the district\'s STEM curriculum, used by 4,000+ students annually.',
                'Hosted 4 family-engagement summits that lifted parent participation by 23%.',
                'Managed the rollout of a hybrid teaching model adopted by 8 sister schools post-pandemic.',
              ],
            },
            {
              company: 'Future Minds Academy',
              location: 'Los Angeles, CA',
              role: 'Advanced Curriculum Coordinator',
              dates: '01/2017 – 05/2020',
              bullets: [
                'Increased Advanced Placement AP exam pass-rates by 30% in two years.',
                'Collaborated with the district team on a K-12 STEM enrichment program.',
                'Wrote the after-school program rubric still in use by all six campuses.',
              ],
            },
          ],
        },
        {
          id: 'education',
          title: 'Education',
          type: SECTION_TYPES.EDUCATION,
          items: [
            {
              degree: 'Master of Science in Education',
              school: 'University of California, Los Angeles',
              dates: '2014 – 2016',
            },
            {
              degree: 'Bachelor of Science in Biology',
              school: 'University of California, Davis',
              dates: '2009 – 2013',
            },
          ],
        },
        {
          id: 'languages',
          title: 'Languages',
          type: SECTION_TYPES.LIST,
          items: ['English — Native', 'Spanish — Conversational'],
        },
      ],
      sidebar: [
        {
          id: 'summary',
          title: 'Summary',
          type: SECTION_TYPES.PARAGRAPH,
          body:
            'Passionate educator with more than 10 years of successful teaching and leadership experience, building a future degree in Education, specializing in part-time development and student diversity.',
        },
        {
          id: 'achievements',
          title: 'Key Achievements',
          type: SECTION_TYPES.ACHIEVEMENTS,
          items: [
            { title: 'AP Program Expansion', description: 'Doubled AP enrollment over 3 years through structured outreach and onboarding.' },
            { title: 'STEM Family Engagement', description: 'Built quarterly STEM nights now adopted across 8 sister schools.' },
            { title: 'Innovative Curriculum Award', description: 'Recognized regionally for the new K-12 enrichment curriculum.' },
          ],
        },
        {
          id: 'skills',
          title: 'Skills',
          type: SECTION_TYPES.LIST,
          items: [
            'Curriculum Development',
            'Educational Leadership',
            'Project-Based Learning',
            'Standardized Testing Prep',
            'Teacher Coaching',
          ],
        },
      ],
    },
  },

  /* ---------- 12. Multicolumn ---------- */
  {
    id: 'multicolumn',
    name: 'Multicolumn',
    thumb: 'col2',
    meta: 'Right sidebar, dense',
    layout: LAYOUTS.TWO_COLUMN,
    sidebarSide: 'right',
    design: {
      ...DEFAULT_DESIGN,
      template: 'multicolumn',
      accent: '#1f2330',
      fontFamily: 'Inter',
      pageBackground: '#ffffff',
      sidebarBackground: '#f6f7f9',
      sidebarText: '#1f2330',
      spacing: 0.95,
    },
    content: {
      header: {
        name: 'Luke Adams',
        headline: 'Senior Sales Professional · B2B Strategies · Client Acquisition',
        contact: 'luke@example.com • +1 415 555 0188 • San Antonio, TX',
      },
      main: [
        {
          id: 'experience',
          title: 'Experience',
          type: SECTION_TYPES.EXPERIENCE,
          items: [
            {
              company: 'Salestorm',
              location: 'San Antonio, TX',
              role: 'Senior Business Development Manager',
              dates: '06/2020 – Present',
              bullets: [
                'Spearheaded a sales surge by adopting AI-led B2B strategy; closed $4.2M in net new ARR in year one.',
                'Implemented a CRM rebuild that simplified the inside-sales workflow and saved 22 hours/week per rep.',
                'Cultivated relationships with key strategic partners that produced 18 referrals in the first 6 months.',
                'Designed and ran the regional ramp program; new-hire ramp time dropped from 5 → 3 months.',
              ],
            },
            {
              company: 'GrowthCorp',
              location: 'Austin, TX',
              role: 'Account Executive — SMB',
              dates: '06/2017 – 05/2020',
              bullets: [
                'Drove a 30% YoY pipeline lift through a new outbound motion built on intent data.',
                'Owned 70+ active accounts and grew net retention from 102% → 119%.',
              ],
            },
            {
              company: 'Account ExecuPlay',
              location: 'San Antonio, TX',
              role: 'Business Development Representative',
              dates: '06/2015 – 05/2017',
              bullets: [
                'Generated 110+ SQLs/quarter at top of funnel; consistently top-3 BDR on the team.',
              ],
            },
          ],
        },
      ],
      sidebar: [
        {
          id: 'education',
          title: 'Education',
          type: SECTION_TYPES.EDUCATION,
          items: [
            {
              degree: 'Master of Business Administration (MBA)',
              school: 'University of Texas at San Antonio',
              dates: '2013 – 2015',
            },
            {
              degree: 'Bachelor of Science in Marketing',
              school: 'Texas State University',
              dates: '2009 – 2013',
            },
          ],
        },
        {
          id: 'skills',
          title: 'Skills',
          type: SECTION_TYPES.LIST,
          items: ['Sales Strategy', 'CRM Systems', 'Lead Generation', 'Sales Forecasting', 'Business Development', 'Market Research', 'Salesforce'],
        },
        {
          id: 'certs',
          title: 'Certifications',
          type: SECTION_TYPES.LIST,
          items: [
            'Advanced Business Development Strategies and Techniques',
            'Salesforce Certified Sales Cloud Consultant',
          ],
        },
        {
          id: 'languages',
          title: 'Languages',
          type: SECTION_TYPES.LIST,
          items: ['English — Native', 'Spanish — Advanced'],
        },
      ],
    },
  },

  /* ---------- 13. Classic ---------- */
  {
    id: 'classic',
    name: 'Classic',
    thumb: '',
    meta: 'Single, conservative',
    layout: LAYOUTS.SINGLE,
    design: {
      ...DEFAULT_DESIGN,
      template: 'classic',
      accent: '#16b981',
      fontFamily: 'Source Serif 4',
      pageBackground: '#ffffff',
    },
    content: {
      header: {
        name: 'Scarlett Anderson',
        headline: 'Certified Public Accountant · Financial Analysis · Auditing',
        contact: 'scarlett@example.com • +1 415 555 0188 • San Jose, CA',
      },
      sections: [
        {
          id: 'summary',
          title: 'Summary',
          type: SECTION_TYPES.PARAGRAPH,
          body:
            'Dedicated CPA with 9 years of dedication to financial reporting and auditing standards. Today is the day to share a unique blend of professional ethics and analytical insight, with a focus on serving teams across audit and advisory.',
        },
        {
          id: 'experience',
          title: 'Experience',
          type: SECTION_TYPES.EXPERIENCE,
          items: [
            {
              company: 'Ledger Avenue',
              location: 'San Jose, CA',
              role: 'Senior Auditor',
              dates: '06/2019 – Present',
              bullets: [
                'Led a team of seven in completing financial audits and analyses for a diverse portfolio generating revenue of more than $50M.',
                'Identified key issues for financial-disclosure improvements based on benchmark testing.',
                'Conducted instructional training programs for risk-assessment topics that lifted team accuracy by 22%.',
              ],
            },
            {
              company: 'Audit Associates',
              location: 'San Jose, CA',
              role: 'Audit Associate',
              dates: '01/2017 – 05/2019',
              bullets: [
                'Participated in annual audits across 7 mid-market clients, leading the identification and resolution of misstatements.',
                'Assisted in the development of an in-process audit-tracker now adopted by 4 sister teams.',
                'Provided expert testimony on financial-matters auditing in 2 mid-market client cases.',
              ],
            },
            {
              company: 'Number Pros LLC',
              location: 'San Jose, CA',
              role: 'Financial Analyst',
              dates: '06/2014 – 12/2016',
              bullets: [
                'Analyzed and interpreted large data sets to give input on tax planning and operational decisions.',
                'Collaborated on the development of a financial-foresight tool that improved client experience and forecast precision by 15%.',
              ],
            },
          ],
        },
        {
          id: 'education',
          title: 'Education',
          type: SECTION_TYPES.EDUCATION,
          items: [
            { degree: 'Master of Science in Accountancy', school: 'University of California, Berkeley', dates: '2012 – 2014' },
            { degree: 'Bachelor of Science in Accounting', school: 'San Jose State University', dates: '2008 – 2012' },
          ],
        },
        {
          id: 'achievements',
          title: 'Key Achievements',
          type: SECTION_TYPES.ACHIEVEMENTS,
          items: [
            { title: 'Audit Efficiency Award', description: 'Reorganized the audit-prep template; cut prep time by 38% across 14 engagements.' },
            { title: 'Cost-Saving Initiative Implemented', description: 'Identified vendor-overlap that produced $300k in annual savings.' },
            {  title: 'Financial Forecast Model Development', description: 'Created the cross-segment forecast model now used in monthly leadership reviews.' },
            {  title: 'High-Accuracy Risk Assessment', description: 'Authored the risk-assessment rubric still in use across 4 audit teams.' },
          ],
        },
      ],
    },
  },

  /* ---------- 14. High Performer ---------- */
  {
    id: 'high-performer',
    name: 'High Performer',
    thumb: 'col2',
    meta: 'Two-col, projects table',
    layout: LAYOUTS.TWO_COLUMN,
    sidebarSide: 'right',
    design: {
      ...DEFAULT_DESIGN,
      template: 'high-performer',
      accent: '#0a7a3b',
      fontFamily: 'Inter',
      pageBackground: '#ffffff',
      sidebarBackground: '#f1f7f3',
      sidebarText: '#1f2330',
    },
    content: {
      header: {
        name: 'Isaac Hall',
        headline: 'Project Director · Global Health · Strategy & Funding',
        contact: 'isaac@example.com • +1 415 555 0188 • linkedin.com/in/isaacah • Washington, DC',
      },
      main: [
        {
          id: 'experience',
          title: 'Experience',
          type: SECTION_TYPES.EXPERIENCE,
          items: [
            {
              company: 'Global Health Initiative',
              location: 'Washington, DC',
              role: 'Project Director',
              dates: '06/2020 – Present',
              bullets: [
                'Directed the launch of a $4M public-health program in 5 countries; reduced disease-incidence by 12% over 18 months.',
                'Managed cross-functional teams across 4 time zones in delivery of a flagship vaccination project.',
                'Led a team of 18 program managers and instituted a global program-review cadence.',
                'Co-authored 3 funding proposals that secured $11M in multi-year donor commitments.',
              ],
            },
            {
              company: 'GlobalCares',
              location: 'New York, NY',
              role: 'Program Manager',
              dates: '01/2017 – 05/2020',
              bullets: [
                'Owned the rollout of a maternal-health initiative across 9 sub-Saharan markets.',
                'Developed the M&E framework now used as the org-standard impact rubric.',
              ],
            },
          ],
        },
        {
          id: 'projects',
          title: 'Projects',
          type: SECTION_TYPES.ACHIEVEMENTS,
          items: [
            { title: 'Vaccinate the World', description: 'Logistics + cold-chain rebuild that reached 1.2M children in 18 months.' },
            { title: 'Clean Water Initiative', description: 'Designed a community-led rollout that reached 220 villages.' },
          ],
        },
      ],
      sidebar: [
        {
          id: 'summary',
          title: 'Summary',
          type: SECTION_TYPES.PARAGRAPH,
          body:
            'Project director with a global health focus and 12+ years of running funder-backed programs. Comfortable owning the line item from RFP to retrospective.',
        },
        {
          id: 'achievements',
          title: 'Key Achievements',
          type: SECTION_TYPES.ACHIEVEMENTS,
          items: [
            { title: 'Lead Policy Development Initiative', description: 'Co-led a multi-stakeholder coalition that landed 2 country-wide health policies.' },
            { title: 'Secured Major Funding', description: 'Raised $11M in donor commitments from 4 multilateral funders in 18 months.' },
            { title: 'Delivered Senior Keynotes', description: 'Spoke at 6 industry conferences and ran 3 panels on impact measurement.' },
          ],
        },
        {
          id: 'education',
          title: 'Education',
          type: SECTION_TYPES.EDUCATION,
          items: [
            { degree: "Master's Degree in Public Health", school: 'Johns Hopkins University', dates: '2009 – 2011' },
            { degree: 'Bachelor of Science in Health Administration', school: 'University of Minnesota', dates: '2005 – 2009' },
          ],
        },
        {
          id: 'certs',
          title: 'Certifications',
          type: SECTION_TYPES.LIST,
          items: [
            'Advanced Project Management Certification — PMI',
            'Monitoring & Evaluation Specialist Certificate',
          ],
        },
      ],
    },
  },

  /* ---------- 15. Minimal ---------- */
  {
    id: 'minimal',
    name: 'Minimal',
    thumb: '',
    meta: 'Two-col, low chrome',
    layout: LAYOUTS.TWO_COLUMN,
    sidebarSide: 'right',
    design: {
      ...DEFAULT_DESIGN,
      template: 'minimal',
      accent: '#16b981',
      fontFamily: 'Inter',
      pageBackground: '#ffffff',
      sidebarBackground: '#fafbfc',
      sidebarText: '#1f2330',
      margins: 1.05,
    },
    content: {
      header: {
        name: 'Elise Carter',
        headline: 'Senior Backend Software Engineer · Python · C++',
        contact: 'elise@example.com • +1 415 555 0188 • Austin, TX',
      },
      main: [
        {
          id: 'summary',
          title: 'Summary',
          type: SECTION_TYPES.PARAGRAPH,
          body:
            'Experienced Senior Backend Software Engineer with a strong background in Python and C++ development. Successfully designed and led teams that performed backend systems, lifting reliability and shipping under hard deadlines across distributed services.',
        },
        {
          id: 'experience',
          title: 'Experience',
          type: SECTION_TYPES.EXPERIENCE,
          items: [
            {
              company: 'Healthflow Innovations',
              location: 'Austin, TX',
              role: 'Senior Backend Software Engineer',
              dates: '01/2021 – Present',
              bullets: [
                'Designed and implemented APIs to feed 6M+ transactions per day across 4 internal product teams.',
                'Optimized backend performance by improving up to 28% server speed while increasing concurrent user capacity by 33%.',
                'Co-led the rewrite of a legacy ETL system into an event-driven Python pipeline; cut latency from minutes to seconds.',
                'Implemented a CI/CD pipeline that brought test cycle time down from 19 → 4 minutes.',
              ],
            },
            {
              company: 'TechSphere',
              location: 'Austin, TX',
              role: 'Junior Software Engineer',
              dates: '06/2018 – 12/2020',
              bullets: [
                'Developed and supported new and legacy back-end software solutions across 3 internal teams.',
                'Implemented test coverage practices and reduced defect-rate by 25%.',
              ],
            },
          ],
        },
        {
          id: 'education',
          title: 'Education',
          type: SECTION_TYPES.EDUCATION,
          items: [
            {
              degree: "Master's Degree in Computer Science",
              school: 'University of Texas at Austin',
              dates: '2016 – 2018',
            },
          ],
        },
      ],
      sidebar: [
        {
          id: 'collaboration',
          title: 'Collaboration',
          type: SECTION_TYPES.PARAGRAPH,
          body:
            'Led cross-functional teams to deliver scalable systems and now mentoring 4 mid-level engineers in our development circle.',
        },
        {
          id: 'skills',
          title: 'Skills',
          type: SECTION_TYPES.LIST,
          items: [
            'Python · C++ · Go',
            'Amazon AWS Services',
            'PostgreSQL · NoSQL',
            'Terraform · Kubernetes',
            'Microservices · Confluence',
            'Git',
          ],
        },
        {
          id: 'achievements',
          title: 'Key Achievements',
          type: SECTION_TYPES.ACHIEVEMENTS,
          items: [
            { title: 'HotDox Data Visualization Tool', description: 'Built a tool now used by 3 product teams for live customer-data dashboards.' },
            { title: 'Automated Testing Framework', description: 'Wrote the framework now adopted as the team-wide testing standard.' },
          ],
        },
      ],
    },
  },
]

/* =========================================================
   Helpers
========================================================= */

export function getTemplateById(id) {
  return RESUME_TEMPLATES.find((t) => t.id === id)
    || RESUME_TEMPLATES.find((t) => t.id === 'ivy')
    || RESUME_TEMPLATES[0]
}

export function cloneTemplate(template) {
  return JSON.parse(JSON.stringify(template))
}
