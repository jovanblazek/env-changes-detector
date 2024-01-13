import { MARKDOWN_MESSAGE } from '../src/constants'
import { getMarkdownDiff, getRawDiff } from '../src/diff'
import { exec } from 'child_process'
import { getFixture } from './utils'
jest.mock('child_process')

describe('diff', () => {
  describe('getRawDiff', () => {
    it('should return the stdout when the command executes successfully', async () => {
      const mockExec = exec as jest.MockedFunction<typeof exec>
      mockExec.mockImplementation((_, callback) =>
        // @ts-expect-error mock implementation
        callback(null, { stdout: 'mock stdout', stderr: '' })
      )

      const result = await getRawDiff('main', ['*.md', '**.ts'])
      expect(result).toBe('mock stdout')
      expect(mockExec).toHaveBeenCalledWith(
        `git diff -w -M100% origin/main -- '*.md' '**.ts'`,
        expect.any(Function)
      )
    })

    it('should throw an error when the command fails', async () => {
      const mockExec = exec as jest.MockedFunction<typeof exec>
      mockExec.mockImplementation((_, callback) =>
        // @ts-expect-error mock implementation
        callback(null, { stdout: '', stderr: 'mock error' })
      )

      await expect(getRawDiff('main', ['*.md', '**.ts'])).rejects.toThrow(
        'mock error'
      )
      expect(mockExec).toHaveBeenCalledWith(
        `git diff -w -M100% origin/main -- '*.md' '**.ts'`,
        expect.any(Function)
      )
    })
  })

  describe('getMarkdownDiff', () => {
    it('should return "No changes detected" when there are no changes', () => {
      const rawDiff = ''
      const result = getMarkdownDiff(rawDiff)
      expect(result).toBe(MARKDOWN_MESSAGE.NO_CHANGES)
    })

    it.each([
      ['file is added', 'new-file'],
      ['file is deleted', 'deleted-file'],
      ['file is renamed', 'renamed-file'],
      ['there are multiple changed lines in one file', 'changed-lines'],
      ['there are multiple changed files', 'all']
    ])('should return a markdown diff when the %s', (_, fixtureName) => {
      const rawDiff = getFixture(fixtureName)
      const result = getMarkdownDiff(rawDiff)
      expect(result).toMatchSnapshot()
    })

    it('should not include unchanged lines in the markdown diff', () => {
      const rawDiff = getFixture('unchanged-line')
      const result = getMarkdownDiff(rawDiff)
      console.log('result\n', result)
      expect(result).toMatchSnapshot()
    })
  })
})
