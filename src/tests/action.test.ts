import ActionsCore from '@actions/core'
import ChildProcess from 'child_process'

describe('Env changes detector', () => {
  const gitDiffSpy = jest.spyOn(ChildProcess, 'exec')
  const getInputSpy = jest.spyOn(ActionsCore, 'getInput')

  it('should pass', () => {
    expect(true).toBeTruthy()
  })
  // describe('valid git diff', () => {})
  // describe('invalid git diff', () => {})
})
