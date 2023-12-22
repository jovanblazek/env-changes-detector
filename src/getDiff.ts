import { exec } from 'child_process'
import { promisify } from 'util'
import { MARKDOWN_MESSAGE } from './constants'

export const getRawDiff = async (
  targetBranch: string,
  filesPattern: string[]
) => {
  const filesPatternString = filesPattern.map((file) => `'${file}'`).join(' ')
  const { stdout, stderr } = await promisify(exec)(
    `git diff -w ${targetBranch} -- ${filesPatternString}`
  )
  if (stderr) {
    throw new Error(stderr)
  }
  return stdout
}

export const getMarkdownDiff = (rawDiff: string) => {
  const fileDiffs = rawDiff.split('diff --git a/')
  let markdownDiff = ''
  const hasDetectedChanges = rawDiff.length > 0
  for (const fileDiff of fileDiffs.slice(1)) {
    // skip the first element as it's empty
    const lines = fileDiff.split('\n')
    // get the file name from the first line
    const fileName = lines[0].split(' ')[0] 
    // filter the diff lines to only include the ones that start with + or -
    const filteredLines = lines
      .slice(1)
      .filter((line) => /^[\+-]{1}[^+-]/.test(line)) ?? MARKDOWN_MESSAGE.CHANGES_FALLBACK
    markdownDiff += `#### \`${fileName}\`\n\`\`\`diff\n${filteredLines.join(
      '\n'
    )}\n\`\`\`\n`
  }
  return hasDetectedChanges
    ? `${MARKDOWN_MESSAGE.CHANGES_DETECTED}\n${markdownDiff}`
    : MARKDOWN_MESSAGE.NO_CHANGES
}
