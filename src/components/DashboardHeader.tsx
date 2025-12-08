"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Tv } from "lucide-react"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DashboardHeaderProps {
  userName?: string | null
  familySlug?: string | null
}

export function DashboardHeader({ userName, familySlug }: DashboardHeaderProps) {
  const pathname = usePathname()
  const isDashboard = pathname === "/dashboard"
  const tvHref = familySlug ? `/watch/${familySlug}` : "/watch"

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-6" />
      <div id="page-header" className="flex-1" />
      <div className="ml-auto flex items-center gap-3">
        <Button
          asChild
          variant="outline"
          size="sm"
          className={cn(!familySlug && "pointer-events-none opacity-60")}
        >
          <Link href={tvHref} aria-disabled={!familySlug} tabIndex={familySlug ? undefined : -1}>
            <Tv className="h-4 w-4" />
            <span className="ml-2 hidden sm:inline">Ver TV</span>
          </Link>
        </Button>
        {isDashboard && (
          <span className="text-sm text-muted-foreground flex items-center gap-2">
            Hola {userName || "amigo"} <span aria-hidden="true">👋</span>
          </span>
        )}
      </div>
    </header>
  )
}
