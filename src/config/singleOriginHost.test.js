import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  isFirebasePreviewChannel,
  keepsMarketingAndAppOnOrigin,
  pathIfProductionNavigation,
} from './singleOriginHost.js'

const PREVIEW = 'glowminds-abc84--redesign-qafix-tgy14j7r.web.app'

describe('firebase preview channels', () => {
  it('matches {site}--{channel}.web.app only', () => {
    assert.equal(isFirebasePreviewChannel(PREVIEW), true)
    assert.equal(isFirebasePreviewChannel('glowminds-abc84--redesign-qafix-tgy14j7r.firebaseapp.com'), true)
    assert.equal(isFirebasePreviewChannel('glowminds-abc84.web.app'), false)
    assert.equal(isFirebasePreviewChannel('glowminds-abc84.firebaseapp.com'), false)
    assert.equal(isFirebasePreviewChannel('glowminds-app.web.app'), false)
    assert.equal(isFirebasePreviewChannel('glowminds-app.firebaseapp.com'), false)
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

describe('pathIfProductionNavigation', () => {
  const previewHref = `https://${PREVIEW}/login`

  it('keeps a signed-in preview dashboard hop on this origin', () => {
    assert.equal(
      pathIfProductionNavigation('https://app.glowminds.in/dashboard', previewHref),
      '/dashboard',
    )
    assert.equal(
      pathIfProductionNavigation('https://app.glowminds.in/dashboard?tab=1#usage', previewHref),
      '/dashboard?tab=1#usage',
    )
    assert.equal(
      pathIfProductionNavigation('https://glowminds.in/about/', previewHref),
      '/about/',
    )
  })

  it('does not rewrite production host split or Firebase auth handlers', () => {
    assert.equal(
      pathIfProductionNavigation('https://app.glowminds.in/dashboard', 'https://glowminds.in/login'),
      null,
    )
    assert.equal(
      pathIfProductionNavigation('https://glowminds.in/about/', 'https://app.glowminds.in/dashboard'),
      null,
    )
    assert.equal(
      pathIfProductionNavigation(
        'https://glowminds-abc84.firebaseapp.com/__/auth/handler?apiKey=1',
        previewHref,
      ),
      null,
    )
    assert.equal(
      pathIfProductionNavigation('https://accounts.google.com/o/oauth2/auth', previewHref),
      null,
    )
    assert.equal(
      pathIfProductionNavigation('/dashboard', previewHref),
      null,
    )
  })

  it('rewrites when the env flag forces a single origin on production', () => {
    assert.equal(
      pathIfProductionNavigation('https://app.glowminds.in/dashboard', 'https://glowminds.in/login', {
        disableHostRedirect: true,
      }),
      '/dashboard',
    )
  })
})
