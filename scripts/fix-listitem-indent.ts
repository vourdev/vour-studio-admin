import 'dotenv/config'
import { getPayload } from 'payload'
import type { Payload } from 'payload'
import config from '@payload-config'

/**
 * One-off fix for Lexical error #117 ('Invalid indent value.').
 *
 * ListItemNode.setIndent requires `indent` to be a number; the seed-posts.ts
 * listItem() helper used to omit the key, so any seeded post containing a list
 * crashed the admin editor on open. This walks every post's content (published
 * AND latest draft) and normalizes indent: 0 on any listitem node whose indent
 * is not a number. Idempotent: posts without the problem are left untouched.
 *
 * Usage: npm run fix:listitem-indent
 */

type LexNode = { type?: string; children?: unknown[]; [key: string]: unknown }

const fixNode = (node: unknown): boolean => {
  if (!node || typeof node !== 'object') return false
  const n = node as LexNode
  let changed = false
  if (n.type === 'listitem' && typeof n.indent !== 'number') {
    n.indent = 0
    changed = true
  }
  if (Array.isArray(n.children)) {
    for (const child of n.children) {
      if (fixNode(child)) changed = true
    }
  }
  return changed
}

const fixPosts = async (payload: Payload, draft: boolean) => {
  let fixed = 0
  let page = 1
  for (;;) {
    const { docs, totalPages } = await payload.find({
      collection: 'posts',
      limit: 100,
      page,
      draft,
      overrideAccess: true,
    })
    for (const doc of docs) {
      const content = doc.content as LexNode | null | undefined
      if (!content) continue
      // Lexical editor states wrap everything in { root: { children: [...] } }.
      const tree = (content.root as LexNode | undefined) ?? content
      if (fixNode(tree)) {
        // `content as never`: the walk mutates the trusted runtime shape, which
        // the generated types can't express — casting is intentional here.
        await payload.update({
          collection: 'posts',
          id: doc.id,
          data: { content: content as never },
          draft,
          overrideAccess: true,
        })
        fixed++
        console.log(`  diperbaiki: ${String(doc.slug ?? doc.id)}`)
      }
    }
    if (page >= totalPages) break
    page++
  }
  return fixed
}

const main = async () => {
  const payload = await getPayload({ config })
  console.log('[published] memeriksa post...')
  const published = await fixPosts(payload, false)
  console.log('[draft] memeriksa post...')
  const drafts = await fixPosts(payload, true)
  const total = published + drafts
  console.log(
    total === 0
      ? 'Semua konten sudah benar. Tidak ada perubahan.'
      : `Selesai: ${published} published + ${drafts} draft diperbaiki.`,
  )
  process.exit(0)
}

main()
