'use client'

import {
  Bold,
  Code,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
} from 'lucide-react'
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
  type EditorState,
  type ElementNode,
  type LexicalEditor,
  type LexicalNode,
  type RangeSelection,
  type TextFormatType,
} from 'lexical'
import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text'
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListItemNode,
  ListNode,
} from '@lexical/list'
import { CodeHighlightNode, CodeNode } from '@lexical/code'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
// Payload's own link node classes. They read/write the `fields` object
// (e.g. `fields.url`) that Payload's richtext-lexical stores in the database,
// instead of the plain `@lexical/link` format that expects a top-level `url`.
// Using the plain classes on Payload content crashes with
// "Cannot read properties of undefined (reading 'match')" because the URL is
// `undefined`, which then cascades into "Unable to find an active editor state".
import {
  $createLinkNode,
  $isLinkNode,
  AutoLinkNode,
  LinkNode,
} from '@payloadcms/richtext-lexical/client'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect, useState } from 'react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

/** Format the same Lexical editor-state JSON that Payload's richText field stores. */
export type RichTextValue = { root: Record<string, unknown> } | null

const theme = {
  heading: {
    h2: 'text-xl font-semibold my-3',
    h3: 'text-lg font-semibold my-2',
  },
  paragraph: 'my-1',
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'line-through',
    code: 'rounded bg-muted px-1 py-0.5 font-mono text-[0.9em]',
  },
  list: {
    ul: 'list-disc list-inside my-1',
    ol: 'list-decimal list-inside my-1',
  },
  quote: 'my-2 border-l-4 border-primary/40 pl-4 italic text-muted-foreground',
  code: 'my-2 block rounded-md bg-muted p-3 font-mono text-sm',
  link: 'text-primary underline underline-offset-2',
}

const EDITOR_NODES = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  LinkNode,
  AutoLinkNode,
  CodeNode,
  CodeHighlightNode,
]

type LinkFields = {
  url?: string
  newTab: boolean
  linkType: 'custom' | 'internal'
}

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void
  active?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn('size-8', active && 'bg-accent text-accent-foreground')}
      onClick={onClick}
      title={title}
      aria-label={title}
    >
      {children}
    </Button>
  )
}

function Toolbar({ editor }: { editor: LexicalEditor }) {
  const [active, setActive] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    code: false,
    h2: false,
    h3: false,
    ul: false,
    ol: false,
    quote: false,
    link: false,
  })

  useEffect(() => {
    const update = ({ editorState }: { editorState: EditorState }) => {
      // Lexical 0.41 fires update listeners outside the active editor scope, so
      // `$`-helpers must be used inside editorState.read()/editor.read() here.
      editorState.read(() => {
        const raw = $getSelection()
        if (!raw || !$isRangeSelection(raw)) return
        const selection: RangeSelection = raw
        const node = selection.anchor.getNode()
        let parent: LexicalNode | null = node
        let h2 = false
        let h3 = false
        let ul = false
        let ol = false
        let quote = false
        let link = false
        while (parent) {
          const type = parent.getType()
          const getTag = (parent as { getTag?: () => string }).getTag
          if (type === 'heading' && getTag?.() === 'h2') h2 = true
          if (type === 'heading' && getTag?.() === 'h3') h3 = true
          if (type === 'list') {
            const listType = (parent as { getListType?: () => string }).getListType?.()
            if (listType === 'bullet') ul = true
            if (listType === 'number') ol = true
          }
          if (type === 'quote') quote = true
          if (type === 'link') link = true
          parent = parent.getParent()
        }
        setActive({
          bold: selection.hasFormat('bold'),
          italic: selection.hasFormat('italic'),
          underline: selection.hasFormat('underline'),
          strikethrough: selection.hasFormat('strikethrough'),
          code: selection.hasFormat('code'),
          h2,
          h3,
          ul,
          ol,
          quote,
          link,
        })
      })
    }
    const unregister = editor.registerUpdateListener(update)
    return () => unregister()
  }, [editor])

  const format = (type: TextFormatType) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, type)
  }

  const setHeading = (tag: 'h2' | 'h3') => {
    editor.update(() => {
      const selection = $getSelection()
      if (!selection || !$isRangeSelection(selection)) return
      const nodes = selection.getNodes()
      const first = nodes[0]
      const parent = first ? (first.getParent() as ElementNode | null) : null
      if (!parent) return
      const isSame =
        parent.getType() === 'heading' &&
        (parent as { getTag?: () => string }).getTag?.() === tag
      if (isSame) {
        parent.replace($createParagraphNode())
      } else {
        parent.replace($createHeadingNode(tag))
      }
    })
  }

  const setQuote = () => {
    editor.update(() => {
      const selection = $getSelection()
      if (!selection || !$isRangeSelection(selection)) return
      const nodes = selection.getNodes()
      const parent = nodes[0] ? (nodes[0].getParent() as ElementNode | null) : null
      if (!parent) return
      if (parent.getType() === 'quote') {
        parent.replace($createParagraphNode())
      } else {
        parent.replace($createQuoteNode())
      }
    })
  }

  const toggleLink = () => {
    const url = window.prompt('Masukkan URL tautan:')
    if (url === null) return
    const trimmed = url.trim()

    editor.update(() => {
      const selection = $getSelection()
      if (!selection || !$isRangeSelection(selection)) return
      const nodes = selection.extract()

      if (!trimmed) {
        // Remove any LinkNode wrapping the selected nodes.
        for (const node of nodes) {
          const parent = node.getParent()
          if (parent && $isLinkNode(parent)) {
            for (const child of parent.getChildren()) {
              parent.insertBefore(child)
            }
            parent.remove()
          }
        }
        return
      }

      const fields: LinkFields = { url: trimmed, newTab: false, linkType: 'custom' }
      let linkNode: LinkNode | null = null
      for (const node of nodes) {
        const parent = node.getParent()
        if (parent && $isLinkNode(parent)) {
          parent.setFields(fields)
          linkNode = parent
          continue
        }
        if (!linkNode || (parent && parent !== linkNode.getParent())) {
          linkNode = $createLinkNode({ fields })
          node.insertBefore(linkNode)
        }
        linkNode.append(node)
      }
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 rounded-t-md border border-b-0 bg-muted/40 p-1">
      <ToolbarButton title="Undo" onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}>
        <Undo2 className="size-4" />
      </ToolbarButton>
      <ToolbarButton title="Redo" onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}>
        <Redo2 className="size-4" />
      </ToolbarButton>
      <span className="mx-1 h-5 w-px bg-border" aria-hidden />
      <ToolbarButton title="Tebal" active={active.bold} onClick={() => format('bold')}>
        <Bold className="size-4" />
      </ToolbarButton>
      <ToolbarButton title="Miring" active={active.italic} onClick={() => format('italic')}>
        <Italic className="size-4" />
      </ToolbarButton>
      <ToolbarButton title="Garis bawah" active={active.underline} onClick={() => format('underline')}>
        <Underline className="size-4" />
      </ToolbarButton>
      <ToolbarButton title="Coret" active={active.strikethrough} onClick={() => format('strikethrough')}>
        <Strikethrough className="size-4" />
      </ToolbarButton>
      <ToolbarButton title="Kode inline" active={active.code} onClick={() => format('code')}>
        <Code className="size-4" />
      </ToolbarButton>
      <span className="mx-1 h-5 w-px bg-border" aria-hidden />
      <ToolbarButton title="Heading 2" active={active.h2} onClick={() => setHeading('h2')}>
        <Heading2 className="size-4" />
      </ToolbarButton>
      <ToolbarButton title="Heading 3" active={active.h3} onClick={() => setHeading('h3')}>
        <Heading3 className="size-4" />
      </ToolbarButton>
      <ToolbarButton title="Daftar poin" active={active.ul} onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)}>
        <List className="size-4" />
      </ToolbarButton>
      <ToolbarButton title="Daftar angka" active={active.ol} onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)}>
        <ListOrdered className="size-4" />
      </ToolbarButton>
      <ToolbarButton title="Kutipan" active={active.quote} onClick={setQuote}>
        <Quote className="size-4" />
      </ToolbarButton>
      <ToolbarButton title="Tautan" active={active.link} onClick={toggleLink}>
        <LinkIcon className="size-4" />
      </ToolbarButton>
    </div>
  )
}

function Editor({
  onChange,
  readOnly,
}: {
  onChange: (value: RichTextValue) => void
  readOnly?: boolean
}) {
  const [editor] = useLexicalComposerContext()

  const handleChange = (editorState: EditorState) => {
    onChange(editorState.toJSON() as RichTextValue)
  }

  return (
    <div className="rich-text-editor">
      {!readOnly && <Toolbar editor={editor} />}
      <div className="relative rounded-md border bg-background">
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              readOnly={readOnly}
              className="min-h-48 px-4 py-3 text-sm outline-none"
              aria-label="Konten"
            />
          }
          placeholder={
            <div className="pointer-events-none absolute top-3 left-4 text-sm text-muted-foreground">
              Mulai menulis…
            </div>
          }
          ErrorBoundary={EditorErrorBoundary}
        />
        <HistoryPlugin />
        <ListPlugin />
        <OnChangePlugin onChange={handleChange} ignoreSelectionChange />
      </div>
    </div>
  )
}

function EditorErrorBoundary({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export function RichTextEditor({
  value,
  onChange,
  readOnly,
}: {
  value: RichTextValue
  onChange: (value: RichTextValue) => void
  readOnly?: boolean
}) {
  return (
    <LexicalComposer
      initialConfig={{
        namespace: 'vour-rich-text',
        theme,
        nodes: EDITOR_NODES,
        editorState: value ? JSON.stringify(value) : undefined,
        onError: (error) => console.error(error),
      }}
    >
      <Editor onChange={onChange} readOnly={readOnly} />
    </LexicalComposer>
  )
}
