const {expect, test} = require('@oclif/test')

describe('repos', () => {
  test
  .stdout()
  .command(['repos:top'])
  .it('runs repos:top', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['repos:top', '--org', 'eladidan'])
  .it('runs repos:top --org eladidan', ctx => {
    expect(ctx.stdout).to.contain('hello eladidan')
  })
})
