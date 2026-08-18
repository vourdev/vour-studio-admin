import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { Resend } from 'resend'

import { db } from '@/db'
import { leads } from '@/db/schema'
import { createCrudHandlers } from '@/lib/crud'
import { renderLeadNotification } from '@/emails/lead-notification'

const leadSchema = z.object({
  name: z.string().trim().min(2, 'Nama minimal 2 karakter.').max(120),
  email: z.email('Format email belum benar.').max(200),
  whatsapp: z
    .string()
    .trim()
    .max(30)
    .regex(/^[0-9+\-\s()]*$/, 'Nomor WhatsApp hanya boleh berisi angka.')
    .optional()
    .or(z.literal('')),
  message: z
    .string()
    .trim()
    .min(20, 'Ceritakan sedikit lebih detail, minimal 20 karakter.')
    .max(4000),
  sourcePage: z.string().max(200).default('/contact'),
  company: z.string().max(0).optional().or(z.literal('')),
  elapsedMs: z.coerce.number().nonnegative().default(0),
})

const MIN_FILL_MS = 2000

const defaultHandlers = createCrudHandlers(leads, 'leads')
export const GET = defaultHandlers.GET
export const DELETE = defaultHandlers.DELETE

export async function POST(request: NextRequest) {
  // Shared-secret authentication for public endpoint.
  const apiKey = process.env.LEAD_API_KEY
  if (!apiKey) {
    return Response.json({ error: 'Server tidak dikonfigurasi untuk menerima lead.' }, { status: 503 })
  }
  if (request.headers.get('x-api-key') !== apiKey) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Bad Request' }, { status: 400 })
  }

  const parsed = leadSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: 'Ada isian yang perlu diperbaiki.', fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 422 },
    )
  }

  const data = parsed.data

  if (data.company) return Response.json({ ok: true }, { status: 201 })
  if (data.elapsedMs > 0 && data.elapsedMs < MIN_FILL_MS) {
    return Response.json({ ok: true }, { status: 201 })
  }

  try {
    await db.insert(leads).values({
      name: data.name,
      email: data.email,
      whatsapp: data.whatsapp || '',
      message: data.message,
      sourcePage: data.sourcePage,
      status: 'new',
    })
  } catch (error) {
    console.error('[lead] gagal menyimpan lead:', error)
    return Response.json({ error: 'Gagal menyimpan lead.' }, { status: 500 })
  }

  const resendKey = process.env.RESEND_API_KEY
  if (resendKey) {
    try {
      const email = renderLeadNotification({ ...data, whatsapp: data.whatsapp || undefined })
      await new Resend(resendKey).emails.send({
        from: process.env.RESEND_FROM ?? 'Vour <onboarding@resend.dev>',
        to: email.to,
        replyTo: email.replyTo,
        subject: email.subject,
        html: email.html,
        text: email.text,
      })
    } catch (error) {
      console.error('[lead] gagal mengirim notifikasi Resend:', error)
    }
  }

  return Response.json({ ok: true }, { status: 201 })
}
