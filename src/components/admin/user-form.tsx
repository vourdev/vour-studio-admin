'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import type { User } from '@/payload-types'
import { PERMISSIONABLE_COLLECTIONS, type PermissionCollection } from '@/lib/permissions'
import { create, update } from '@/lib/admin-api'
import { PasswordInput } from '@/components/admin/password-input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type PermissionDraft = Record<PermissionCollection, { canRead: boolean; canWrite: boolean }>

const emptyPermissions = (): PermissionDraft =>
  Object.fromEntries(
    PERMISSIONABLE_COLLECTIONS.map(({ slug }) => [slug, { canRead: false, canWrite: false }]),
  ) as PermissionDraft

const fromUser = (user?: User): PermissionDraft => {
  const base = emptyPermissions()
  if (!user?.permissions) return base
  for (const p of user.permissions) {
    if (p.collection in base) {
      base[p.collection as PermissionCollection] = {
        canRead: Boolean(p.canRead),
        canWrite: Boolean(p.canWrite),
      }
    }
  }
  return base
}

type UserDraft = {
  name: string
  email: string
  password: string
  roles: ('admin' | 'editor')[]
  permissions: PermissionDraft
}

export function UserForm({ user }: { user?: User }) {
  const router = useRouter()
  const isEdit = Boolean(user)
  const isTargetAdmin = Boolean(user?.roles?.includes('admin'))

  const [data, setData] = useState<UserDraft>({
    name: user?.name ?? '',
    email: user?.email ?? '',
    // Users.password is virtual: the REST create/update path feeds it into
    // Payload's auth hashing when provided; empty keeps the old password.
    password: '',
    roles: user?.roles ?? ['editor'],
    permissions: fromUser(user),
  })
  const [saving, setSaving] = useState(false)

  const toggleRole = (role: 'admin' | 'editor', checked: boolean) => {
    setData((prev) => ({
      ...prev,
      roles: checked ? [...prev.roles, role] : prev.roles.filter((r) => r !== role),
    }))
  }

  const setPermission = (
    collection: PermissionCollection,
    key: 'canRead' | 'canWrite',
    checked: boolean,
  ) => {
    setData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [collection]: { ...prev.permissions[collection], [key]: checked },
      },
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Only non-empty entries are sent; entries without any access are omitted.
      const permissions = Object.entries(data.permissions)
        .filter(([, v]) => v.canRead || v.canWrite)
        .map(([collection, v]) => ({
          collection,
          canRead: v.canRead,
          canWrite: v.canWrite,
        }))

      const payload: Record<string, unknown> = {
        name: data.name,
        email: data.email,
        roles: data.roles,
        permissions,
      }
      if (isEdit) {
        if (data.password) payload.password = data.password
        await update<User>('users', user!.id, payload)
        toast.success('Pengguna berhasil diperbarui.')
      } else {
        payload.password = data.password
        await create<User>('users', payload)
        toast.success('Pengguna berhasil dibuat.')
      }
      router.push('/admin/users')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan pengguna.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/admin/users')} aria-label="Kembali">
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {isEdit ? 'Edit Pengguna' : 'Pengguna Baru'}
          </h1>
          <p className="text-sm text-muted-foreground">Kelola akses admin panel.</p>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Data Pengguna</CardTitle>
            <CardDescription>Email dan kata sandi untuk masuk dashboard.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama *</Label>
              <Input
                id="name"
                value={data.name}
                onChange={(e) => setData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Nama lengkap"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={data.email}
                onChange={(e) => setData((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="nama@vour.studio"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                {isEdit ? 'Kata sandi baru' : 'Kata sandi'} {isEdit ? '' : '*'}
              </Label>
              <PasswordInput
                id="password"
                autoComplete="new-password"
                value={data.password}
                onChange={(e) => setData((prev) => ({ ...prev, password: e.target.value }))}
                placeholder={isEdit ? 'Kosongkan untuk mempertahankan' : 'Min. 8 karakter'}
              />
              {isEdit && (
                <p className="text-xs text-muted-foreground">
                  Kosongkan untuk mempertahankan kata sandi lama.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Peran</Label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={data.roles.includes('admin')}
                    onCheckedChange={(checked) => toggleRole('admin', Boolean(checked))}
                  />
                  Admin
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={data.roles.includes('editor')}
                    onCheckedChange={(checked) => toggleRole('editor', Boolean(checked))}
                  />
                  Editor
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                Admin otomatis punya akses penuh ke semua koleksi.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-4" />
              Izin per Koleksi
            </CardTitle>
            <CardDescription>
              Hak akses untuk peran editor. Centang Baca untuk melihat, Tulis untuk membuat,
              mengubah, dan menghapus. {isTargetAdmin ? 'Admin punya akses penuh — abaikan.' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Koleksi</TableHead>
                  <TableHead className="w-20 text-center">Baca</TableHead>
                  <TableHead className="w-20 text-center">Tulis</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {PERMISSIONABLE_COLLECTIONS.map(({ slug, label }) => {
                  const perm = data.permissions[slug]
                  return (
                    <TableRow key={slug}>
                      <TableCell className="font-medium">{label}</TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          aria-label={`Baca ${label}`}
                          checked={perm.canRead}
                          onCheckedChange={(checked) =>
                            setPermission(slug, 'canRead', Boolean(checked))
                          }
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          aria-label={`Tulis ${label}`}
                          checked={perm.canWrite}
                          onCheckedChange={(checked) =>
                            setPermission(slug, 'canWrite', Boolean(checked))
                          }
                        />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            <p className="mt-3 text-xs text-muted-foreground">
              Tanpa centang = tidak ada akses ke koleksi tersebut.
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2 pb-8">
          <Button variant="outline" onClick={() => router.push('/admin/users')} disabled={saving}>
            Batal
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            {isEdit ? 'Simpan Perubahan' : 'Buat Pengguna'}
          </Button>
        </div>
      </div>
    </div>
  )
}
