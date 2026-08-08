'use client'

import { History, RotateCcw, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function DraftRestoreBanner({
  savedAt,
  onRestore,
  onDiscard,
}: {
  savedAt: number
  onRestore: () => void
  onDiscard: () => void
}) {
  const time = new Date(savedAt).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300/60 bg-amber-50 px-4 py-3 text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/50 dark:text-amber-100">
      <div className="flex items-center gap-2.5 text-sm">
        <History className="size-4 shrink-0" aria-hidden />
        <span>
          Draft tersimpan otomatis ditemukan (pukul {time}). Pulihkan untuk melanjutkan dari
          draft tersebut.
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={onRestore} className="bg-amber-600 text-white hover:bg-amber-700">
          <RotateCcw className="size-3.5" />
          Pulihkan
        </Button>
        <Button size="sm" variant="outline" onClick={onDiscard}>
          <Trash2 className="size-3.5" />
          Buang
        </Button>
      </div>
    </div>
  )
}
