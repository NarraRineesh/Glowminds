import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buildQueryHeader, cleanHeadlineQuery } from './queryHeaderCore.js'

describe('cleanHeadlineQuery', () => {
  it('cleans the founder mash', () => {
    assert.equal(
      cleanHeadlineQuery('Sof developer Soft developerFrontend developer'),
      'Frontend developer',
    )
  })
})

describe('buildQueryHeader', () => {
  it('does not append skills into q', () => {
    const header = buildQueryHeader({
      headline: 'Sof developer Soft developerFrontend developer',
      skills: ['React', 'TypeScript'],
    })
    assert.equal(header.q, 'Frontend developer')
    assert.ok(!header.q.includes('with skills'))
  })

  it('prefers preferredRole', () => {
    const header = buildQueryHeader({
      headline: 'Student at XYZ',
      preferredRole: 'Frontend developer',
      skills: ['React'],
    })
    assert.equal(header.q, 'Frontend developer')
  })
})
