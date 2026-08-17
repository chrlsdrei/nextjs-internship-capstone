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
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-french-gray-300 border-r bg-white transition-[width,transform] duration-300 ease-in-out dark:border-paynes-gray-400 dark:bg-outer-space-500 lg:translate-x-0 ${
          sidebarCollapsed ? "lg:w-20" : "lg:w-64"
        } ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div
          className={`flex h-16 items-center border-french-gray-300 border-b dark:border-paynes-gray-400 ${
            sidebarCollapsed ? "justify-between px-6 lg:justify-center lg:px-2" : "justify-between px-6"
          }`}
        >
          <Link href="/" className={`font-bold text-2xl text-blue-munsell-500 ${sidebarCollapsed ? "lg:hidden" : ""}`}>
            ProjectFlow
          </Link>
          <button
            type="button"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!sidebarCollapsed}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setSidebarCollapsed((current) => !current)}
            className="hidden rounded-lg p-2 text-paynes-gray-500 transition-colors hover:bg-platinum-500 hover:text-outer-space-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-munsell-500 dark:text-french-gray-400 dark:hover:bg-paynes-gray-400 dark:hover:text-platinum-500 lg:inline-flex"
          >
            {sidebarCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          </button>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 hover:bg-platinum-500 dark:hover:bg-paynes-gray-400 lg:hidden"
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
                        ? "bg-blue-munsell-100 text-blue-munsell-700 dark:bg-blue-munsell-800 dark:text-blue-munsell-50"
                        : "text-outer-space-500 hover:bg-platinum-500 dark:text-platinum-500 dark:hover:bg-paynes-gray-400"
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
      </aside>

      <div className={`transition-[padding] duration-300 ${sidebarCollapsed ? "lg:pl-20" : "lg:pl-64"}`}>
        <header className="sticky top-0 z-30 flex h-16 items-center gap-x-4 border-french-gray-300 border-b bg-white px-4 shadow-sm dark:border-paynes-gray-400 dark:bg-outer-space-500 sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            aria-label="Open navigation"
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 hover:bg-platinum-500 dark:hover:bg-paynes-gray-400 lg:hidden"
          >
            <Menu size={20} />
          </button>

          <div className="flex flex-1 items-center gap-x-4 lg:gap-x-6">
            <div className="relative hidden max-w-md flex-1 sm:block">
              <Search
                aria-hidden="true"
                className="-translate-y-1/2 absolute top-1/2 left-3 text-paynes-gray-500 dark:text-french-gray-400"
                size={16}
              />
              <input
                type="search"
                aria-label="Search projects and tasks"
                placeholder="Search projects, tasks..."
                className="w-full rounded-lg border border-french-gray-300 bg-platinum-500 py-2 pr-4 pl-10 text-outer-space-500 placeholder-paynes-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-munsell-500 dark:border-paynes-gray-300 dark:bg-paynes-gray-400 dark:text-platinum-500 dark:placeholder-french-gray-400"
              />
            </div>

            <div className="ml-auto flex items-center gap-x-4">
              <button
                type="button"
                aria-label="Notifications"
                className="rounded-lg p-2 hover:bg-platinum-500 dark:hover:bg-paynes-gray-400"
              >
                <Bell size={20} />
              </button>
              <UserButton />
            </div>
          </div>
        </header>

        <main className="px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
