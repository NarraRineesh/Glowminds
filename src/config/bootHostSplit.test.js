import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8')

describe('index.html boot host split', () => {
  it('skips redirects on preview channels and the env flag', () => {
    assert.match(html, /--\.\*\\.web\\.app\$/)
    assert.match(html, /--\.\*\\.firebaseapp\\.com\$/)
    assert.match(html, /%DISABLE_HOST_REDIRECT%/)
    assert.match(html, /if \(!singleOrigin\)/)
    assert.match(html, /window\.__gmOriginGuard/)
    assert.match(html, /'app\.glowminds\.in': 1/)
    assert.match(html, /dest\.pathname\.indexOf\('\/__\/'\) === 0/)
  })

  it('still sends production app paths to APP_URL and marketing paths to SITE_URL', () => {
    assert.match(html, /location\.replace\('%APP_URL%' \+ rest\)/)
    assert.match(html, /location\.replace\('%SITE_URL%' \+ rest\)/)
    assert.match(html, /\['\/resume','\/dashboard\/resume'\]/)
    assert.match(html, /\['\/applications','\/dashboard\/applications'\]/)
    assert.match(html, /\['\/settings','\/dashboard\/settings'\]/)
    assert.match(html, /singleOrigin \|\| isApp/)
    assert.match(html, /host === 'app\.glowminds\.in'/)
    assert.match(html, /host === 'www\.glowminds\.in'/)
    assert.match(html, /host === 'glowminds-abc84\.web\.app'/)
  })
})
