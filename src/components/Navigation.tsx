"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Home, Film, Users, LogOut, Play } from "lucide-react"
import { signOut } from "next-auth/react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar"

interface NavigationProps {
  userRole?: string | null
  familySlug?: string | null
}

export function Navigation({ userRole, familySlug }: NavigationProps) {
  const pathname = usePathname()
  const { isMobile, setOpenMobile } = useSidebar()

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/editor", label: "Editor", icon: Film },
  ]

  if (familySlug) {
    links.push({ href: `/watch/${familySlug}`, label: "Ver videos", icon: Play })
  }

  if (userRole === 'owner') {
    links.push({ href: "/family", label: "Familia", icon: Users })
  }

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <div className="flex items-center justify-center px-2 py-4">
          <Link href="/dashboard">
            <Image
              src="/icon_camisol.png"
              alt="Logo"
              width={64}
              height={64}
              className="w-16 h-16"
            />
          </Link>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {links.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href

            return (
              <SidebarMenuItem key={link.href}>
                <SidebarMenuButton asChild isActive={isActive} size="lg">
                  <Link href={link.href} onClick={handleLinkClick} className="gap-3 px-4 py-3">
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{link.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => signOut({ callbackUrl: '/login' })} size="lg" className="gap-3 px-4 py-3">
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Cerrar sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
