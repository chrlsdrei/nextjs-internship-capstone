import type React from "react"

import { accountNavigation, workspaceNavigation } from "@/components/sidebar/sidebar.config"
import { SidebarNavItem } from "@/components/sidebar/sidebar-nav-item"
import { SidebarSection } from "@/components/sidebar/sidebar-section"

function isNavigationItemActive(pathname: string, href: string) {
  return pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`))
}

export function SidebarNavigation({
  collapsed,
  notifications,
  onNavigate,
  pathname,
}: {
  collapsed: boolean
  notifications: React.ReactNode
  onNavigate: () => void
  pathname: string
}) {
  return (
    <>
      <SidebarSection collapsed={collapsed} label="Workspace">
        {workspaceNavigation.map((item) => (
          <li key={item.name}>
            <SidebarNavItem
              collapsed={collapsed}
              isActive={isNavigationItemActive(pathname, item.href)}
              item={item}
              onNavigate={onNavigate}
            />
          </li>
        ))}
      </SidebarSection>

      <SidebarSection collapsed={collapsed} label="Account">
        {accountNavigation.map((item) => {
          if (item.kind === "notifications") return <li key={item.name}>{notifications}</li>

          return (
            <li key={item.name}>
              <SidebarNavItem
                collapsed={collapsed}
                isActive={isNavigationItemActive(pathname, item.href)}
                item={item}
                onNavigate={onNavigate}
              />
            </li>
          )
        })}
      </SidebarSection>
    </>
  )
}
