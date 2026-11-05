import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { resolveTemplateAllowance } from './templateAccess.js'

const proPlan = {
  id: '0d48f2a9c1e7b653',
  key: 'yearly',
  tier: 'pro',
  limits: { applications: -1, resumes: -1, template: null },
}

describe('resolveTemplateAllowance', () => {
  it('does not collapse a null Pro template limit to the free template', () => {
    const entitlements = {
      isPro: true,
      planId: proPlan.id,
      plans: [proPlan],
      limits: { template: 'onyx' },
      freeLimits: { template: 'onyx' },
    }
    assert.equal(resolveTemplateAllowance(entitlements, true), null)
  })

  it('keeps an explicit multi-template allow-list', () => {
    const entitlements = {
      isPro: true,
      planId: 'pro-multi',
      plans: [{
        id: 'pro-multi',
        tier: 'pro',
        limits: { template: ['ditto', 'kakuna'] },
      }],
      limits: { template: 'onyx' },
    }
    assert.deepEqual(resolveTemplateAllowance(entitlements, true), ['ditto', 'kakuna'])
  })

  it('gives Free only the configured free template', () => {
    assert.equal(
      resolveTemplateAllowance({ freeLimits: { template: 'kakuna' }, limits: { template: 'onyx' } }, false),
      'kakuna',
    )
    assert.equal(resolveTemplateAllowance(null, false), 'onyx')
  })

  it('unlocks every template for Pro when the plan row is missing', () => {
    assert.equal(resolveTemplateAllowance({ isPro: true, limits: { template: 'onyx' } }, true), null)
  })
})
