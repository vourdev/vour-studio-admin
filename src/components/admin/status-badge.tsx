import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const postStatusStyles: Record<string, string> = {
  published: 'border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300',
  draft: 'border-transparent bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300',
  changed: 'border-transparent bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300',
}

const productStatusStyles: Record<string, string> = {
  available: 'border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300',
  soon: 'border-transparent bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300',
}

const leadStatusStyles: Record<string, string> = {
  new: 'border-transparent bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300',
  contacted: 'border-transparent bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300',
  closed: 'border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300',
  archived: 'border-transparent bg-muted text-muted-foreground',
}

const labels: Record<string, string> = {
  published: 'Published',
  draft: 'Draft',
  changed: 'Changed',
  available: 'Tersedia',
  soon: 'Segera',
  new: 'Baru',
  contacted: 'Dihubungi',
  closed: 'Selesai',
  archived: 'Diarsipkan',
}

export function StatusBadge({
  status,
  type = 'post',
}: {
  status?: string | null
  type?: 'post' | 'product' | 'lead'
}) {
  if (!status) return null
  const styles =
    type === 'post'
      ? postStatusStyles
      : type === 'product'
        ? productStatusStyles
        : leadStatusStyles

  return (
    <Badge variant="outline" className={cn(styles[status], 'border-transparent')}>
      {labels[status] ?? status}
    </Badge>
  )
}
