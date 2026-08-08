/** Shared date formatting for the admin dashboard (locale id-ID). */

export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatRelative(value: string): string {
  const diff = Date.now() - new Date(value).getTime()
  const hours = Math.floor(diff / 3_600_000)
  if (hours < 1) return 'baru saja'
  if (hours < 24) return `${hours} jam lalu`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} hari lalu`
  return formatDateTime(value)
}
