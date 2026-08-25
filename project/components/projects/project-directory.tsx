"use client"

import { Filter, Search } from "lucide-react"
import { useMemo, useState } from "react"

import type { ProjectSummaryDto } from "@/features/projects/project.types"
import type { WorkspaceSummaryDto } from "@/features/workspaces/workspace.types"

import { ProjectCard } from "./project-card"

type ProjectDirectoryProps = {
  projects: ProjectSummaryDto[]
  workspace: WorkspaceSummaryDto
}

export function ProjectDirectory({ projects, workspace }: ProjectDirectoryProps) {
  const [search, setSearch] = useState("")
  const [role, setRole] = useState<"all" | ProjectSummaryDto["role"]>("all")
  const visibleProjects = useMemo(() => {
    const term = search.trim().toLowerCase()
    return projects.filter(
      (project) =>
        (role === "all" || project.role === role) &&
        (!term || project.title.toLowerCase().includes(term) || project.description?.toLowerCase().includes(term)),
    )
  }, [projects, role, search])

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
        <label className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-cyan-300/25 bg-blue-950/55 px-3 py-2 text-white focus-within:border-cyan-300/60 focus-within:ring-2 focus-within:ring-cyan-300/30">
          <Filter className="shrink-0 text-cyan-100" size={16} />
          <span className="sr-only">Filter by role</span>
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as typeof role)}
            className="w-full min-w-44 bg-transparent text-white [color-scheme:dark] focus:outline-none [&>option]:bg-[#081b31] [&>option]:text-white"
          >
            <option value="all">All roles</option>
            <option value="board_admin">Board administrator</option>
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
        </label>
      </div>

      {visibleProjects.length === 0 ? (
        <div className="rounded-lg border border-dashed border-french-gray-300 dark:border-paynes-gray-400 p-10 text-center">
          <h2 className="font-semibold text-outer-space-500 dark:text-platinum-500">No projects found</h2>
          <p className="mt-2 text-sm text-paynes-gray-500 dark:text-french-gray-400">
            {projects.length === 0
              ? `Create a project in ${workspace.name} to get started.`
              : "Try a different search or role filter."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visibleProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </>
  )
}
