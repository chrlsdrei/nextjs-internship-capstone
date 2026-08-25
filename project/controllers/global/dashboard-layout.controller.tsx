"use client"

import { UserButton } from "@clerk/nextjs"
import {
  BarChart3,
  Calendar,
  CreditCard,
  FolderOpen,
  Home,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Users,
  X,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type React from "react"
import { useState } from "react"

import { BrandLogo } from "@/components/global/brand-logo"
import { RealisticFogBackground } from "@/components/ui/realistic-fog-background"
import { TaskFrame } from "@/components/ui/task-frame"
import { BuildAiController } from "@/controllers/global/build-ai.controller"
import { NotificationCenterController } from "@/controllers/global/notification-center.controller"
import { PresenceHeartbeatController } from "@/controllers/global/presence-heartbeat.controller"
import { WorkspaceSwitcherController } from "@/controllers/global/workspace-switcher.controller"
import type { UserAiEntitlementDto } from "@/features/billing/billing.types"
import type { NotificationCenterDto } from "@/features/notifications/notification.types"
import type { WorkspaceSummaryDto } from "@/features/workspaces/workspace.types"

const workspaceNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Projects", href: "/projects", icon: FolderOpen },
  { name: "Team", href: "/team", icon: Users },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
]

const accountNavigation = [
  { name: "Subscription", href: "/subscription", icon: CreditCard },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function DashboardLayout({
  children,
  ai,
  notifications,
  workspaceContext,
}: Readonly<{
  children: React.ReactNode
  ai: { entitlement: UserAiEntitlementDto; workspaces: Array<{ id: string; name: string }> }
  notifications: NotificationCenterDto
  workspaceContext: { activeWorkspace: WorkspaceSummaryDto | null; workspaces: WorkspaceSummaryDto[] }
}>) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="relative isolate min-h-screen overflow-x-clip bg-[#020617]">
      <RealisticFogBackground className="fixed inset-0 z-0" />
      <PresenceHeartbeatController />
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform p-1 transition-[width,transform] duration-300 ease-in-out lg:translate-x-0 ${
          sidebarCollapsed ? "lg:w-20" : "lg:w-64"
        } ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <TaskFrame className="h-full rounded-l-none" contentClassName="flex h-full flex-col p-0">
          <div
            className={`flex h-16 items-center border-cyan-300/20 border-b ${
              sidebarCollapsed ? "justify-between px-6 lg:justify-center lg:gap-1 lg:px-2" : "justify-between px-6"
            }`}
          >
            <Link href="/" aria-label="QuestBoard home" className={sidebarCollapsed ? "lg:hidden" : undefined}>
              <BrandLogo priority />
            </Link>
            <button
              type="button"
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!sidebarCollapsed}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={() => setSidebarCollapsed((current) => !current)}
              className={`hidden rounded-lg text-cyan-100/70 transition-colors hover:bg-cyan-300/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 lg:inline-flex ${
                sidebarCollapsed ? "p-1.5" : "p-2"
              }`}
            >
              {sidebarCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
            </button>
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setSidebarOpen(false)}
              className="rounded-lg p-2 text-cyan-100/70 hover:bg-cyan-300/15 hover:text-white lg:hidden"
            >
              <X size={20} />
            </button>
          </div>

          <WorkspaceSwitcherController
            activeWorkspace={workspaceContext.activeWorkspace}
            collapsed={sidebarCollapsed}
            onNavigate={() => setSidebarOpen(false)}
            workspaces={workspaceContext.workspaces}
          />

          <nav aria-label="Workspace navigation" className={`mt-5 px-3 ${sidebarCollapsed ? "lg:px-2" : ""}`}>
            <p
              className={`mb-2 px-3 font-medium text-cyan-100/45 text-[0.65rem] uppercase tracking-[0.16em] ${
                sidebarCollapsed ? "lg:sr-only" : ""
              }`}
            >
              Workspace
            </p>
            <ul className="space-y-1">
              {workspaceNavigation.map((item) => {
                const isActive =
                  pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`))
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      aria-label={sidebarCollapsed ? item.name : undefined}
                      title={sidebarCollapsed ? item.name : undefined}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center rounded-lg px-3 py-2 font-medium text-sm transition-colors ${
                        sidebarCollapsed ? "lg:justify-center lg:px-2" : ""
                      } ${
                        isActive
                          ? "bg-cyan-400/20 text-cyan-100 ring-1 ring-cyan-300/35"
                          : "text-cyan-50/80 hover:bg-cyan-300/10 hover:text-white"
                      }`}
                    >
                      <item.icon className={sidebarCollapsed ? "mr-3 lg:mr-0" : "mr-3"} size={20} />
                      <span className={sidebarCollapsed ? "lg:sr-only" : undefined}>{item.name}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
          <nav aria-label="Account navigation" className={`mt-5 px-3 ${sidebarCollapsed ? "lg:px-2" : ""}`}>
            <p
              className={`mb-2 px-3 font-medium text-cyan-100/45 text-[0.65rem] uppercase tracking-[0.16em] ${
                sidebarCollapsed ? "lg:sr-only" : ""
              }`}
            >
              Account
            </p>
            <ul className="space-y-1">
              {accountNavigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      aria-label={sidebarCollapsed ? item.name : undefined}
                      title={sidebarCollapsed ? item.name : undefined}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center rounded-lg px-3 py-2 font-medium text-sm transition-colors ${
                        sidebarCollapsed ? "lg:justify-center lg:px-2" : ""
                      } ${
                        isActive
                          ? "bg-cyan-400/20 text-cyan-100 ring-1 ring-cyan-300/35"
                          : "text-cyan-50/80 hover:bg-cyan-300/10 hover:text-white"
                      }`}
                    >
                      <item.icon className={sidebarCollapsed ? "mr-3 lg:mr-0" : "mr-3"} size={20} />
                      <span className={sidebarCollapsed ? "lg:sr-only" : undefined}>{item.name}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
          <div className={`mt-auto px-3 pb-5 ${sidebarCollapsed ? "lg:px-2" : ""}`}>
            <BuildAiController collapsed={sidebarCollapsed} entitlement={ai.entitlement} workspaces={ai.workspaces} />
          </div>
        </TaskFrame>
      </aside>

      <div className={`relative z-10 transition-[padding] duration-300 ${sidebarCollapsed ? "lg:pl-20" : "lg:pl-64"}`}>
        <header className="sticky top-0 z-30 h-20 p-1.5">
          <TaskFrame
            className="h-full w-full rounded-xl"
            contentClassName="flex h-full items-center gap-x-4 px-4 py-0 sm:px-6 lg:px-8"
          >
            <button
              type="button"
              aria-label="Open navigation"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-cyan-100/75 hover:bg-cyan-300/15 hover:text-white lg:hidden"
            >
              <Menu size={20} />
            </button>
            <div className="ml-auto flex items-center gap-x-4">
              <NotificationCenterController initialData={notifications} />
              <UserButton />
            </div>
          </TaskFrame>
        </header>

        <main className="px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
