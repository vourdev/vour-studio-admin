'use client'

import { Loader2, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import type { SiteSetting } from '@/payload-types'
import { updateGlobal } from '@/lib/admin-api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type SocialRow = { label: string; href: string; icon: 'github' | 'linkedin' | 'instagram' | 'tiktok' }
type NavRow = { label: string; href: string }

export function SiteSettingsForm({
  settings,
  canWrite = false,
}: {
  settings: SiteSetting
  canWrite?: boolean
}) {
  const [contact, setContact] = useState({
    whatsappNumber: settings.contact?.whatsappNumber ?? '',
    phoneNumber: settings.contact?.phoneNumber ?? '',
    contactEmail: settings.contact?.contactEmail ?? '',
  })
  const [socials, setSocials] = useState<SocialRow[]>(
    settings.socials?.map((s) => ({ label: s.label, href: s.href, icon: s.icon })) ?? [],
  )
  const [mainNav, setMainNav] = useState<NavRow[]>(
    settings.mainNav?.map((n) => ({ label: n.label, href: n.href })) ?? [],
  )
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateGlobal('site-settings', {
        contact,
        socials: socials.map((s) => ({ ...s })) || null,
        mainNav: mainNav.map((n) => ({ ...n })) || null,
      })
      toast.success('Pengaturan situs disimpan.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan pengaturan.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Kontak</CardTitle>
          <CardDescription>Nomor dan email yang ditampilkan marketing site.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="whatsapp">Nomor WhatsApp (internasional, tanpa +)</Label>
            <Input
              id="whatsapp"
              value={contact.whatsappNumber}
              disabled={!canWrite}
              onChange={(e) => setContact((prev) => ({ ...prev, whatsappNumber: e.target.value }))}
              placeholder="6287787388296"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Nomor telepon (tampilan)</Label>
            <Input
              id="phone"
              value={contact.phoneNumber}
              disabled={!canWrite}
              onChange={(e) => setContact((prev) => ({ ...prev, phoneNumber: e.target.value }))}
              placeholder="087787388296"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email kontak</Label>
            <Input
              id="email"
              type="email"
              value={contact.contactEmail}
              disabled={!canWrite}
              onChange={(e) => setContact((prev) => ({ ...prev, contactEmail: e.target.value }))}
              placeholder="vour.d3v@gmail.com"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Media sosial</CardTitle>
          <CardDescription>Tautan media sosial di footer situs.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {socials.map((row, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <Input
                className="flex-1 basis-32"
                placeholder="Label (mis. GitHub)"
                value={row.label}
                disabled={!canWrite}
                onChange={(e) => {
                  const next = [...socials]
                  next[i] = { ...row, label: e.target.value }
                  setSocials(next)
                }}
              />
              <Input
                className="flex-[2] basis-48"
                placeholder="https://github.com/vour-studio"
                value={row.href}
                disabled={!canWrite}
                onChange={(e) => {
                  const next = [...socials]
                  next[i] = { ...row, href: e.target.value }
                  setSocials(next)
                }}
              />
              <Select
                value={row.icon}
                disabled={!canWrite}
                onValueChange={(v) => {
                  const next = [...socials]
                  next[i] = { ...row, icon: v as SocialRow['icon'] }
                  setSocials(next)
                }}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['github', 'linkedin', 'instagram', 'tiktok'].map((icon) => (
                    <SelectItem key={icon} value={icon}>
                      {icon}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {canWrite && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setSocials(socials.filter((_, j) => j !== i))}
                  aria-label="Hapus"
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>
          ))}
          {canWrite && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSocials([...socials, { label: '', href: '', icon: 'github' }])}
            >
              <Plus className="size-4" />
              Tambah media sosial
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Menu navigasi</CardTitle>
          <CardDescription>Menu utama marketing site.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {mainNav.map((row, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                className="flex-1"
                placeholder="Label (mis. Layanan)"
                value={row.label}
                disabled={!canWrite}
                onChange={(e) => {
                  const next = [...mainNav]
                  next[i] = { ...row, label: e.target.value }
                  setMainNav(next)
                }}
              />
              <Input
                className="flex-1"
                placeholder="/layanan"
                value={row.href}
                disabled={!canWrite}
                onChange={(e) => {
                  const next = [...mainNav]
                  next[i] = { ...row, href: e.target.value }
                  setMainNav(next)
                }}
              />
              {canWrite && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setMainNav(mainNav.filter((_, j) => j !== i))}
                  aria-label="Hapus"
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>
          ))}
          {canWrite && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMainNav([...mainNav, { label: '', href: '' }])}
            >
              <Plus className="size-4" />
              Tambah menu
            </Button>
          )}
        </CardContent>
      </Card>

      {canWrite ? (
        <div className="flex justify-end gap-2 pb-8">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            Simpan Pengaturan
          </Button>
        </div>
      ) : (
        <p className="pb-8 text-sm text-muted-foreground text-right">
          Anda memiliki akses baca (Read-only) untuk halaman ini.
        </p>
      )}
    </div>
  )
}
