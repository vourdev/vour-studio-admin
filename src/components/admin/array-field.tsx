'use client'

import { Plus, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/**
 * Edits an array of objects that each have a single text value under `field`.
 * Used for products.features, projects.technology, site-settings.socials etc.
 * Each row is keyed by its row id so rows survive unrelated re-renders.
 */
export function ArrayField({
  label,
  items,
  field,
  onChange,
  addLabel = 'Tambah baris',
  placeholder,
  max,
}: {
  label?: string
  items: { id?: string | null; [key: string]: unknown }[] | null | undefined
  field: string
  onChange: (items: { id?: string | null; [key: string]: unknown }[]) => void
  addLabel?: string
  placeholder?: string
  max?: number
}) {
  const rows = items ?? []
  const atMax = max != null && rows.length >= max

  const updateRow = (index: number, text: string) => {
    const next = rows.map((row, i) => (i === index ? { ...row, [field]: text } : row))
    onChange(next)
  }

  const removeRow = (index: number) => {
    onChange(rows.filter((_, i) => i !== index))
  }

  const addRow = () => {
    onChange([...rows, { [field]: '' }])
  }

  return (
    <div className="space-y-2">
      {label ? <div className="text-sm font-medium">{label}</div> : null}
      <div className="space-y-2">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada item.</p>
        ) : (
          rows.map((row, index) => (
            <div key={row.id ?? `row-${index}`} className="flex items-center gap-2">
              <Input
                value={String(row[field] ?? '')}
                placeholder={placeholder}
                onChange={(e) => updateRow(index, e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => removeRow(index)}
                aria-label="Hapus baris"
              >
                <X className="size-4" />
              </Button>
            </div>
          ))
        )}
      </div>
      {!atMax && (
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          <Plus className="size-4" />
          {addLabel}
        </Button>
      )}
    </div>
  )
}
