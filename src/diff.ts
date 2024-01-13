import { exec } from 'child_process'
import { promisify } from 'util'
import parseGitDiff, {
  type AnyChunk,
  type AnyFileChange,
  type AnyLineChange
} from 'parse-git-diff'
import { MARKDOWN_MESSAGE } from './constants'
import {
  getFileDiffHeader,
  getMarkdownDiffWrapper,
  getRenamedFileDiffHeader
} from './markdownUtils'

export const getRawDiff = async (
  targetBranch: string,
  filesPattern: string[]
): Promise<string> => {
  const filesPatternString = filesPattern.map(file => `'${file}'`).join(' ')
  const { stdout, stderr } = await promisify(exec)(
    `git diff -w -M100% origin/${targetBranch} -- ${filesPatternString}`
  )
  if (stderr) {
    throw new Error(stderr)
  }
  return stdout
}

const convertLineChangeToMarkdown = (lineChange: AnyLineChange): string => {
  const { type, content } = lineChange
  switch (type) {
    case 'AddedLine':
      return `+ ${content}`
    case 'DeletedLine':
      return `- ${content}`
    default:
      return ''
  }
}

const convertChunkToMarkdown = (chunk: AnyChunk): string[] => {
  const { type } = chunk
  switch (type) {
    case 'Chunk':
    case 'CombinedChunk':
      return chunk.changes.map(convertLineChangeToMarkdown).filter(Boolean) // Remove empty strings
    default:
      return []
  }
}

const getFileDiff = (file: AnyFileChange): string => {
  const { type, chunks } = file
  const fileDiff = chunks.flatMap(convertChunkToMarkdown).join('\n')
  if (!fileDiff.length && (type === 'AddedFile' || type === 'ChangedFile')) {
    throw new Error(`Could not parse diff for file: ${file.path}.`)
  }

  switch (type) {
    case 'AddedFile':
    case 'ChangedFile': {
      return `${getFileDiffHeader(file.path)}${getMarkdownDiffWrapper(
        fileDiff
      )}`
    }
    case 'RenamedFile': {
      return `${getRenamedFileDiffHeader(
        file.pathBefore,
        file.pathAfter
      )}${getMarkdownDiffWrapper(MARKDOWN_MESSAGE.FILE_RENAMED)}`
    }
    case 'DeletedFile': {
      return `${getFileDiffHeader(file.path)}${getMarkdownDiffWrapper(
        MARKDOWN_MESSAGE.FILE_DELETED
      )}`
    }
    default:
      return ''
  }
}

export const getMarkdownDiff = (rawDiff: string): string => {
  const hasDetectedChanges = rawDiff.length > 0

  if (!hasDetectedChanges) {
    return MARKDOWN_MESSAGE.NO_CHANGES
  }

  const { files } = parseGitDiff(rawDiff)
  let markdownDiff = ''

  for (const file of files) {
    try {
      const fileDiff = getFileDiff(file)
      markdownDiff += `${fileDiff}\n`
    } catch {
      markdownDiff += `${getFileDiffHeader(
        file.type === 'RenamedFile'
          ? getRenamedFileDiffHeader(file.pathBefore, file.pathAfter)
          : file.path
      )}${MARKDOWN_MESSAGE.PARSING_ERROR}\n`
    }
  }

  return `## ${MARKDOWN_MESSAGE.CHANGES_DETECTED}\n${markdownDiff}`
}
