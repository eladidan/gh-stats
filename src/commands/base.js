const {Command, flags} = require('@oclif/command')

class BaseCommand extends Command {
  async init() {
    const {flags} = this.parse(this.constructor)
    this.flags = flags
  }
}

BaseCommand.description = `
Base Command
`

BaseCommand.flags = {
  org: flags.string({char: 'o', description: 'Github orginazation or owner'}),
}

module.exports = BaseCommand
