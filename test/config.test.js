const {expect, test} = require('@oclif/test')
const decache = require('decache')

let config = require('../src/config')

describe('config', () => {
  test
  .env({
    GITHUB_AUTH_TOKEN: '1234',
  })
  .it('returns a config object', () => {
    // decache config for env var changes to take effect
    decache('../src/config')
    config = require('../src/config')
    expect(config.github.auth.token).to.equal('1234')
    expect(config.name).to.be.a('string').that.is.not.empty
    expect(config.version).to.be.a('string').that.is.not.empty
  })
})
