import { run } from '../src/index'
import { getMarkdownDiff, getRawDiff } from '../src/diff'
import { getInput, setOutput, setFailed } from '@actions/core'
import { MARKDOWN_MESSAGE, OUTPUT } from '../src/constants'

jest.mock('@actions/core')
jest.mock('../src/diff')

describe('run', () => {
  it.each`
    targetBranch | filesToCheck           | expectedErrorMessage
    ${''}        | ${'["*.md", "**.ts"]'} | ${'Invalid input'}
    ${'main'}    | ${''}                  | ${'Unexpected end of JSON input'}
    ${''}        | ${'[]'}                | ${'Invalid input'}
  `(
    'should throw an error when the input is invalid',
    async ({ targetBranch, filesToCheck, expectedErrorMessage }) => {
      const mockGetInput = getInput as jest.MockedFunction<typeof getInput>
      mockGetInput.mockImplementation(name =>
        name === 'target-branch' ? targetBranch : filesToCheck
      )

      await run()

      const mockSetFailed = setFailed as jest.MockedFunction<typeof setFailed>
      expect(mockSetFailed).toHaveBeenCalledWith(
        new Error(expectedErrorMessage)
      )
    }
  )

  it('should not detect changes when the raw diff is empty', async () => {
    const mockGetInput = getInput as jest.MockedFunction<typeof getInput>
    mockGetInput.mockImplementation(name =>
      name === 'target-branch' ? 'main' : '["*.md", "**.ts"]'
    )
    const mockGetRawDiff = getRawDiff as jest.MockedFunction<typeof getRawDiff>
    mockGetRawDiff.mockResolvedValue('')
    const mockGetMarkdownDiff = getMarkdownDiff as jest.MockedFunction<
      typeof getMarkdownDiff
    >
    mockGetMarkdownDiff.mockReturnValue('mock markdown diff')

    await run()

    const mockSetOutput = setOutput as jest.MockedFunction<typeof setOutput>
    expect(mockSetOutput).toHaveBeenCalledWith(
      OUTPUT.HAS_DETECTED_CHANGES,
      false
    )
    expect(mockSetOutput).toHaveBeenCalledWith(OUTPUT.RAW, '')
    expect(mockSetOutput).toHaveBeenCalledWith(
      OUTPUT.MARKDOWN,
      MARKDOWN_MESSAGE.NO_CHANGES
    )
    expect(mockSetOutput).toHaveBeenCalledTimes(3)
    expect(mockGetMarkdownDiff).not.toHaveBeenCalled()
  })

  it('should detect changes when the raw diff is not empty', async () => {
    const mockGetInput = getInput as jest.MockedFunction<typeof getInput>
    mockGetInput.mockImplementation(name =>
      name === 'target-branch' ? 'main' : '["*.md", "**.ts"]'
    )
    const mockGetRawDiff = getRawDiff as jest.MockedFunction<typeof getRawDiff>
    mockGetRawDiff.mockResolvedValue('mock raw diff')
    const mockGetMarkdownDiff = getMarkdownDiff as jest.MockedFunction<
      typeof getMarkdownDiff
    >
    mockGetMarkdownDiff.mockReturnValue('mock markdown diff')

    await run()

    const mockSetOutput = setOutput as jest.MockedFunction<typeof setOutput>
    expect(mockSetOutput).toHaveBeenCalledWith(
      OUTPUT.HAS_DETECTED_CHANGES,
      true
    )
    expect(mockSetOutput).toHaveBeenCalledWith(OUTPUT.RAW, 'mock raw diff')
    expect(mockSetOutput).toHaveBeenCalledWith(
      OUTPUT.MARKDOWN,
      `${MARKDOWN_MESSAGE.CHANGES_DETECTED}\n\nmock markdown diff`
    )
    expect(mockSetOutput).toHaveBeenCalledTimes(6) // 3 at the beginning + 3 here
  })

  it('should call setFailed when an error is thrown', async () => {
    const mockGetInput = getInput as jest.MockedFunction<typeof getInput>
    mockGetInput.mockImplementation(() => {
      throw new Error('mock error')
    })

    await run()

    const mockSetFailed = setFailed as jest.MockedFunction<typeof setFailed>
    expect(mockSetFailed).toHaveBeenCalledWith(new Error('mock error'))
  })
})
