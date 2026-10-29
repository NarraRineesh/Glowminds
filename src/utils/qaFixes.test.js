import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { isJunkLabel, isNoiseTrendSkill } from './jobFilters.js'
import { matchSalaryRole } from './salaryInsights.js'
import { sessionPercent } from './interviewScore.js'
import { localDateInputValue } from './localDate.js'
import { isNoiseSkillName, sanitizeSkillGap, skillsReferToSame } from './skillRelevance.js'
import { vaultFileRejection } from './vaultFiles.js'
import { buildJobMatchAnalysis } from './jobMatchAnalysis.js'
import { phoneValidationError } from './phone.js'
import { defaultJobQuery, hasCareerSignals, needsCareerSetup } from './targetRole.js'

describe('new user job query and scores', () => {
  it('uses fresher level instead of a senior software-engineer default', () => {
    assert.equal(defaultJobQuery({ careerLevel: 'fresher', isFresher: true }), 'intern')
    assert.equal(defaultJobQuery({ careerLevel: 'fresher', headline: 'SDE intern' }), 'SDE intern')
    assert.equal(defaultJobQuery({ careerLevel: 'fresher', headline: 'Frontend engineer' }), 'Frontend engineer intern')
    assert.equal(defaultJobQuery({ careerLevel: 'fresher', preferences: { preferredRole: 'Frontend engineer' } }), 'Frontend engineer intern')
    assert.equal(defaultJobQuery({ careerLevel: '2-5', preferences: { preferredRole: 'Backend engineer' } }), 'Backend engineer')
    assert.equal(defaultJobQuery({ careerLevel: '0-2' }), 'junior')
    assert.equal(defaultJobQuery({}), 'intern')
  })

  it('asks for career setup until both a level and a role are saved', () => {
    assert.equal(needsCareerSetup({}), true)
    assert.equal(needsCareerSetup({ careerLevel: 'fresher' }), true)
    assert.equal(needsCareerSetup({ headline: 'SDE intern' }), true)
    assert.equal(needsCareerSetup({ careerLevel: 'fresher', preferences: { preferredRole: 'SDE intern' } }), false)
    assert.equal(needsCareerSetup({ careerLevel: '0-2', headline: 'Junior analyst' }), false)
  })

  it('does not treat a Google name alone as career data', () => {
    assert.equal(hasCareerSignals({ headline: '', skills: { technical: [] } }), false)
    assert.equal(hasCareerSignals({ headline: 'SDE intern' }), true)
  })
})

describe('job trend junk', () => {
  it('drops domains and single-letter skills', () => {
    assert.equal(isJunkLabel('Careers.dollartree.com'), true)
    assert.equal(isJunkLabel('FA EWJT Saasfaprod1.fa.ocs.oraclecloud.com'), true)
    assert.equal(isNoiseTrendSkill('R'), true)
    assert.equal(isNoiseTrendSkill('Go'), true)
    assert.equal(isNoiseTrendSkill('React'), false)
  })
})

describe('salary role match', () => {
  it('does not fall back to the first table row', () => {
    assert.equal(matchSalaryRole(['Data Analyst', 'Backend Engineer'], 'Frontend developer'), '')
    assert.equal(matchSalaryRole(['Frontend Engineer', 'Backend Engineer'], 'Frontend developer'), 'Frontend Engineer')
  })
})

describe('interview percent', () => {
  it('uses correct/total instead of the raw score', () => {
    assert.equal(sessionPercent({ totalScore: 16, questions: Array.from({ length: 20 }, () => ({ isCorrect: false })) }), 80)
    assert.equal(sessionPercent({ totalScore: 16 }), null)
  })
})

describe('local date', () => {
  it('uses the local calendar day', () => {
    const value = localDateInputValue(new Date(2026, 9, 29, 0, 30))
    assert.equal(value, '2026-10-29')
  })
})

describe('skill gap sanitizing', () => {
  it('drops short tokens and off-role skills for frontend', () => {
    assert.equal(isNoiseSkillName('R'), true)
    assert.equal(skillsReferToSame('react', 'r'), false)
    assert.equal(skillsReferToSame('JavaScript', 'javascript'), true)
    const gap = sanitizeSkillGap({
      targetRole: 'Frontend developer',
      coverage: 13,
      haveSkills: [{ name: 'R', jobCount: 222, importanceScore: 50, category: 'Frontend' }],
      missingSkills: [
        { name: 'Excel', jobCount: 40, importanceScore: 50, category: 'Frontend' },
        { name: 'React', jobCount: 80, importanceScore: 50, category: 'Frontend' },
        { name: 'SAP', jobCount: 10, importanceScore: 50, category: 'Frontend' },
      ],
    }, { skills: { technical: ['React', 'JavaScript'], soft: [] } })
    const names = [...gap.haveSkills, ...gap.missingSkills].map((row) => row.name.toLowerCase())
    assert.equal(names.includes('r'), false)
    assert.equal(names.includes('excel'), false)
    assert.equal(names.includes('sap'), false)
    assert.equal(names.includes('react'), true)
    assert.ok(gap.coverage > 13)
  })
})

describe('job skill match', () => {
  it('does not list the same skill as both a match and a gap', () => {
    const analysis = buildJobMatchAnalysis(
      { title: 'Frontend', tags: ['JavaScript', 'javascript', 'React'], description: '' },
      { headline: 'Frontend developer', skills: { technical: ['JavaScript', 'React'], soft: [] } },
    )
    const matched = analysis.matchedSkills.map((s) => s.toLowerCase())
    const missing = analysis.missingSkills.map((s) => s.toLowerCase())
    assert.deepEqual(matched.sort(), ['javascript', 'react'])
    assert.equal(missing.length, 0)
    assert.equal(analysis.skillMatchCount, 2)
  })
})

describe('vault uploads', () => {
  it('rejects executables and files over 5 MB', () => {
    assert.match(vaultFileRejection({ name: 'setup.exe', size: 1000 }), /isn’t allowed/)
    assert.match(vaultFileRejection({ name: 'resume.pdf', size: 6 * 1024 * 1024 }), /maximum/i)
    assert.equal(vaultFileRejection({ name: 'resume.pdf', size: 1024 }), null)
  })
})

describe('phone', () => {
  it('allows empty and rejects short numbers', () => {
    assert.equal(phoneValidationError(''), null)
    assert.ok(phoneValidationError('12345'))
    assert.equal(phoneValidationError('+91 98765 43210'), null)
  })
})
