'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  FileText,
  FolderKanban,
  Images,
  Inbox,
  LayoutDashboard,
  Package,
  Settings,
  Users,
} from 'lucide-react'

import type { User } from '@/payload-types'
import { Logo } from '@/components/admin/logo'
import { canRead, canWrite, type PermissionCollection } from '@/lib/permissions'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'

const contentLinks: { href: string; label: string; icon: typeof FileText; permission: PermissionCollection }[] = [
  { href: '/admin/posts', label: 'Postingan', icon: FileText, permission: 'posts' },
  { href: '/admin/products', label: 'Produk', icon: Package, permission: 'products' },
  { href: '/admin/projects', label: 'Projects', icon: FolderKanban, permission: 'projects' },
  { href: '/admin/media', label: 'Media', icon: Images, permission: 'media' },
]

const inboxLinks: { href: string; label: string; icon: typeof Inbox; permission: PermissionCollection }[] = [
  { href: '/admin/leads', label: 'Leads', icon: Inbox, permission: 'leads' },
  { href: '/admin/subscribers', label: 'Subscribers', icon: Inbox, permission: 'newsletter-subscribers' },
]

export function AppSidebar({ user }: { user: User | null }) {
  const pathname = usePathname()

  const visibleContent = contentLinks.filter(({ permission }) => canRead(user, permission))
  const visibleInbox = inboxLinks.filter(({ permission }) => canRead(user, permission))
  const showSettings = canWrite(user, 'site-settings')
  const showUsers = user?.roles?.includes('admin')

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`)

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="flex size-7 items-center justify-center rounded-md text-foreground">
            <Logo className="size-7" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">Vour Studio</div>
            <div className="text-xs text-muted-foreground">Admin Panel</div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/admin'}>
                  <Link href="/admin">
                    <LayoutDashboard />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Konten</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleContent.map(({ href, label, icon: Icon }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton asChild isActive={isActive(href)}>
                    <Link href={href}>
                      <Icon />
                      <span>{label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Inbox</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleInbox.map(({ href, label, icon: Icon }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton asChild isActive={isActive(href)}>
                    <Link href={href}>
                      <Icon />
                      <span>{label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Pengaturan</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {showSettings && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive('/admin/settings')}>
                    <Link href="/admin/settings">
                      <Settings />
                      <span>Pengaturan Situs</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {showUsers && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive('/admin/users')}>
                    <Link href="/admin/users">
                      <Users />
                      <span>Users</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="px-2 py-1 text-xs text-muted-foreground">
          {user ? (
            <div className="truncate">
              <div className="font-medium text-foreground">{user.name}</div>
              <div>{user.email}</div>
            </div>
          ) : null}
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
