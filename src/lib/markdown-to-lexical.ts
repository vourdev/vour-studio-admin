/**
 * Converts Markdown string into Lexical RichText JSON format
 * used by Payload/Drizzle posts table and vour-studio marketing site.
 */
export function markdownToLexical(markdown: string): Record<string, any> {
  if (!markdown) {
    return {
      root: {
        type: 'root',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        children: [],
      },
    }
  }

  const lines = markdown.split('\n')
  const children: any[] = []

  let inCodeBlock = false
  let codeBlockLines: string[] = []
  let listItems: any[] = []
  let isOrderedList = false

  const flushList = () => {
    if (listItems.length === 0) return
    children.push({
      type: 'list',
      listType: isOrderedList ? 'number' : 'bullet',
      start: 1,
      tag: isOrderedList ? 'ol' : 'ul',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: [...listItems],
    })
    listItems = []
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        children.push({
          type: 'code',
          format: '',
          indent: 0,
          version: 1,
          direction: 'ltr',
          children: [
            {
              type: 'text',
              text: codeBlockLines.join('\n'),
              format: 0,
              detail: 0,
              mode: 'normal',
              style: '',
              version: 1,
            },
          ],
        })
        codeBlockLines = []
        inCodeBlock = false
      } else {
        flushList()
        inCodeBlock = true
      }
      continue
    }

    if (inCodeBlock) {
      codeBlockLines.push(line)
      continue
    }

    // Unordered list
    if (/^[\*\-]\s+/.test(line.trim())) {
      const text = line.trim().replace(/^[\*\-]\s+/, '')
      if (isOrderedList && listItems.length > 0) {
        flushList()
      }
      isOrderedList = false
      listItems.push({
        type: 'listitem',
        value: listItems.length + 1,
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        children: [
          {
            type: 'text',
            text,
            format: 0,
            detail: 0,
            mode: 'normal',
            style: '',
            version: 1,
          },
        ],
      })
      continue
    }

    // Ordered list
    if (/^\d+\.\s+/.test(line.trim())) {
      const text = line.trim().replace(/^\d+\.\s+/, '')
      if (!isOrderedList && listItems.length > 0) {
        flushList()
      }
      isOrderedList = true
      listItems.push({
        type: 'listitem',
        value: listItems.length + 1,
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        children: [
          {
            type: 'text',
            text,
            format: 0,
            detail: 0,
            mode: 'normal',
            style: '',
            version: 1,
          },
        ],
      })
      continue
    }

    flushList()

    const trimmed = line.trim()
    if (!trimmed) continue

    if (trimmed.startsWith('# ')) {
      children.push({
        type: 'heading',
        tag: 'h1',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        children: [
          {
            type: 'text',
            text: trimmed.replace(/^#\s+/, ''),
            format: 0,
            detail: 0,
            mode: 'normal',
            style: '',
            version: 1,
          },
        ],
      })
    } else if (trimmed.startsWith('## ')) {
      children.push({
        type: 'heading',
        tag: 'h2',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        children: [
          {
            type: 'text',
            text: trimmed.replace(/^##\s+/, ''),
            format: 0,
            detail: 0,
            mode: 'normal',
            style: '',
            version: 1,
          },
        ],
      })
    } else if (trimmed.startsWith('### ')) {
      children.push({
        type: 'heading',
        tag: 'h3',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        children: [
          {
            type: 'text',
            text: trimmed.replace(/^###\s+/, ''),
            format: 0,
            detail: 0,
            mode: 'normal',
            style: '',
            version: 1,
          },
        ],
      })
    } else if (trimmed.startsWith('> ')) {
      children.push({
        type: 'quote',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        children: [
          {
            type: 'text',
            text: trimmed.replace(/^>\s+/, ''),
            format: 0,
            detail: 0,
            mode: 'normal',
            style: '',
            version: 1,
          },
        ],
      })
    } else {
      children.push({
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        children: [
          {
            type: 'text',
            text: trimmed,
            format: 0,
            detail: 0,
            mode: 'normal',
            style: '',
            version: 1,
          },
        ],
      })
    }
  }

  flushList()

  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children,
    },
  }
}
