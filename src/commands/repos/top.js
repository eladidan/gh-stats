const {flags} = require('@oclif/command')

const BaseCommand = require('../base')

class TopCommand extends BaseCommand {
  async run() {
    const {org} = this.flags
    console.log(`hello ${org || 'world'}`)
  }
}

TopCommand.description = `
List top repositories by different sort criteria
`

TopCommand.flags = {
  ...BaseCommand.flags,
  number: flags.string({char: 'n', description: 'Number of repositories to list', default: 10}),
  sortBy: flags.enum({char: 's', description: 'Sort criteria by which to list top repos', options: ['']}),
}

module.exports = TopCommand
