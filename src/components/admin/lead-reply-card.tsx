import { Mail, MessageCircle } from 'lucide-react'

import type { Lead } from '@/payload-types'
import { formatDateTime } from '@/lib/format-date'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Builds a `mailto:` URL pre-filled with the lead's context so the admin can
 * reply straight from their email client: subject references the lead, and the
 * body quotes the original message plus source metadata.
 */
function buildMailtoUrl(lead: Lead): string {
  const subject = `Re: Pesan dari ${lead.name} — Vour Studio`
  const body = [
    `Halo ${lead.name},`,
    '',
    '[Tulis balasan Anda di sini]',
    '',
    '---',
    'Pesan asli:',
    `Dari: ${lead.name} <${lead.email}>`,
    lead.whatsapp ? `WhatsApp: ${lead.whatsapp}` : null,
    `Sumber: ${lead.sourcePage || '/contact'}`,
    `Dikirim: ${formatDateTime(lead.createdAt)}`,
    '',
    lead.message,
  ]
    .filter(Boolean)
    .join('\n')

  return `mailto:${lead.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export function LeadReplyCard({ lead }: { lead: Lead }) {
  const mailto = buildMailtoUrl(lead)
  const waNumber = lead.whatsapp?.replace(/\D/g, '')

  return (
    <Card>
      <CardHeader>
        <CardTitle>Balas</CardTitle>
        <CardDescription>Balas langsung dari aplikasi email atau WhatsApp Anda.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button asChild>
          <a href={mailto}>
            <Mail className="size-4" />
            Balas via Email
          </a>
        </Button>
        {waNumber ? (
          <Button asChild variant="outline">
            <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noreferrer">
              <MessageCircle className="size-4" />
              Balas via WhatsApp
            </a>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}
