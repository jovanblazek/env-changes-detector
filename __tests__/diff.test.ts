import { getMarkdownDiff, getRawDiff } from '../src/getDiff'

describe('diff', () => {
  it('should pass', async () => {
    const rawDiff = await getRawDiff('main', ['*.md', '**.ts'])
    console.log(rawDiff.length)

    const markdownDiff = getMarkdownDiff(rawDiff)
    console.log(markdownDiff)

    expect(true).toBe(true)
  })
})
