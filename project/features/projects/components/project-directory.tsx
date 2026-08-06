"use client"

import { Filter, Search } from "lucide-react"
import { useMemo, useState } from "react"

import type { ProjectSummaryDto } from "@/features/projects/project.types"
import type { WorkspaceSummaryDto } from "@/features/workspaces/workspace.types"
import { groupProjectsByWorkspace } from "@/features/workspaces/workspace-projects"

import { ProjectCard } from "./project-card"

type ProjectDirectoryProps = {
  initialWorkspaceId?: string
  projects: ProjectSummaryDto[]
  workspaces: WorkspaceSummaryDto[]
}

export function ProjectDirectory({ initialWorkspaceId, projects, workspaces }: ProjectDirectoryProps) {
  const [search, setSearch] = useState("")
  const [role, setRole] = useState<"all" | ProjectSummaryDto["role"]>("all")
  const validInitialWorkspace = workspaces.some((workspace) => workspace.id === initialWorkspaceId)
    ? initialWorkspaceId
    : initialWorkspaceId === "unassigned"
      ? "unassigned"
      : "all"
  const [workspaceId, setWorkspaceId] = useState(validInitialWorkspace)
  const visibleProjects = useMemo(() => {
    const term = search.trim().toLowerCase()
    return projects.filter(
      (project) =>
        (workspaceId === "all" ||
          (workspaceId === "unassigned" ? project.workspaceId === null : project.workspaceId === workspaceId)) &&
        (role === "all" || project.role === role) &&
        (!term || project.name.toLowerCase().includes(term) || project.description?.toLowerCase().includes(term)),
    )
  }, [projects, role, search, workspaceId])
  const groups = groupProjectsByWorkspace(workspaces, visibleProjects, workspaceId !== "all").filter(
    (group) => workspaceId === "all" || group.key === workspaceId,
  )

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Search projects</span>
          <Search
            className="-translate-y-1/2 absolute top-1/2 left-3 text-paynes-gray-500 dark:text-french-gray-400"
            size={16}
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search projects..."
            className="w-full rounded-lg border border-french-gray-300 bg-white py-2 pr-4 pl-10 text-outer-space-500 placeholder-paynes-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-munsell-500 dark:border-paynes-gray-400 dark:bg-outer-space-500 dark:text-platinum-500 dark:placeholder-french-gray-400"
          />
        </label>
        <label className="inline-flex items-center gap-2 rounded-lg border border-french-gray-300 px-3 py-2 text-outer-space-500 dark:border-paynes-gray-400 dark:text-platinum-500">
          <Filter size={16} />
          <span className="sr-only">Filter by role</span>
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as typeof role)}
            className="bg-transparent focus:outline-none"
          >
            <option value="all">All roles</option>
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
            <option value="member">Member</option>
          </select>
        </label>
        <label className="inline-flex items-center gap-2 rounded-lg border border-french-gray-300 px-3 py-2 text-outer-space-500 dark:border-paynes-gray-400 dark:text-platinum-500">
          <span className="sr-only">Filter by workspace</span>
          <select
            value={workspaceId}
            onChange={(event) => setWorkspaceId(event.target.value)}
            className="max-w-56 bg-transparent focus:outline-none"
          >
            <option value="all">All workspaces</option>
            {workspaces.map((workspace) => (
              <option key={workspace.id} value={workspace.id}>
                {workspace.name}
              </option>
            ))}
            <option value="unassigned">Unassigned projects</option>
          </select>
        </label>
      </div>

      {visibleProjects.length === 0 ? (
        <div className="rounded-lg border border-dashed border-french-gray-300 dark:border-paynes-gray-400 p-10 text-center">
          <h2 className="font-semibold text-outer-space-500 dark:text-platinum-500">No projects found</h2>
          <p className="mt-2 text-sm text-paynes-gray-500 dark:text-french-gray-400">
            {projects.length === 0
              ? "Create a project to get started."
              : "Try a different search, role, or workspace filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.key} aria-labelledby={`project-group-${group.key}`}>
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2
                    id={`project-group-${group.key}`}
                    className="font-semibold text-lg text-outer-space-500 dark:text-platinum-500"
                  >
                    {group.name}
                  </h2>
                  <p className="mt-1 text-paynes-gray-500 text-sm dark:text-french-gray-400">
                    {group.workspace
                      ? `${group.workspace.role} access · ${group.projects.length} projects`
                      : "Projects created before workspace assignment"}
                  </p>
                </div>
              </div>
              {group.projects.length === 0 ? (
                <div className="rounded-lg border border-french-gray-300 border-dashed p-6 text-paynes-gray-500 text-sm dark:border-paynes-gray-400 dark:text-french-gray-400">
                  No projects are assigned to this workspace yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {group.projects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </>
  )
}
