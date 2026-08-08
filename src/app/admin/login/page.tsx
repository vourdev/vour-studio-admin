import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'

import { Logo } from '@/components/admin/logo'
import { LoginForm } from '@/components/admin/login-form'

export const metadata: Metadata = {
  title: 'Masuk — Vour Studio Admin',
}

export default async function LoginPage() {
  // Already authenticated? Skip the login screen.
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (user) redirect('/admin')

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex size-14 items-center justify-center rounded-xl text-foreground">
            <Logo className="size-14" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Vour Studio Admin</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Masuk untuk mengelola konten situs.
            </p>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
