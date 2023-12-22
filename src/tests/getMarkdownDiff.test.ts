import { getMarkdownDiff, getRawDiff } from "../getDiff"

describe('test', () => {
  it('should pass', async () => {

    const rawDiff = await getRawDiff('feature/tests', ['*.md', '**.ts'])
    console.log(rawDiff.length)

    const markdownDiff = getMarkdownDiff(rawDiff)
    console.log(markdownDiff)

    expect(true).toBe(true)
  })
})
