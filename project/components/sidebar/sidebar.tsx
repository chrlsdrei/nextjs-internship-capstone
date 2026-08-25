import type { SidebarProps } from "@/components/sidebar/sidebar.types"
import { SidebarHeader } from "@/components/sidebar/sidebar-header"
import { SidebarNavigation } from "@/components/sidebar/sidebar-navigation"
import { SidebarProfile } from "@/components/sidebar/sidebar-profile"
import { TaskFrame } from "@/components/ui/task-frame"

export function Sidebar({
  buildWithAi,
  collapsed,
  notifications,
  onClose,
  onToggleCollapsed,
  open,
  pathname,
  workspaceSwitcher,
}: SidebarProps) {
  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 cursor-pointer bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform p-1 transition-[width,transform] duration-300 ease-in-out lg:translate-x-0 ${
          collapsed ? "lg:w-20" : "lg:w-64"
        } ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <TaskFrame className="h-full rounded-l-none" contentClassName="flex h-full flex-col p-0">
          <SidebarHeader collapsed={collapsed} onClose={onClose} onToggleCollapsed={onToggleCollapsed} />
          {workspaceSwitcher}
          <SidebarNavigation
            collapsed={collapsed}
            notifications={notifications}
            onNavigate={onClose}
            pathname={pathname}
          />
          <div className={`mt-auto px-3 pb-5 ${collapsed ? "lg:px-2" : ""}`}>
            {buildWithAi}
            <SidebarProfile collapsed={collapsed} />
          </div>
        </TaskFrame>
      </aside>
    </>
  )
}
