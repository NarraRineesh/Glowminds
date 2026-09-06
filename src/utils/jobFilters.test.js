import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  catalogSearchParams,
  jobMatchesCountry,
} from './jobFilters.js'

describe('catalogSearchParams', () => {
  it('sends India as country=India', () => {
    assert.deepEqual(catalogSearchParams('India'), { country: 'India' })
  })

  it('maps UAE to the catalog country name', () => {
    assert.deepEqual(catalogSearchParams('UAE'), { country: 'United Arab Emirates' })
  })

  it('sends Remote as work_mode', () => {
    assert.deepEqual(catalogSearchParams('Remote'), { work_mode: 'remote' })
  })

  it('sends nothing for All countries', () => {
    assert.deepEqual(catalogSearchParams(''), {})
  })
})

describe('jobMatchesCountry', () => {
  it('matches India via country field and ISO suffix', () => {
    assert.equal(jobMatchesCountry({ location: 'Hyderabad, Telangana, India' }, 'India'), true)
    assert.equal(jobMatchesCountry({ country: 'India', location: '' }, 'India'), true)
    assert.equal(jobMatchesCountry({ country: 'IN', location: 'Bengaluru' }, 'India'), true)
    assert.equal(jobMatchesCountry({ location: 'Pune, IN' }, 'India'), true)
  })

  it('does not treat "in" inside other words as India', () => {
    assert.equal(jobMatchesCountry({ location: 'Remote in Texas', country: 'United States' }, 'India'), false)
    assert.equal(jobMatchesCountry({ location: 'Indiana, United States' }, 'India'), false)
  })

  it('does not keep a US SOF hit when India is selected', () => {
    assert.equal(
      jobMatchesCountry({ title: 'Program Manager - SOF RACER', location: 'Arlington', country: 'United States' }, 'India'),
      false,
    )
  })
})
