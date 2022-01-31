import * as core from '@actions/core'
import { promisify } from 'util'
import { exec } from 'child_process'

const HAS_DETECTED_CHANGES = 'env-changes-detected'
const RAW_OUTPUT = 'env-changes-raw'
const MD_OUTPUT = 'env-changes-md'

async function run() {
  try {
    const targetBranch = core.getInput('target-branch')
    const filesToCheck: string[] = JSON.parse(core.getInput('files'))
    core.setOutput(HAS_DETECTED_CHANGES, false)
    core.setOutput(RAW_OUTPUT, [])
    core.setOutput(MD_OUTPUT, 'No env file changes detected.')

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

    const regex = /^(?<diff>[\+-]{1}\w.*)|(?:diff --git\sa(?<file>.*?)\s.*)$/gm
    const matches = Array.from(
      diffResult.stdout.matchAll(regex),
      (match) => match.groups as { [key: string]: string }
    )

    // format found changes to markdown syntax
    const markdownMessage = matches.map((match, index) => {
      if (match.file) {
        if (index === 0) {
          return `\`${match.file}\`\n`
        }
        return `\`\`\`\n\`${match.file}\`\n`
      }
      const previousMatch = matches[index - 1]
      if (previousMatch.diff) {
        return `${match.diff}\n`
      }
      return `\`\`\` diff\n${match.diff}\n`
    })
    markdownMessage.push(`\`\`\``) // close last code block

    core.setOutput(HAS_DETECTED_CHANGES, true)
    core.setOutput(RAW_OUTPUT, matches)
    core.setOutput(
      MD_OUTPUT,
      `## Detected changes in env files:\n\n${markdownMessage.join('\n')}`
    )
  } catch (error: any) {
    console.log('There was an error. Check your inputs and try again.')
    core.setFailed(error)
  }
}

run()
