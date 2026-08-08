import Link from 'next/link'
import { FileText, FolderKanban, Images, Inbox, Package, Plus } from 'lucide-react'

import { getPayload } from 'payload'
import config from '@payload-config'

import { canRead, canWrite, type PermissionCollection } from '@/lib/permissions'
import { getCurrentUser } from '@/lib/get-current-user'
import { StatusBadge } from '@/components/admin/status-badge'
import { PageHeader } from '@/components/admin/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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

const statCards: { label: string; href: string; icon: typeof FileText; collection: DashboardCollection }[] = [
  { label: 'Postingan', href: '/admin/posts', icon: FileText, collection: 'posts' },
  { label: 'Produk', href: '/admin/products', icon: Package, collection: 'products' },
  { label: 'Projects', href: '/admin/projects', icon: FolderKanban, collection: 'projects' },
  { label: 'Media', href: '/admin/media', icon: Images, collection: 'media' },
  { label: 'Leads', href: '/admin/leads', icon: Inbox, collection: 'leads' },
]

export default async function DashboardPage() {
  const user = await getCurrentUser()
  const payload = await getPayload({ config })

  const visibleCards = statCards.filter(({ collection }) => canRead(user, collection))

  const counts = await Promise.all(
    visibleCards.map(async ({ href, label, collection }) => {
      const { totalDocs } = await payload.count({ collection })
      return { label, href, icon: null, total: totalDocs }
    }),
  )

  const recentLeads = canRead(user, 'leads')
    ? (
        await payload.find({
          collection: 'leads',
          limit: 6,
          sort: '-createdAt',
        })
      ).docs
    : []

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

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Leads terbaru</CardTitle>
          <CardDescription>Pesan terbaru dari form kontak marketing site.</CardDescription>
        </CardHeader>
        <CardContent>
          {recentLeads.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Belum ada leads masuk.
            </p>
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
    </div>
  )
}
