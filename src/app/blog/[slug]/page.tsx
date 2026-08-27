import { notFound } from 'next/navigation'
import Link from 'next/link'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { blogPosts } from '@/db/schema'
import { MarkdownContent } from '@/components/blog/markdown-content'
import { ArrowLeft, Clock, Calendar, Hash } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const [post] = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.slug, slug))
    .limit(1)

  if (!post) {
    return {
      title: 'Artikel Tidak Ditemukan',
    }
  }

  return {
    title: `${post.title} | Vour Studio Blog`,
    description: `Baca artikel "${post.title}" di Vour Studio Blog.`,
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params

  const [post] = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.slug, slug))
    .limit(1)

  if (!post || post.status !== 'published') {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar navigation */}
      <header className="border-b bg-card/40 backdrop-blur-md sticky top-0 z-10">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/blog"
            className="flex items-center gap-2 text-xs sm:text-sm font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
            Semua Artikel
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="text-xs font-mono text-muted-foreground hover:underline"
            >
              Admin
            </Link>
          </div>
        </div>
      </header>

      {/* Main Article Container */}
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <article className="space-y-8">
          {/* Article Header */}
          <header className="space-y-4 border-b border-border/60 pb-8">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className="font-mono text-xs font-medium">
                {post.category || 'Dev Notes'}
              </Badge>
              {post.readingMinutes ? (
                <span className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                  <Clock className="size-3.5" />
                  {post.readingMinutes} menit membaca
                </span>
              ) : null}
              {post.remoteTopicId ? (
                <span className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground/80">
                  <Hash className="size-3" />
                  Topic #{post.remoteTopicId}
                </span>
              ) : null}
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight font-mono text-foreground leading-[1.2]">
              {post.title}
            </h1>

            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <Calendar className="size-3.5" />
              <span>
                Dipublikasikan pada{' '}
                {post.publishedAt
                  ? new Date(post.publishedAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : 'Draft'}
              </span>
            </div>
          </header>

          {/* Article Content Render */}
          <div className="prose prose-zinc dark:prose-invert max-w-none">
            <MarkdownContent content={post.content} />
          </div>

          {/* Article Footer */}
          <footer className="mt-16 border-t border-border/60 pt-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border bg-card/60 p-6">
              <div>
                <p className="text-sm font-semibold font-mono">Vour Studio Generator</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Artikel ini di-generate otomatis via integrasi Topic Bank & Omniroute LLM.
                </p>
              </div>
              <Link
                href="/blog"
                className="inline-flex items-center justify-center rounded-lg border bg-background px-4 py-2 text-xs font-mono font-medium text-foreground hover:bg-muted transition-colors shrink-0"
              >
                ← Kembali ke Blog
              </Link>
            </div>
          </footer>
        </article>
      </main>
    </div>
  )
}
