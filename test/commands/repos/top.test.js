const url = require('url')

const _ = require('lodash')
const {expect, test} = require('@oclif/test')
const requireDir = require('require-dir')

const samples = requireDir('../../samples', {recurse: true})

describe('repos', () => {
  test
  .stderr()
  .command(['repos:top', '--sort-by', 'stars'])
  .catch(error => {
    expect(error.oclif.exit).to.equal(2)
    expect(error.message).to.contain('Missing required flag:')
    expect(error.message).to.contain('-o, --org')
    expect(error.message).to.contain('See more help with --help')
  })
  .it('fails when --org is not passed')

  test
  .stderr()
  .command(['repos:top', '--org', 'netflix'])
  .catch(error => {
    expect(error.oclif.exit).to.equal(2)
    expect(error.message).to.contain('Missing required flag:')
    expect(error.message).to.contain('-s, --sort-by')
    expect(error.message).to.contain('See more help with --help')
  })
  .it('fails when --sort-by is not passed')

  test
  .nock('https://api.github.com', api => {
    return api
    .get('/search/repositories')
    .query({
      q: 'org:netflix',
      sort: 'stars',
      order: 'desc',
    })
    .reply(200, samples.search.reposByStars)
  })
  .stdout()
  .command(['repos:top', '--org', 'netflix', '--sort-by', 'stars'])
  .it('sorts by stars', ctx => {
    const output = JSON.parse(ctx.stdout)
    expect(output).to.deep.equal(_.range(1, 11).map(i => `repo${i}`))
  })

  test
  .nock('https://api.github.com', api => {
    return api
    .get('/search/repositories')
    .query({
      q: 'org:netflix',
      sort: 'stars',
      order: 'desc',
    })
    .reply(200, samples.search.reposByStars)
  })
  .stdout()
  .command(['repos:top', '--org', 'netflix', '--sort-by', 'stars', '-n', '50'])
  .it('returns fefwer results than asked if none are available', ctx => {
    const output = JSON.parse(ctx.stdout)
    expect(output).to.deep.equal(_.range(1, 11).map(i => `repo${i}`))
  })

  test
  .nock('https://api.github.com', api => {
    return api
    .get('/search/repositories')
    .query({
      q: 'org:netflix',
      sort: 'stars',
      order: 'desc',
    })
    .reply(200, samples.search.reposByStars)
  })
  .stdout()
  .command(['repos:top', '--org', 'netflix', '--sort-by', 'stars', '-n', '1'])
  .it('returns exacly n results even when more are returned from API', ctx => {
    const output = JSON.parse(ctx.stdout)
    expect(output).to.deep.equal(['repo1'])
  })

  test
  .nock('https://api.github.com', api => {
    return api
    .get('/search/repositories')
    .query({
      q: 'org:netflix',
      sort: 'forks',
      order: 'desc',
    })
    .reply(200, samples.search.reposByForks)
  })
  .stdout()
  .command(['repos:top', '--org', 'netflix', '--sort-by', 'forks'])
  .it('sorts by forks', ctx => {
    const output = JSON.parse(ctx.stdout)
    expect(output).to.deep.equal(_.range(1, 11).map(i => `repo${i}`))
  })

  test
  .nock('https://api.github.com', api => {
    return api
    .get('/search/repositories')
    .query({
      q: 'org:netflix',
    })
    .reply(200, samples.search.repos3)
    .get('/search/issues')
    .query(true)
    .times(3)
    .reply(200, function () {
      const q = new url.URL(this.req.path, 'https://api.github.com').searchParams.get('q')
      const {repo} = q.match(/repo:netflix\/(?<repo>.+) type:pr/).groups
      return samples.search[`prsFor${_.upperFirst(repo)}`]
    })
  })
  .stdout()
  .command(['repos:top', '--org', 'netflix', '--sort-by', 'pull-requests'])
  .it('sorts by pull-requests', ctx => {
    const output = JSON.parse(ctx.stdout)
    expect(output).to.deep.equal(['repo3', 'repo2', 'repo1'])
  })

  test
  .nock('https://api.github.com', api => {
    return api
    .get('/search/repositories')
    .query({
      q: 'org:netflix',
    })
    .reply(200, samples.search.repos3)
    .get('/search/issues')
    .query(true)
    .times(3)
    .reply(200, function () {
      const q = new url.URL(this.req.path, 'https://api.github.com').searchParams.get('q')
      const {repo} = q.match(/repo:netflix\/(?<repo>.+) type:pr/).groups
      return samples.search[`prsFor${_.upperFirst(repo)}`]
    })
  })
  .stdout()
  .command(['repos:top', '--org', 'netflix', '--sort-by', 'contribution-percentage'])
  .it('sorts by contribution-percentage', ctx => {
    const output = JSON.parse(ctx.stdout)
    expect(output).to.deep.equal(['repo1', 'repo2', 'repo3'])
  })

  test
  .nock('https://api.github.com', api => {
    return api
    .get('/search/repositories')
    .query({
      q: 'org:netflix',
      sort: 'stars',
      order: 'desc',
    })
    .reply(200, samples.search.reposPagedPage1, {Link: '<https://api.github.com/search/repositories?q=org%3Anetflix&sort=stars&order=desc&page=2>; rel="next",<https://api.github.com/search/repositories?q=org%3Anetflix&sort=stars&order=desc&page=2>; rel="last"'})
    .get('/search/repositories')
    .query({
      q: 'org:netflix',
      sort: 'stars',
      order: 'desc',
      page: '2',
    })
    .reply(200, samples.search.reposPagedPage2, {Link: '<https://api.github.com/search/repositories?q=org%3Anetflix&sort=stars&order=desc&page=2>; rel="last"'})
  })
  .stdout()
  .command(['repos:top', '--org', 'netflix', '--sort-by', 'stars'])
  .it('handles paging', ctx => {
    const output = JSON.parse(ctx.stdout)
    expect(output).to.deep.equal(['repo1', 'repo2'])
  })
})
