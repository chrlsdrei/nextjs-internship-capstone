"use client"

import { UserButton, useUser } from "@clerk/nextjs"

import { questBoardClerkAppearance } from "@/lib/clerk/clerk-appearance"

export function SidebarProfile({ collapsed }: { collapsed: boolean }) {
  const { user } = useUser()
  const userEmail = user?.primaryEmailAddress?.emailAddress
  const userDisplayName = user?.fullName ?? user?.username ?? userEmail?.split("@")[0] ?? "Account"

  return (
    <div
      className={`relative mt-2 min-h-14 cursor-pointer rounded-lg border border-cyan-300/25 bg-cyan-950/25 text-cyan-50/85 transition-colors hover:border-cyan-300/45 hover:bg-cyan-300/10 ${
        collapsed ? "lg:min-h-11" : ""
      }`}
      title={collapsed ? "Account profile and settings" : undefined}
    >
      <UserButton
        showName
        userProfileProps={{ appearance: questBoardClerkAppearance }}
        appearance={{
          elements: {
            rootBox: {
              position: "absolute",
              inset: 0,
              zIndex: 20,
              width: "100%",
              height: "100%",
            },
            userButtonBox: { width: "100%", height: "100%" },
            userButtonTrigger: {
              width: "100%",
              height: "100%",
              cursor: "pointer",
              justifyContent: collapsed ? "center" : "flex-start",
              gap: "0.75rem",
              borderRadius: "0.5rem",
              padding: collapsed ? "0.5rem" : "0.5rem 0.75rem",
            },
            userButtonOuterIdentifier: "sr-only",
          },
        }}
      />
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-y-0 right-3 left-14 z-30 flex min-w-0 flex-col justify-center ${
          collapsed ? "lg:sr-only" : ""
        }`}
      >
        <p className="truncate font-semibold text-sm text-white leading-tight">{userDisplayName}</p>
        <p className="mt-1 truncate text-cyan-100/60 text-xs leading-tight">{userEmail ?? "View profile"}</p>
      </div>
    </div>
  )
}
