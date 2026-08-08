import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Mail, MessageSquare, Phone } from 'lucide-react'

import { getPayload } from 'payload'
import config from '@payload-config'

import { canRead, canWrite } from '@/lib/permissions'
import { getCurrentUser } from '@/lib/get-current-user'
import { LeadStatusForm } from '@/components/admin/lead-status-form'
import { DeleteLeadButton } from '@/components/admin/delete-lead-button'
import { LeadReplyCard } from '@/components/admin/lead-reply-card'
import { LeadHistory } from '@/components/admin/lead-history'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Detail Lead — Vour Studio Admin',
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!canRead(user, 'leads')) notFound()

  const payload = await getPayload({ config })
  const lead = await payload.findByID({ collection: 'leads', id }).catch(() => null)
  if (!lead) notFound()

  const write = canWrite(user, 'leads')

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/leads" aria-label="Kembali">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">{lead.name}</h1>
          <p className="text-sm text-muted-foreground">
            Diterima{' '}
            {new Date(lead.createdAt).toLocaleString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        {write ? <DeleteLeadButton leadId={lead.id} /> : null}
      </div>

      <div className="space-y-6">
        <LeadReplyCard lead={lead} />

        <Card>
          <CardHeader>
            <CardTitle>Kontak</CardTitle>
            <CardDescription>Informasi kontak pengirim.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <Mail className="size-4 text-muted-foreground" />
              <a href={`mailto:${lead.email}`} className="hover:underline">
                {lead.email}
              </a>
            </div>
            {lead.whatsapp ? (
              <div className="flex items-center gap-3">
                <Phone className="size-4 text-muted-foreground" />
                <a
                  href={`https://wa.me/${lead.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline"
                >
                  {lead.whatsapp}
                </a>
              </div>
            ) : null}
            <div className="flex items-center gap-3 text-muted-foreground">
              <span className="size-4" />
              Sumber: {lead.sourcePage || '/contact'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="size-4" />
              Pesan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{lead.message}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
            <CardDescription>Perbarui progres penanganan lead ini.</CardDescription>
          </CardHeader>
          <CardContent>
            <LeadStatusForm leadId={lead.id} status={lead.status} canWrite={write} />
          </CardContent>
        </Card>

        <LeadHistory lead={lead} />
      </div>
    </div>
  )
}
