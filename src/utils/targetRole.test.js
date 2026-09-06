import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  cleanJobSearchQuery,
  cleanTargetRole,
  splitConcatenatedWords,
} from './targetRole.js'

describe('splitConcatenatedWords', () => {
  it('inserts a space between smashed role titles', () => {
    assert.equal(
      splitConcatenatedWords('Soft developerFrontend developer'),
      'Soft developer Frontend developer',
    )
  })
})

describe('cleanJobSearchQuery', () => {
  it('extracts Frontend developer from the founder mash', () => {
    assert.equal(
      cleanJobSearchQuery('Sof developer Soft developerFrontend developer'),
      'Frontend developer',
    )
  })

  it('keeps a short clean role', () => {
    assert.equal(cleanJobSearchQuery('SDE intern'), 'SDE intern')
  })

  it('pulls SDE out of a long headline', () => {
    assert.equal(
      cleanJobSearchQuery('B.Tech CS · aspiring SDE at Google | React, TS'),
      'SDE',
    )
  })

  it('drops a truncated Sof prefix before developer', () => {
    assert.equal(cleanJobSearchQuery('Sof developer'), 'Developer')
  })
})

describe('cleanTargetRole', () => {
  it('prefers preferredRole over a mashed headline', () => {
    assert.equal(
      cleanTargetRole({
        headline: 'Sof developer Soft developerFrontend developer',
        preferences: { preferredRole: 'Frontend developer' },
      }),
      'Frontend developer',
    )
  })

  it('cleans a mashed headline when preferredRole is empty', () => {
    assert.equal(
      cleanTargetRole({
        headline: 'Sof developer Soft developerFrontend developer',
        preferences: { preferredRole: '' },
      }),
      'Frontend developer',
    )
  })

  it('falls back for an empty profile', () => {
    assert.equal(cleanTargetRole({}), 'Software engineer')
    assert.equal(cleanTargetRole({ isFresher: true }), 'Fresher internship')
  })
})
