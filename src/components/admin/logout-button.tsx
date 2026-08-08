'use client'

import { useRouter } from 'next/navigation'
import { LogOut, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { logout } from '@/lib/admin-api'
import { Button } from '@/components/ui/button'

export function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    try {
      await logout()
      router.push('/admin/login')
      router.refresh()
    } catch {
      toast.error('Gagal keluar. Coba lagi.')
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-8"
      onClick={handleLogout}
      disabled={loading}
      aria-label="Keluar"
      title="Keluar"
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
    </Button>
  )
}
