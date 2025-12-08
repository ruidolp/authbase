"use client"

import Link from "next/link"
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
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

interface NavigationProps {
  userRole?: string | null
  familySlug?: string | null
}

export function Navigation({ userRole, familySlug }: NavigationProps) {
  const pathname = usePathname()

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

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <div className="flex items-center justify-between px-2 py-4">
          <Link href="/dashboard" className="font-bold text-xl text-gray-900">
            MyFTV
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
                <SidebarMenuButton asChild isActive={isActive}>
                  <Link href={link.href}>
                    <Icon className="w-5 h-5" />
                    <span>{link.label}</span>
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
            <SidebarMenuButton onClick={() => signOut({ callbackUrl: '/login' })}>
              <LogOut className="w-5 h-5" />
              <span>Cerrar sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}