export function parsePageRanges(input: string, pageCount: number): number[] {
  if (pageCount <= 0)
    return []

  const selected = new Set<number>()
  const tokens = input.split(',').map(token => token.trim()).filter(Boolean)
  const ranges = tokens.length > 0 ? tokens : ['1-end']

  for (const token of ranges) {
    const [rawStart, rawEnd] = token.split('-').map(part => part.trim())
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

  const parsed = Number.parseInt(value, 10)

  if (!Number.isFinite(parsed))
    return 1

  return Math.min(Math.max(parsed, 1), pageCount)
}
