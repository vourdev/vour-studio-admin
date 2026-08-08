import * as React from 'react'
import Image from 'next/image'

import logoImg from '@/app/logo.png'

export function Logo({
  className,
  ...props
}: Omit<React.ComponentProps<typeof Image>, 'src' | 'alt'>) {
  return (
    <Image
      src={logoImg}
      alt="Vour Logo"
      className={className}
      priority
      {...props}
    />
  )
}
