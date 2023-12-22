import { MARKDOWN_MESSAGE } from '../src/constants'
import { getMarkdownDiff, getRawDiff } from '../src/diff'
import { exec } from 'child_process'
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
        `git diff -w origin/main -- '*.md' '**.ts'`,
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
        `git diff -w origin/main -- '*.md' '**.ts'`,
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

    it('should return a markdown diff when there are changes', () => {
      const rawDiff =
        'diff --git a/test.md b/test.md\n+added line\n-removed line'
      const result = getMarkdownDiff(rawDiff)
      expect(result).toBe(
        `${MARKDOWN_MESSAGE.CHANGES_DETECTED}\n#### \`test.md\`\n\`\`\`diff\n+added line\n-removed line\n\`\`\`\n`
      )
    })

    it('should only include lines that start with + or - in the markdown diff', () => {
      const rawDiff =
        'diff --git a/test.md b/test.md\n+added line\n-removed line\n unchanged line'
      const result = getMarkdownDiff(rawDiff)
      expect(result).toBe(
        `${MARKDOWN_MESSAGE.CHANGES_DETECTED}\n#### \`test.md\`\n\`\`\`diff\n+added line\n-removed line\n\`\`\`\n`
      )
    })

    it('should handle multiple files', () => {
      const rawDiff =
        'diff --git a/test1.md b/test1.md\n+added line\n-removed line\ndiff --git a/test2.md b/test2.md\n+added line\n-removed line'
      const result = getMarkdownDiff(rawDiff)
      expect(result).toBe(
        `${MARKDOWN_MESSAGE.CHANGES_DETECTED}\n#### \`test1.md\`\n\`\`\`diff\n+added line\n-removed line\n\`\`\`\n#### \`test2.md\`\n\`\`\`diff\n+added line\n-removed line\n\`\`\`\n`
      )
    })
  })
})
