import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  isFirebasePreviewChannel,
  keepsMarketingAndAppOnOrigin,
} from './singleOriginHost.js'

const PREVIEW = 'glowminds-abc84--redesign-qafix-tgy14j7r.web.app'

describe('firebase preview channels', () => {
  it('matches {site}--{channel}.web.app only', () => {
    assert.equal(isFirebasePreviewChannel(PREVIEW), true)
    assert.equal(isFirebasePreviewChannel('glowminds-abc84.web.app'), false)
    assert.equal(isFirebasePreviewChannel('glowminds.in'), false)
    assert.equal(isFirebasePreviewChannel('www.glowminds.in'), false)
    assert.equal(isFirebasePreviewChannel('app.glowminds.in'), false)
    assert.equal(isFirebasePreviewChannel('evil--x.web.app.attacker.com'), false)
  })
})

describe('keepsMarketingAndAppOnOrigin', () => {
  it('keeps localhost and preview channels on one origin', () => {
    assert.equal(keepsMarketingAndAppOnOrigin('localhost'), true)
    assert.equal(keepsMarketingAndAppOnOrigin('127.0.0.1'), true)
    assert.equal(keepsMarketingAndAppOnOrigin(PREVIEW), true)
  })

  it('does not change production hosts unless the env flag is set', () => {
    assert.equal(keepsMarketingAndAppOnOrigin('glowminds.in'), false)
    assert.equal(keepsMarketingAndAppOnOrigin('www.glowminds.in'), false)
    assert.equal(keepsMarketingAndAppOnOrigin('app.glowminds.in'), false)
    assert.equal(keepsMarketingAndAppOnOrigin('glowminds-abc84.web.app'), false)
    assert.equal(keepsMarketingAndAppOnOrigin('glowminds.in', { disableHostRedirect: true }), true)
    assert.equal(keepsMarketingAndAppOnOrigin('app.glowminds.in', { disableHostRedirect: true }), true)
  })
})
