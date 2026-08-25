"use client"

import { CalendarDays, Mail, UserPlus, Users } from "lucide-react"
import Link from "next/link"
import { getPresenceLabel } from "@/components/team/presence-label"
import { TaskFrame } from "@/components/ui/task-frame"
import { TechFrameCard } from "@/components/ui/tech-frame-card"
import { WorkspaceRoleBadge } from "@/components/workspaces/workspace-role-badge"
import type { WorkspaceDetailDto, WorkspaceMemberDto } from "@/features/workspaces/workspace.types"

function memberInitials(member: WorkspaceMemberDto) {
  const initials = member.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")

  return (initials || member.email[0] || "?").toUpperCase()
}

export function TeamDirectory({ workspace }: { workspace: WorkspaceDetailDto }) {
  return (
    <div className="space-y-6">
      <TechFrameCard
        className="min-h-0 w-full"
        contentClassName="min-h-0 gap-0 px-[clamp(2.5rem,5vw,6rem)] py-6 sm:min-h-0 sm:px-[clamp(2.5rem,5vw,6rem)] sm:py-8"
      >
        <header className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="font-bold text-3xl text-white">Team</h1>
            <p className="mt-2 text-cyan-100/70">View team members and permissions for each workspace.</p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
            {workspace.capabilities.canInviteWorkspaceMembers ? (
              <Link
                href={`/workspaces/${workspace.id}/members`}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-blue-950 transition-colors hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100"
              >
                <UserPlus size={18} /> Invite member
              </Link>
            ) : (
              <Link
                href={`/workspaces/${workspace.id}`}
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-cyan-300/35 bg-blue-950/60 px-4 py-2 font-semibold text-cyan-50 hover:bg-blue-900/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                View workspace
              </Link>
            )}
          </div>
        </header>
      </TechFrameCard>

      <section aria-labelledby="selected-workspace-team">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="selected-workspace-team" className="font-semibold text-2xl text-white">
              {workspace.name}
            </h2>
            <p className="mt-1 text-cyan-100/70 text-sm">
              Your access: <span className="capitalize text-cyan-200">{workspace.role}</span>
            </p>
          </div>
          <p className="flex items-center gap-2 text-cyan-100/70 text-sm">
            <Users size={17} /> {workspace.members.length} {workspace.members.length === 1 ? "member" : "members"}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {workspace.members.map((member) => {
            const presence = getPresenceLabel(member.lastSeenAt)

            return (
              <TaskFrame key={member.id} className="h-full" contentClassName="flex h-full flex-col p-6 sm:p-7">
                <div className="flex items-start gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-cyan-400 font-bold text-blue-950 ring-2 ring-cyan-100/70">
                    {memberInitials(member)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-lg text-white" title={member.name}>
                      {member.name}
                    </h3>
                    <div className="mt-1">
                      <WorkspaceRoleBadge role={member.role} />
                    </div>
                  </div>
                </div>

                <a
                  href={`mailto:${member.email}`}
                  className="mt-5 flex min-w-0 items-center gap-2 text-cyan-100/75 text-sm hover:text-cyan-100"
                >
                  <Mail className="shrink-0" size={16} />
                  <span className="truncate">{member.email}</span>
                </a>

                <div className="mt-auto flex items-end justify-between gap-4 pt-6 text-sm">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 font-medium ring-1 ${
                      presence.isOnline
                        ? "bg-emerald-500/20 text-emerald-300 ring-emerald-400/25"
                        : "bg-slate-500/15 text-cyan-100/65 ring-cyan-200/15"
                    }`}
                    title={member.lastSeenAt ? new Date(member.lastSeenAt).toLocaleString() : undefined}
                  >
                    <span
                      aria-hidden="true"
                      className={`size-2 rounded-full ${
                        presence.isOnline ? "bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,0.9)]" : "bg-slate-400"
                      }`}
                    />
                    {presence.label}
                  </span>
                  <span className="flex items-center gap-1.5 text-cyan-100/60">
                    <CalendarDays size={15} />
                    Joined{" "}
                    <time dateTime={member.joinedAt}>
                      {new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(
                        new Date(member.joinedAt),
                      )}
                    </time>
                  </span>
                </div>
              </TaskFrame>
            )
          })}
        </div>
      </section>
    </div>
  )
}
