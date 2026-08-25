import type React from "react"

export function SidebarSection({
  children,
  collapsed,
  label,
}: Readonly<{ children: React.ReactNode; collapsed: boolean; label: string }>) {
  return (
    <nav aria-label={`${label} navigation`} className={`mt-5 px-3 ${collapsed ? "lg:px-2" : ""}`}>
      <p
        className={`mb-2 px-3 font-medium text-cyan-100/45 text-[0.65rem] uppercase tracking-[0.16em] ${
          collapsed ? "lg:sr-only" : ""
        }`}
      >
        {label}
      </p>
      <ul className="space-y-1">{children}</ul>
    </nav>
  )
}
