import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { isDashboardHome, shouldGoBack } from './nativeBack.js'

describe('native back', () => {
  it('treats the dashboard home as the stack root', () => {
    assert.equal(isDashboardHome('/dashboard'), true)
    assert.equal(isDashboardHome('/dashboard/'), true)
    assert.equal(isDashboardHome('/'), true)
    assert.equal(isDashboardHome('/dashboard/jobs'), false)
  })

  it('goes back on inner pages when the webview or the router can', () => {
    assert.equal(shouldGoBack({ pathname: '/dashboard/jobs', canGoBack: true, historyIndex: 0 }), true)
    assert.equal(shouldGoBack({ pathname: '/dashboard/jobs', historyIndex: 2 }), true)
    assert.equal(shouldGoBack({ pathname: '/login', historyLength: 2 }), true)
  })

  it('does not leave the dashboard home, even if history.length stayed high', () => {
    assert.equal(shouldGoBack({
      pathname: '/dashboard',
      canGoBack: true,
      historyLength: 4,
      historyIndex: 2,
    }), false)
  })

  it('stays put on an inner page that has no back entry', () => {
    assert.equal(shouldGoBack({
      pathname: '/dashboard/jobs',
      canGoBack: false,
      historyLength: 4,
      historyIndex: 0,
    }), false)
    assert.equal(shouldGoBack({ pathname: '/settings', historyLength: 1 }), false)
  })
})
