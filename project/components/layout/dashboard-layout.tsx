"use client"

import { UserButton } from "@clerk/nextjs"
import {
  BarChart3,
  Bell,
  Building2,
  Calendar,
  FolderOpen,
  Home,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Users,
  X,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type React from "react"
import { useState } from "react"

import { TaskFrame } from "@/components/ui/task-frame"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Workspaces", href: "/workspaces", icon: Building2 },
  { name: "Projects", href: "/projects", icon: FolderOpen },
  { name: "Team", href: "/team", icon: Users },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-platinum-900 dark:bg-outer-space-600">
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
        <TaskFrame className="h-full rounded-l-none" contentClassName="h-full p-0">
          <div
            className={`flex h-16 items-center border-cyan-300/20 border-b ${
              sidebarCollapsed ? "justify-between px-6 lg:justify-center lg:px-2" : "justify-between px-6"
            }`}
          >
            <Link href="/" className={`font-bold text-2xl text-cyan-300 ${sidebarCollapsed ? "lg:hidden" : ""}`}>
              ProjectFlow
            </Link>
            <button
              type="button"
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!sidebarCollapsed}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={() => setSidebarCollapsed((current) => !current)}
              className="hidden rounded-lg p-2 text-cyan-100/70 transition-colors hover:bg-cyan-300/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 lg:inline-flex"
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

          <nav aria-label="Dashboard navigation" className={`mt-6 px-3 ${sidebarCollapsed ? "lg:px-2" : ""}`}>
            <ul className="space-y-1">
              {navigation.map((item) => {
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
        </TaskFrame>
      </aside>

      <div className={`transition-[padding] duration-300 ${sidebarCollapsed ? "lg:pl-20" : "lg:pl-64"}`}>
        <header className="sticky top-0 z-30 h-20 p-1.5">
          <TaskFrame
            className="h-full w-full rounded-xl"
            contentClassName="flex h-full items-center gap-x-4 px-4 py-0 sm:gap-x-6 sm:px-6 lg:px-8"
          >
            <button
              type="button"
              aria-label="Open navigation"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-cyan-100/75 hover:bg-cyan-300/15 hover:text-white lg:hidden"
            >
              <Menu size={20} />
            </button>

            <div className="flex flex-1 items-center gap-x-4 lg:gap-x-6">
              <div className="relative hidden max-w-md flex-1 sm:block">
                <Search
                  aria-hidden="true"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-100/55"
                  size={16}
                />
                <input
                  type="search"
                  aria-label="Search projects and tasks"
                  placeholder="Search projects, tasks..."
                  className="w-full rounded-lg border border-cyan-300/35 bg-blue-950/65 py-2 pr-4 pl-10 text-white placeholder:text-cyan-100/45 focus:outline-none focus:ring-2 focus:ring-cyan-300"
                />
              </div>

              <div className="ml-auto flex items-center gap-x-4">
                <button
                  type="button"
                  aria-label="Notifications"
                  className="rounded-lg p-2 text-cyan-100/75 hover:bg-cyan-300/15 hover:text-white"
                >
                  <Bell size={20} />
                </button>
                <UserButton />
              </div>
            </div>
          </TaskFrame>
        </header>

        <main className="px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
