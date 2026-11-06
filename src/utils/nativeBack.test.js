import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import {
  inAppDepth,
  isDashboardHome,
  nextBackAction,
  noteNavigation,
  resetInAppHistory,
  shouldGoBack,
} from './nativeBack.js'

describe('native back', () => {
  beforeEach(() => {
    resetInAppHistory()
  })

  it('treats the dashboard home as the stack root when no in-app depth is known', () => {
    assert.equal(isDashboardHome('/dashboard'), true)
    assert.equal(isDashboardHome('/dashboard/'), true)
    assert.equal(isDashboardHome('/'), true)
    assert.equal(isDashboardHome('/dashboard/jobs'), false)
  })

  it('goes back on inner pages when the router has a previous entry', () => {
    assert.equal(shouldGoBack({ pathname: '/dashboard/jobs', historyIndex: 2 }), true)
    assert.equal(shouldGoBack({ pathname: '/login', historyLength: 2 }), true)
  })

  it('does not pop the remote document just because the webview can go back', () => {
    assert.equal(shouldGoBack({
      pathname: '/dashboard/jobs',
      canGoBack: true,
      historyLength: 2,
      historyIndex: 0,
    }), false)
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

  it('keeps login → dashboard as one entry and pops a later section', () => {
    assert.equal(noteNavigation({ pathname: '/', key: 'boot', navType: 'POP' }), 1)
    assert.equal(noteNavigation({ pathname: '/login', key: 'login', navType: 'REPLACE' }), 1)
    assert.equal(noteNavigation({ pathname: '/dashboard', key: 'home', navType: 'REPLACE' }), 1)
    assert.equal(shouldGoBack({ pathname: '/dashboard', inAppDepth: inAppDepth(), canGoBack: true }), false)

    assert.equal(noteNavigation({ pathname: '/dashboard/jobs', key: 'jobs', navType: 'PUSH' }), 2)
    assert.equal(shouldGoBack({
      pathname: '/dashboard/jobs',
      inAppDepth: inAppDepth(),
      canGoBack: false,
      historyIndex: 0,
    }), true)

    assert.equal(noteNavigation({ pathname: '/dashboard', key: 'home-again', navType: 'PUSH' }), 3)
    assert.equal(shouldGoBack({ pathname: '/dashboard', inAppDepth: inAppDepth(), canGoBack: true }), true)

    assert.equal(noteNavigation({ pathname: '/dashboard/jobs', key: 'jobs', navType: 'POP' }), 2)
    assert.equal(inAppDepth(), 2)
  })

  it('does not grow the stack when the same entry is noted twice', () => {
    noteNavigation({ pathname: '/dashboard', key: 'home', navType: 'POP' })
    noteNavigation({ pathname: '/dashboard', key: 'home', navType: 'POP' })
    noteNavigation({ pathname: '/dashboard/jobs', key: 'jobs', navType: 'PUSH' })
    noteNavigation({ pathname: '/dashboard/jobs', key: 'jobs', navType: 'PUSH' })
    assert.equal(inAppDepth(), 2)
  })

  it('arms leaving from the root and goes back from an inner page', () => {
    assert.deepEqual(nextBackAction({
      pathname: '/dashboard/jobs',
      inAppDepth: 2,
      now: 1_000,
      armedUntil: 5_000,
    }), { type: 'back', armedUntil: 0 })

    assert.deepEqual(nextBackAction({
      pathname: '/dashboard',
      inAppDepth: 1,
      canGoBack: true,
      now: 1_000,
      armedUntil: 0,
    }), { type: 'arm', armedUntil: 3_000 })

    assert.deepEqual(nextBackAction({
      pathname: '/dashboard',
      inAppDepth: 1,
      now: 2_000,
      armedUntil: 3_000,
    }), { type: 'leave', armedUntil: 3_000 })
  })
})
