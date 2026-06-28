import { describe, expect, it } from 'vitest'
import { parsePageRanges } from './pdf-range.util'

describe('parsePageRanges', () => {
  it('parses single pages and ranges as zero-based indexes', () => {
    expect(parsePageRanges('1-3,5', 8)).toEqual([0, 1, 2, 4])
  })

  it('supports end and clamps values to the document', () => {
    expect(parsePageRanges('0,4-end,99', 6)).toEqual([0, 3, 4, 5])
  })

  it('falls back to the whole document when empty', () => {
    expect(parsePageRanges('', 3)).toEqual([0, 1, 2])
  })
})
