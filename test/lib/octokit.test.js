const {assert, expect, test} = require('@oclif/test')
const decache = require('decache')
const {Octokit} = require('@octokit/rest')

let octokit = require('../../src/lib/octokit')

describe('octokit', () => {
  test
  .it('returns an octokit instance', () => {
    expect(octokit).to.be.an.instanceOf(Octokit)
  })

  test
  .stderr()
  .nock('https://api.github.com', api => {
    return api
    .get('/search/repositories')
    .query({
      q: 'q',
    })
    .times(2)
    .reply(403, undefined, {
      'X-RateLimit-Limit': 60,
      'X-RateLimit-Remaining': 0,
      'X-RateLimit-Reset': new Date().getTime(),
    })
    .get('/search/repositories')
    .query({
      q: 'q',
    })
    .reply(200, {
      // eslint-disable-next-line camelcase
      total_count: 40,
      // eslint-disable-next-line camelcase
      incomplete_results: false,
      items: [],
    })
  })
  .it('retries twice on rate limit', async ctx => {
    // re-require octokit to reset rate limit cache
    decache('../../src/lib/octokit')
    octokit = require('../../src/lib/octokit')

    const response = await octokit.search.repos({q: 'q'})
    expect(response.data.items).to.deep.equal([])
    expect(ctx.stderr).to.contain(`Request quota exhausted for request GET /search/repositories
Retrying after 0 seconds!
Request quota exhausted for request GET /search/repositories
Retrying after 0 seconds!`)
  })

  test
  .stderr()
  .nock('https://api.github.com', api => {
    return api
    .get('/search/repositories')
    .query({
      q: 'q',
    })
    .times(3)
    .reply(403, undefined, {
      'X-RateLimit-Limit': 60,
      'X-RateLimit-Remaining': 0,
      'X-RateLimit-Reset': new Date().getTime(),
    })
  })
  .it('gives up ater 3 tries', async ctx => {
    // re-require octokit to reset rate limit cache
    decache('../../src/lib/octokit')

    octokit = require('../../src/lib/octokit')
    try {
      await octokit.search.repos({q: 'q'})
      assert.fail()
    } catch (error) {
      // swallow, we expect this to fail
    }
    expect(ctx.stderr).to.contain(`Request quota exhausted for request GET /search/repositories
Retrying after 0 seconds!
Request quota exhausted for request GET /search/repositories
Retrying after 0 seconds!
Request quota exhausted for request GET /search/repositories`)
  })

  test
  .stderr()
  .nock('https://api.github.com', api => {
    return api
    .get('/search/repositories')
    .query({
      q: 'q',
    })
    .reply(403, {
      message: 'You have triggered an abuse detection mechanism and have been temporarily blocked from content creation. Please retry your request again later.',
      // eslint-disable-next-line camelcase
      documentation_url: 'https://developer.github.com/v3/#abuse-rate-limits',
    }, {
      Connection: 'close',
    })
  })
  .it('gives up immediately on abuse', async ctx => {
    // re-require octokit to reset rate limit cache
    decache('../../src/lib/octokit')
    octokit = require('../../src/lib/octokit')

    try {
      await octokit.search.repos({q: 'q'})
      assert.fail()
    } catch (error) {
      // swallow, we expect this to fail
    }
    expect(ctx.stderr).to.contain('Abuse detected for request GET /search/repositories')
  })
})
