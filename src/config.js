const {name, version} = require('../package.json')

module.exports = {
  name,
  version,
  github: {
    auth: {
      token: process.env.GITHUB_AUTH_TOKEN,
    },
  },
}
