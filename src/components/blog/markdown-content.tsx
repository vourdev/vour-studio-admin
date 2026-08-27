import React from 'react'

export function MarkdownContent({ content }: { content: string }) {
  if (!content) return null

  // Split by double newlines into blocks
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []

  let inCodeBlock = false
  let codeBlockContent: string[] = []
  let codeLanguage = ''
  let listItems: string[] = []
  let isOrderedList = false

  const flushList = (key: number) => {
    if (listItems.length === 0) return null
    const items = [...listItems]
    const ordered = isOrderedList
    listItems = []
    if (ordered) {
      return (
        <ol key={`ol-${key}`} className="my-4 ml-6 list-decimal space-y-2 text-muted-foreground">
          {items.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {renderInline(item)}
            </li>
          ))}
        </ol>
      )
    }
    return (
      <ul key={`ul-${key}`} className="my-4 ml-6 list-disc space-y-2 text-muted-foreground">
        {items.map((item, idx) => (
          <li key={idx} className="leading-relaxed">
            {renderInline(item)}
          </li>
        ))}
      </ul>
    )
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Code block toggle
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <div key={`code-${i}`} className="my-6 overflow-x-auto rounded-lg border bg-zinc-950 p-4 text-sm text-zinc-100 font-mono">
            <pre>
              <code>{codeBlockContent.join('\n')}</code>
            </pre>
          </div>
        )
        codeBlockContent = []
        inCodeBlock = false
      } else {
        // Flush any pending list
        const listEl = flushList(i)
        if (listEl) elements.push(listEl)

        inCodeBlock = true
        codeLanguage = line.trim().replace(/^```/, '')
      }
      continue
    }

    if (inCodeBlock) {
      codeBlockContent.push(line)
      continue
    }

    // Unordered List
    if (/^[\*\-]\s+/.test(line.trim())) {
      const text = line.trim().replace(/^[\*\-]\s+/, '')
      if (isOrderedList && listItems.length > 0) {
        const listEl = flushList(i)
        if (listEl) elements.push(listEl)
      }
      isOrderedList = false
      listItems.push(text)
      continue
    }

    // Ordered List
    if (/^\d+\.\s+/.test(line.trim())) {
      const text = line.trim().replace(/^\d+\.\s+/, '')
      if (!isOrderedList && listItems.length > 0) {
        const listEl = flushList(i)
        if (listEl) elements.push(listEl)
      }
      isOrderedList = true
      listItems.push(text)
      continue
    }

    // Flush any pending list before regular elements
    const listEl = flushList(i)
    if (listEl) elements.push(listEl)

    const trimmed = line.trim()
    if (!trimmed) continue

    // Headings
    if (trimmed.startsWith('# ')) {
      elements.push(
        <h1 key={`h1-${i}`} className="mt-8 mb-4 text-3xl font-bold tracking-tight text-foreground font-mono">
          {renderInline(trimmed.replace(/^#\s+/, ''))}
        </h1>
      )
    } else if (trimmed.startsWith('## ')) {
      elements.push(
        <h2 key={`h2-${i}`} className="mt-8 mb-4 text-2xl font-semibold tracking-tight text-foreground font-mono">
          {renderInline(trimmed.replace(/^##\s+/, ''))}
        </h2>
      )
    } else if (trimmed.startsWith('### ')) {
      elements.push(
        <h3 key={`h3-${i}`} className="mt-6 mb-3 text-lg font-semibold tracking-tight text-foreground font-mono">
          {renderInline(trimmed.replace(/^###\s+/, ''))}
        </h3>
      )
    } else if (trimmed.startsWith('> ')) {
      elements.push(
        <blockquote key={`quote-${i}`} className="my-4 border-l-4 border-primary/60 pl-4 italic text-muted-foreground">
          {renderInline(trimmed.replace(/^>\s+/, ''))}
        </blockquote>
      )
    } else {
      elements.push(
        <p key={`p-${i}`} className="my-4 text-base leading-relaxed text-muted-foreground/90">
          {renderInline(trimmed)}
        </p>
      )
    }
  }

  // Final list flush
  const finalListEl = flushList(lines.length)
  if (finalListEl) elements.push(finalListEl)

  return <div className="space-y-2">{elements}</div>
}

function renderInline(text: string): React.ReactNode {
  // Regex for **bold**, *italic*, `code`, and [link](url)
  const parts: React.ReactNode[] = []
  let remaining = text
  let keyIdx = 0

  while (remaining) {
    // Bold
    const boldMatch = remaining.match(/^(.*?)\*\*(.+?)\*\*(.*)$/)
    // Inline code
    const codeMatch = remaining.match(/^(.*?)`([^`]+)`(.*)$/)
    // Italic
    const italicMatch = remaining.match(/^(.*?)\*([^*]+)\*(.*)$/)
    // Link
    const linkMatch = remaining.match(/^(.*?)\[([^\]]+)\]\(([^)]+)\)(.*)$/)

    // Match whichever comes earliest
    const matches = [
      boldMatch ? { type: 'bold', index: boldMatch[1].length, match: boldMatch } : null,
      codeMatch ? { type: 'code', index: codeMatch[1].length, match: codeMatch } : null,
      italicMatch ? { type: 'italic', index: italicMatch[1].length, match: italicMatch } : null,
      linkMatch ? { type: 'link', index: linkMatch[1].length, match: linkMatch } : null,
    ].filter(Boolean) as { type: string; index: number; match: RegExpMatchArray }[]

    if (matches.length === 0) {
      parts.push(remaining)
      break
    }

    matches.sort((a, b) => a.index - b.index)
    const first = matches[0]

    if (first.match[1]) {
      parts.push(first.match[1])
    }

    if (first.type === 'bold') {
      parts.push(
        <strong key={`b-${keyIdx++}`} className="font-semibold text-foreground">
          {first.match[2]}
        </strong>
      )
      remaining = first.match[3]
    } else if (first.type === 'code') {
      parts.push(
        <code key={`c-${keyIdx++}`} className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-primary font-medium">
          {first.match[2]}
        </code>
      )
      remaining = first.match[3]
    } else if (first.type === 'italic') {
      parts.push(
        <em key={`i-${keyIdx++}`} className="italic">
          {first.match[2]}
        </em>
      )
      remaining = first.match[3]
    } else if (first.type === 'link') {
      parts.push(
        <a
          key={`l-${keyIdx++}`}
          href={first.match[3]}
          target="_blank"
          rel="noreferrer"
          className="text-primary underline hover:opacity-80"
        >
          {first.match[2]}
        </a>
      )
      remaining = first.match[4]
    }
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>
}
