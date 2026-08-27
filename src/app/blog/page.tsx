import Link from 'next/link'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { blogPosts } from '@/db/schema'
import { ArrowLeft, ArrowUpRight, Clock, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Blog & Dev Notes | Vour Studio',
  description: 'Artikel teknis, tutorial, dan studi kasus arsitektur software dari Vour Studio.',
}

export default async function BlogIndexPage() {
  const posts = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.status, 'published'))
    .orderBy(desc(blogPosts.publishedAt))

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card/40 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-sm font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
            Dashboard Admin
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs text-primary">
              <Sparkles className="mr-1 size-3" />
              Auto-Generated Engine
            </Badge>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="mb-12">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
            VOUR.DEV INSIGHTS
          </span>
          <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight font-mono">
            Blog & Dev Notes
          </h1>
          <p className="mt-2 text-muted-foreground">
            Artikel teknis dan referensi pengembangan software yang diekspansi langsung dari Topic Bank.
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <p className="text-muted-foreground text-sm">
              Belum ada artikel blog yang dipublikasikan.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Jalankan generator via <code>npm run generate:blog</code> atau trigger API endpoint.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group relative flex flex-col justify-between rounded-xl border border-border/60 bg-card p-6 transition-all duration-300 hover:border-primary/50 hover:shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center rounded-md border border-border bg-muted/60 px-2 py-0.5 font-mono text-xs font-medium text-foreground">
                      {post.category || 'Dev Notes'}
                    </span>
                    {post.readingMinutes ? (
                      <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground">
                        <Clock className="size-3" />
                        {post.readingMinutes} min read
                      </span>
                    ) : null}
                  </div>

                  <h2 className="text-lg font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary leading-snug">
                    {post.title}
                  </h2>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-border/40 pt-4 text-xs font-mono text-muted-foreground group-hover:text-foreground">
                  <span>
                    {post.publishedAt
                      ? new Date(post.publishedAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Draft'}
                  </span>
                  <span className="inline-flex items-center gap-1 text-primary">
                    Baca artikel
                    <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
