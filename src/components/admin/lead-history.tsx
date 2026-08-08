import Link from 'next/link'
import { Clock, History, Inbox, UserRound } from 'lucide-react'

import type { Where } from 'payload'
import { getPayload } from 'payload'
import config from '@payload-config'

import type { Lead } from '@/payload-types'
import { formatDateTime, formatRelative } from '@/lib/format-date'
import { StatusBadge } from '@/components/admin/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * History context for a single lead. Renders a timeline of this lead's own
 * lifecycle (received → last updated → current status) plus every other lead
 * that came from the same email or WhatsApp number, so the admin can see at a
 * glance whether this contact has reached out before and how it went.
 *
 * Read-only — no schema changes, purely derived from existing data.
 */
export async function LeadHistory({ lead }: { lead: Lead }) {
  const payload = await getPayload({ config })

  const or: Where[] = [{ email: { equals: lead.email } }]
  if (lead.whatsapp) or.push({ whatsapp: { equals: lead.whatsapp } })

  const { docs } = await payload.find({
    collection: 'leads',
    where: { and: [{ or }, { id: { not_equals: lead.id } }] },
    sort: 'createdAt',
    limit: 50,
  })

  const related = docs

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="size-4" />
          Riwayat Kontak
        </CardTitle>
        <CardDescription>
          Aktivitas dari {lead.email}
          {lead.whatsapp ? ` atau ${lead.whatsapp}` : ''} — {related.length} kontak sebelumnya
          {related.length === 0 ? ' (kontak baru)' : ''}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Lead ini — lifecycle */}
        <section aria-label="Timeline lead ini">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <UserRound className="size-4" />
            Lead ini
          </h3>
          <ol className="relative space-y-4 border-l pl-5">
            <li className="relative">
              <span className="absolute -left-[25px] top-1 size-2.5 rounded-full border border-blue-500 bg-blue-500" />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">Lead diterima</p>
                <p className="text-xs text-muted-foreground" title={formatDateTime(lead.createdAt)}>
                  {formatRelative(lead.createdAt)}
                </p>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Dari halaman {lead.sourcePage || '/contact'} · {lead.message.slice(0, 80)}
                {lead.message.length > 80 ? '…' : ''}
              </p>
            </li>
            <li className="relative">
              <span className="absolute -left-[25px] top-1 size-2.5 rounded-full border border-muted-foreground bg-background" />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">Status saat ini</p>
                <StatusBadge status={lead.status} type="lead" />
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Terakhir diperbarui {formatRelative(lead.updatedAt)}.
              </p>
            </li>
          </ol>
        </section>

        {/* Kontak sebelumnya */}
        <section aria-label="Kontak sebelumnya">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Inbox className="size-4" />
            Kontak sebelumnya
          </h3>
          {related.length === 0 ? (
            <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
              Belum ada lead lain dari kontak ini.
            </p>
          ) : (
            <ol className="relative space-y-4 border-l pl-5">
              {related.map((item) => (
                <li key={item.id} className="relative">
                  <span className="absolute -left-[25px] top-1 size-2.5 rounded-full border border-muted-foreground bg-background" />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Clock className="size-3.5 text-muted-foreground" />
                      <p className="text-sm" title={formatDateTime(item.createdAt)}>
                        {formatRelative(item.createdAt)}
                      </p>
                      <StatusBadge status={item.status} type="lead" />
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/leads/${item.id}`}>Lihat</Link>
                    </Button>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.message.slice(0, 100)}
                    {item.message.length > 100 ? '…' : ''}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </CardContent>
    </Card>
  )
}
