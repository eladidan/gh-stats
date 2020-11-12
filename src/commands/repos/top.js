const _ = require('lodash')
const {flags} = require('@oclif/command')

const octokit = require('../../lib/octokit')

const BaseCommand = require('../base')

async function assignPullRequestCount(org, repo) {
  const prs = await octokit.paginate(octokit.search.issuesAndPullRequests, {q: `repo:${org}/${repo.name}+type:pr`})

  repo.numberOfPullRequests = prs.length
}

async function getTopRepos({number, org, sortBy}) {
  const sortByFunctions = {
    'pull-requests': repo => repo.numberOfPullRequests,
    'contribution-percentage': repo => repo.forks_count === 0 ? Infinity : repo.numberOfPullRequests / repo.forks_count,
  }
  const q = `org:${org}`
  let repos
  switch (sortBy) {
  case 'forks':
  case 'stars':
    repos = await octokit.paginate(octokit.search.repos, {q, sort: sortBy, order: 'desc'})
    break
  case 'pull-requests':
  case 'contribution-percentage':
    // Github API v3 does not allow sorting by number of pull requests. So we need to fetch all pull-requests for every repo in the org, and sort
    repos = await octokit.paginate(octokit.search.repos, {q})
    await Promise.all(repos.map(repo => assignPullRequestCount(org, repo)))
    repos = _.chain(repos)
    .orderBy(sortByFunctions[sortBy], 'desc')
    .value()
    break
  }

  return _.chain(repos)
  .map('name')
  .slice(0, number)
  .value()
}

class TopCommand extends BaseCommand {
  async run() {
    const {number, org, 'sort-by': sortBy} = this.flags

    const topRepos = await getTopRepos({number, org, sortBy})
    console.log(JSON.stringify(topRepos, null, 2))
  }
}

TopCommand.description = `
List top repositories by different sort criteria
`

TopCommand.flags = {
  ...BaseCommand.flags,
  number: flags.integer({char: 'n', description: 'Number of repositories to list', default: 10, required: false}),
  'sort-by': flags.enum({char: 's', description: 'Sort criteria by which to list top repos', options: ['stars', 'forks', 'pull-requests', 'contribution-percentage'], required: true}),
}

module.exports = TopCommand
