type LeadEmailInput = {
  name: string
  email: string
  whatsapp?: string
  message: string
  sourcePage: string
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Plain inline-styled HTML rather than React Email.
 *
 * `@react-email/components` is published as deprecated ("Package no longer
 * supported"), so this renders the same result with no dependency. Every
 * interpolated value is visitor-supplied, so all of it is escaped.
 */
export function renderLeadNotification(lead: LeadEmailInput) {
  const rows: [string, string][] = [
    ['Nama', lead.name],
    ['Email', lead.email],
    ['WhatsApp', lead.whatsapp || 'tidak diisi'],
    ['Halaman', lead.sourcePage],
  ]

  const html = `<!doctype html>
<html lang="id">
  <body style="margin:0;background:#f4f4f5;padding:32px 16px;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;color:#18181b;">
    <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;">
      <tr>
        <td style="padding:28px 28px 8px;">
          <p style="margin:0;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#71717a;">
            Vour / lead baru
          </p>
          <h1 style="margin:12px 0 0;font-size:20px;line-height:1.3;font-weight:600;">
            ${escapeHtml(lead.name)} mengirim pesan lewat website
          </h1>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 28px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="font-size:14px;">
            ${rows
              .map(
                ([label, value]) => `<tr>
              <td style="padding:6px 0;color:#52525b;width:170px;vertical-align:top;">${escapeHtml(label)}</td>
              <td style="padding:6px 0;color:#18181b;">${escapeHtml(value)}</td>
            </tr>`,
              )
              .join('')}
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 28px 28px;">
          <p style="margin:0 0 8px;font-size:14px;color:#52525b;">Pesan</p>
          <div style="white-space:pre-wrap;border-left:3px solid #39d5f6;padding:2px 0 2px 14px;font-size:14px;line-height:1.6;">${escapeHtml(lead.message)}</div>
          <p style="margin:24px 0 0;font-size:13px;">
            <a href="mailto:${escapeHtml(lead.email)}" style="color:#0e7490;">Balas ke ${escapeHtml(lead.email)}</a>
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`

  const text = [
    `Lead baru dari website Vour`,
    '',
    ...rows.map(([label, value]) => `${label}: ${value}`),
    '',
    'Pesan:',
    lead.message,
    '',
    `Balas ke: ${lead.email}`,
  ].join('\n')

  return {
    subject: `Lead baru: ${lead.name}`,
    html,
    text,
    replyTo: lead.email,
    // Fallback matches the marketing site's CONTACT_EMAIL (lib/site.ts) so
    // notifications land in the same inbox even before env is configured.
    to: process.env.LEAD_NOTIFICATION_EMAIL || 'vour.d3v@gmail.com',
  }
}
