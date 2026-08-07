'use client'

import { FieldDescription, FieldError, FieldLabel, useField } from '@payloadcms/ui'
import type { Validate } from 'payload'
import type { ChangeEvent } from 'react'
import { useState } from 'react'

/** Formats a number as Indonesian Rupiah without the symbol, e.g. 12000 -> "12.000". */
const formatIdr = (value: number): string =>
  new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(value)

type PriceFieldProps = {
  field: {
    label?: string
    required?: boolean
    admin?: { description?: string }
  }
  path: string
  readOnly?: boolean
  validate?: Validate
}

/**
 * Rupiah price input for the admin panel: shows a "Rp" prefix and formats the
 * typed number with thousand separators (12000 -> "12.000") while the stored
 * value stays a plain number (so the marketing site API keeps returning
 * `price: number | null`).
 *
 * While the input is focused it shows the draft the user is editing; on blur it
 * snaps back to the formatted value derived from the form state — no effects,
 * no setState-in-effect.
 */
export function PriceInput({ field, path, readOnly, validate }: PriceFieldProps) {
  const { value, setValue, showError, errorMessage } = useField<number | null>({
    path,
    validate,
  })
  const [focused, setFocused] = useState(false)
  const [draft, setDraft] = useState('')

  const displayText = focused
    ? draft
    : typeof value === 'number'
      ? formatIdr(value)
      : ''

  const handleFocus = () => {
    setFocused(true)
    setDraft(typeof value === 'number' ? formatIdr(value) : '')
  }

  const handleBlur = () => {
    setFocused(false)
    setDraft('')
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const digits = event.target.value.replace(/\D/g, '')
    const next = digits ? Number(digits) : null
    setValue(next)
    setDraft(next === null ? '' : formatIdr(next))
  }

  return (
    <div className="field-type">
      <FieldLabel htmlFor={path} label={field.label} required={field.required} />
      <div
        className="input-wrapper"
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
      >
        <span
          aria-hidden
          style={{
            flexShrink: 0,
            color: 'var(--theme-elevation-500)',
            fontSize: '1rem',
          }}
        >
          Rp
        </span>
        <input
          id={path}
          className="input"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={displayText}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={readOnly}
          placeholder="0"
          style={{ flex: 1, minWidth: 0 }}
        />
      </div>
      <FieldDescription path={path} description={field.admin?.description} />
      <FieldError message={errorMessage} showError={showError} />
    </div>
  )
}
