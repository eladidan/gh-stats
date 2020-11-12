const {Octokit} = require('@octokit/rest')
const {throttling} = require('@octokit/plugin-throttling')
const {retry} = require('@octokit/plugin-retry')
const OctokitWithPlugins = Octokit.plugin(throttling, retry)
const config = require('../config')

const octokit = new OctokitWithPlugins({
  auth: config.github.auth.token,
  throttle: {
    onRateLimit: (retryAfter, options) => {
      octokit.log.warn(
        `Request quota exhausted for request ${options.method} ${options.url}`
      )

      // Retry twice after hitting a rate limit error, then give up
      if (options.request.retryCount < 2) {
        octokit.log.warn(`Retrying after ${retryAfter} seconds!`)
        return true
      }
    },
    onAbuseLimit: (retryAfter, options) => {
      // does not retry, only logs a warning
      octokit.log.warn(
        `Abuse detected for request ${options.method} ${options.url}`
      )
    },
  },
  userAgent: `${config.name}/${config.version}`,
  log: {
    debug: () => {},
    info: () => {},
    warn: console.warn,
    error: console.error,
  },
  request: {
    agent: undefined,
    fetch: undefined,
    timeout: 0,
  },
})

module.exports = octokit
