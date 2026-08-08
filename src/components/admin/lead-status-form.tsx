'use client'

import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { update } from '@/lib/admin-api'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const options = [
  { value: 'new', label: 'Baru' },
  { value: 'contacted', label: 'Dihubungi' },
  { value: 'closed', label: 'Selesai' },
  { value: 'archived', label: 'Diarsipkan' },
]

export function LeadStatusForm({
  leadId,
  status,
  canWrite = false,
}: {
  leadId: number
  status?: string | null
  canWrite?: boolean
}) {
  const [value, setValue] = useState(status ?? 'new')
  const [saving, setSaving] = useState(false)

  const handleChange = async (next: string) => {
    setValue(next)
    setSaving(true)
    try {
      await update('leads', leadId, { status: next })
      toast.success('Status lead diperbarui.')
    } catch (error) {
      setValue(status ?? 'new')
      toast.error(error instanceof Error ? error.message : 'Gagal memperbarui status.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={value} onValueChange={(v) => void handleChange(v)} disabled={saving || !canWrite}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Pilih status" />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {saving ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : null}
    </div>
  )
}
