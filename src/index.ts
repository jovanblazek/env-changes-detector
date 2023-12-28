import { MARKDOWN_MESSAGE, OUTPUT } from './constants'
import { getInput, setFailed, setOutput } from '@actions/core'
import { getMarkdownDiff, getRawDiff } from './diff'

export const run = async (): Promise<void> => {
  try {
    const targetBranch = getInput('target-branch')
    const filesToCheck: string[] = JSON.parse(getInput('files'))
    setOutput(OUTPUT.HAS_DETECTED_CHANGES, false)
    setOutput(OUTPUT.RAW, '')
    setOutput(OUTPUT.MARKDOWN, MARKDOWN_MESSAGE.NO_CHANGES)

    if (!targetBranch || !filesToCheck?.length) {
      throw new Error('Invalid input')
    }

    const rawDiff = await getRawDiff(targetBranch, filesToCheck)
    if (!rawDiff) {
      return
    }
    const markdownMessage = getMarkdownDiff(rawDiff)

    setOutput(OUTPUT.HAS_DETECTED_CHANGES, true)
    setOutput(OUTPUT.RAW, rawDiff)
    setOutput(OUTPUT.MARKDOWN, markdownMessage)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    setFailed(error)
  }
}

run()
