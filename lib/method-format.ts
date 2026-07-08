const NUMBERED_LINE = /^(\d+)[.)]\s*(.*)$/

export type MethodBlock =
  | { type: 'list'; items: { n: number; text: string }[] }
  | { type: 'text'; lines: string[] }

// Groups method lines into alternating numbered-list and free-text runs.
// A blank line always ends the current run; the next non-blank line starts
// a new one (list or text, decided by whether it matches "1.", "2)", etc).
export function parseMethodBlocks(method: string): MethodBlock[] {
  const blocks: MethodBlock[] = []
  let current: MethodBlock | null = null

  for (const rawLine of method.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (line === '') {
      current = null
      continue
    }

    const match = line.match(NUMBERED_LINE)
    if (match) {
      const n = Number(match[1])
      const text = match[2]
      if (current?.type === 'list') {
        current.items.push({ n, text })
      } else {
        current = { type: 'list', items: [{ n, text }] }
        blocks.push(current)
      }
    } else {
      if (current?.type === 'text') {
        current.lines.push(line)
      } else {
        current = { type: 'text', lines: [line] }
        blocks.push(current)
      }
    }
  }

  return blocks
}
