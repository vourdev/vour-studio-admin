'use client'

import { useState } from 'react'

import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

/** Formats a number as Indonesian Rupiah without the symbol, e.g. 12000 -> "12.000". */
const formatIdr = (value: number): string =>
  new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(value)

export function PriceInput({
  value,
  onChange,
  disabled,
  className,
  placeholder = '0',
  id,
}: {
  value: number | null | undefined
  onChange: (value: number | null) => void
  disabled?: boolean
  className?: string
  placeholder?: string
  id?: string
}) {
  const [focused, setFocused] = useState(false)
  const [draft, setDraft] = useState('')

  const displayText = focused
    ? draft
    : typeof value === 'number' && value !== null
      ? formatIdr(value)
      : ''

  return (
    <div className={cn('relative', className)}>
      <span
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
      >
        Rp
      </span>
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={displayText}
        placeholder={placeholder}
        disabled={disabled}
        className="pl-10"
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, '')
          const next = digits ? Number(digits) : null
          onChange(next)
          setDraft(next === null ? '' : formatIdr(next))
        }}
        onFocus={() => {
          setFocused(true)
          setDraft(typeof value === 'number' && value !== null ? formatIdr(value) : '')
        }}
        onBlur={() => {
          setFocused(false)
          setDraft('')
        }}
      />
    </div>
  )
}
