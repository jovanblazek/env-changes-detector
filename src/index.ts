import { MARKDOWN_MESSAGE, OUTPUT } from './constants'
import { getInput, setFailed, setOutput } from '@actions/core'
import { exec } from 'child_process'
import { promisify } from 'util'

async function run() {
  try {
    const targetBranch = getInput('target-branch')
    const filesToCheck: string[] = JSON.parse(getInput('files'))
    setOutput(OUTPUT.HAS_DETECTED_CHANGES, false)
    setOutput(OUTPUT.RAW, [])
    setOutput(OUTPUT.MARKDOWN, MARKDOWN_MESSAGE.NO_CHANGES)

    const diffResult = await promisify(exec)(
      `git diff -w origin/${targetBranch} -- ${filesToCheck
        .map((file) => `'${file}'`)
        .join(' ')}`
    )
    if (diffResult.stderr) {
      throw new Error(diffResult.stderr)
    }

    if (diffResult.stdout === '') {
      return
    }

    const regex = /^(?<diff>[+-]{1}\w.*)|(?:diff --git\sa(?<file>.*?)\s.*)$/gm
    const matches = Array.from(
      diffResult.stdout.matchAll(regex),
      (match) => match.groups as { [key: string]: string }
    )

    // format found changes to markdown syntax
    const markdownMessage = matches.map((match, index) => {
      if (match.file) {
        if (index === 0) {
          return `\`${match.file}\``
        }
        return `\`\`\`\n\n\`${match.file}\``
      }
      const previousMatch = matches[index - 1]
      if (previousMatch.diff) {
        return match.diff
      }
      return `\`\`\` diff\n${match.diff}`
    })
    markdownMessage.push(`\`\`\``) // close last code block

    setOutput(OUTPUT.HAS_DETECTED_CHANGES, true)
    setOutput(OUTPUT.RAW, matches)
    setOutput(
      OUTPUT.MARKDOWN,
      `${MARKDOWN_MESSAGE.CHANGES_DETECTED}\n\n${markdownMessage.join('\n')}`
    )
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    setFailed(error)
  }
}

run()
