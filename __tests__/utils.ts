import { readFileSync } from 'fs'
import { resolve } from 'path'

export function getFixture(name: string): string {
  return readFileSync(resolve(__dirname, '__fixtures__', name), 'utf-8')
}
