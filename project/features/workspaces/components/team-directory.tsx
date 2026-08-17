"use client"

import { Building2, CalendarDays, Mail, UserPlus, Users } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { TaskFrame } from "@/components/ui/task-frame"
import { TechFrameCard } from "@/components/ui/tech-frame-card"
import type { WorkspaceDetailDto, WorkspaceMemberDto } from "@/features/workspaces/workspace.types"

import { WorkspaceRoleBadge } from "./workspace-role-badge"

function memberInitials(member: WorkspaceMemberDto) {
  const initials = member.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")

  return (initials || member.email[0] || "?").toUpperCase()
}

export function TeamDirectory({ workspaces }: { workspaces: WorkspaceDetailDto[] }) {
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(workspaces[0]?.id ?? "")
  const workspace = workspaces.find((item) => item.id === selectedWorkspaceId) ?? workspaces[0]

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

          {workspace && (
            <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
              <label className="inline-flex min-h-11 min-w-0 items-center gap-2 rounded-lg border border-cyan-300/30 bg-blue-950/60 px-3 text-white focus-within:border-cyan-300/70 focus-within:ring-2 focus-within:ring-cyan-300/30 sm:min-w-64">
                <Building2 className="shrink-0 text-cyan-300" size={18} />
                <span className="sr-only">Select workspace</span>
                <select
                  value={workspace.id}
                  onChange={(event) => setSelectedWorkspaceId(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent py-2 text-white [color-scheme:dark] focus:outline-none [&>option]:bg-[#081b31] [&>option]:text-white"
                >
                  {workspaces.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>

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
          )}
        </header>
      </TechFrameCard>

      {workspace ? (
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
            {workspace.members.map((member) => (
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
                  <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 font-medium text-emerald-300 ring-1 ring-emerald-400/25">
                    Active
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
            ))}
          </div>
        </section>
      ) : (
        <TaskFrame contentClassName="p-8 text-center sm:p-10">
          <Building2 className="mx-auto text-cyan-300" size={36} />
          <h2 className="mt-4 font-semibold text-xl text-white">No workspace team yet</h2>
          <p className="mx-auto mt-2 max-w-lg text-cyan-100/70 text-sm">
            Create or join a workspace to see its team members here.
          </p>
          <Link
            href="/workspaces/new"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-blue-950 hover:bg-cyan-300"
          >
            Create workspace
          </Link>
        </TaskFrame>
      )}
    </div>
  )
}
