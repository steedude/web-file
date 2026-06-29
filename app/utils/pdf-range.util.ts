export function parsePageRanges(input: string, pageCount: number): number[] {
  if (pageCount <= 0)
    return []

  const selected = new Set<number>()
  const tokens = input.split(',').map(token => token.trim()).filter(Boolean)
  const ranges = tokens.length > 0 ? tokens : ['1-end']

  for (const token of ranges) {
    const parts = token.split('-').map(part => part.trim())

    if (parts.length > 2 || !parts[0])
      throw new Error('Invalid page range. Use a format like 1-3,5,8-end.')

    const [rawStart, rawEnd] = parts
    const start = parsePageNumber(rawStart ?? '1', pageCount)
    const end = rawEnd ? parsePageNumber(rawEnd, pageCount) : start

    const lower = Math.min(start, end)
    const upper = Math.max(start, end)

    for (let page = lower; page <= upper; page += 1)
      selected.add(page - 1)
  }

  return [...selected].filter(index => index >= 0 && index < pageCount).sort((a, b) => a - b)
}

function parsePageNumber(value: string, pageCount: number): number {
  if (value.toLowerCase() === 'end')
    return pageCount

  if (!/^\d+$/.test(value))
    throw new Error('Invalid page range. Use a format like 1-3,5,8-end.')

  const parsed = Number.parseInt(value, 10)

  return Math.min(Math.max(parsed, 1), pageCount)
}
