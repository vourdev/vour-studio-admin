import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Suspense } from 'react'

import type { User } from '@/payload-types'

import { getPayload } from 'payload'
import config from '@payload-config'

import { canRead, canWrite, type PermissionCollection } from '@/lib/permissions'
import { getCurrentUser } from '@/lib/get-current-user'
import { StatusBadge } from '@/components/admin/status-badge'
import { PageHeader } from '@/components/admin/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// Only collection slugs (globals like site-settings are not countable here).
type DashboardCollection = Exclude<PermissionCollection, 'site-settings'>

const statCards: { label: string; href: string; collection: DashboardCollection }[] = [
  { label: 'Postingan', href: '/admin/posts', collection: 'posts' },
  { label: 'Produk', href: '/admin/products', collection: 'products' },
  { label: 'Projects', href: '/admin/projects', collection: 'projects' },
  { label: 'Media', href: '/admin/media', collection: 'media' },
  { label: 'Leads', href: '/admin/leads', collection: 'leads' },
]

function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="py-5">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="mt-2 h-8 w-10" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

async function DashboardStats({ user }: { user: User | null }) {
  const payload = await getPayload({ config })

  const visibleCards = statCards.filter(({ collection }) => canRead(user, collection))

  const counts = await Promise.all(
    visibleCards.map(async ({ href, label, collection }) => {
      const { totalDocs } = await payload.count({ collection })
      return { label, href, total: totalDocs }
    }),
  )

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {counts.map(({ label, href, total }) => (
        <Link key={href} href={href} className="group">
          <Card className="transition-colors group-hover:border-primary/50">
            <CardContent className="py-5">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums">{total}</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}

function RecentLeadsSkeleton() {
  return (
    <Card className="mt-6">
      <CardHeader>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-72" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

async function RecentLeads({ user }: { user: User | null }) {
  if (!canRead(user, 'leads')) return null

  const payload = await getPayload({ config })
  const { docs: recentLeads } = await payload.find({
    collection: 'leads',
    limit: 6,
    sort: '-createdAt',
  })

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Leads terbaru</CardTitle>
        <CardDescription>Pesan terbaru dari form kontak marketing site.</CardDescription>
      </CardHeader>
      <CardContent>
        {recentLeads.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Belum ada leads masuk.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Sumber</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tanggal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentLeads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.name}</TableCell>
                  <TableCell>{lead.email}</TableCell>
                  <TableCell>{lead.sourcePage}</TableCell>
                  <TableCell>
                    <StatusBadge status={lead.status} type="lead" />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(lead.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

export default async function DashboardPage() {
  const user = await getCurrentUser()

  return (
    <div>
      <PageHeader
        title={`Halo, ${user?.name || 'Admin'} 👋`}
        description="Ringkasan aktivitas konten Vour Studio."
      >
        {canWrite(user, 'posts') ? (
          <Button asChild>
            <Link href="/admin/posts/new">
              <Plus className="size-4" />
              Postingan Baru
            </Link>
          </Button>
        ) : null}
      </PageHeader>

      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStats user={user} />
      </Suspense>

      <Suspense fallback={<RecentLeadsSkeleton />}>
        <RecentLeads user={user} />
      </Suspense>
    </div>
  )
}
