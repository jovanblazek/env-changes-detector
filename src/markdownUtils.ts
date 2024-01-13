export const getFileDiffHeader = (fileName: string): string =>
  `#### \`${fileName}\`\n`

export const getRenamedFileDiffHeader = (
  pathBefore: string,
  pathAfter: string
): string => `#### \`${pathBefore} -> ${pathAfter}\`\n`

export const getMarkdownDiffWrapper = (diff: string): string =>
  `\`\`\`diff\n${diff}\n\`\`\`\n`
