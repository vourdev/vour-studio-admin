'use client'

import { FieldDescription, FieldError, FieldLabel, useField } from '@payloadcms/ui'
import type { Validate } from 'payload'
import type { ChangeEvent } from 'react'
import { useState } from 'react'

type PasswordFieldProps = {
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
 * Password input for the Users collection with a show/hide toggle (eye icon).
 *
 * The field is declared `virtual: true` in the collection config (Payload auth
 * stores passwords as salt+hash, there is no `password` column in the DB), so
 * the value below flows through `data.password` into the auth hashing logic
 * exactly like Payload's built-in handling.
 *
 * Payload's hardcoded auth block (email + built-in password fields) still
 * renders above the fields list, which would duplicate the password input.
 * The <style> below hides that built-in block (and its "Change Password"
 * button) so this eye-toggle field is the only password control. Note: it
 * relies on Payload's internal class names — re-check on Payload upgrades.
 */
export function PasswordInput({
  field,
  path,
  readOnly,
  validate,
}: PasswordFieldProps) {
  const { value, setValue, showError, errorMessage } = useField<string>({
    path,
    validate,
  })
  const [show, setShow] = useState(false)

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value)
  }

  return (
    <>
      <style>{`
        .collection-edit__auth .auth-fields__changing-password,
        .collection-edit__auth #change-password {
          display: none !important;
        }
      `}</style>
      <div className="field-type">
        <FieldLabel htmlFor={path} label={field.label} required={field.required} />
        <div
          className="input-wrapper"
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <input
            id={path}
            className="input"
            type={show ? 'text' : 'password'}
            autoComplete="new-password"
            value={value || ''}
            onChange={handleChange}
            disabled={readOnly}
            style={{ flex: 1, minWidth: 0, paddingRight: '2.5rem' }}
          />
          <button
            type="button"
            onClick={() => setShow((prev) => !prev)}
            aria-label={show ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
            aria-pressed={show}
            style={{
              marginLeft: '-2rem',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '2rem',
              height: '2rem',
              padding: 0,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--theme-elevation-500)',
            }}
          >
            {show ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
        <FieldDescription path={path} description={field.admin?.description} />
        <FieldError message={errorMessage} showError={showError} />
      </div>
    </>
  )
}
