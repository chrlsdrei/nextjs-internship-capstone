"use client"

import { Filter, Search } from "lucide-react"
import { useMemo, useState } from "react"

import type { ProjectSummary } from "@/lib/db/queries/projects"

import { ProjectCard } from "./project-card"

export function ProjectDirectory({ projects }: { projects: ProjectSummary[] }) {
  const [search, setSearch] = useState("")
  const [role, setRole] = useState<"all" | ProjectSummary["role"]>("all")
  const visibleProjects = useMemo(() => {
    const term = search.trim().toLowerCase()
    return projects.filter(
      (project) =>
        (role === "all" || project.role === role) &&
        (!term || project.name.toLowerCase().includes(term) || project.description?.toLowerCase().includes(term)),
    )
  }, [projects, role, search])

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-4">
        <label className="relative flex-1">
          <span className="sr-only">Search projects</span>
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-paynes-gray-500 dark:text-french-gray-400"
            size={16}
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search projects..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-outer-space-500 border border-french-gray-300 dark:border-paynes-gray-400 rounded-lg text-outer-space-500 dark:text-platinum-500 placeholder-paynes-gray-500 dark:placeholder-french-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-munsell-500"
          />
        </label>
        <label className="inline-flex items-center gap-2 px-3 py-2 border border-french-gray-300 dark:border-paynes-gray-400 text-outer-space-500 dark:text-platinum-500 rounded-lg">
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
      </div>

      {visibleProjects.length === 0 ? (
        <div className="rounded-lg border border-dashed border-french-gray-300 dark:border-paynes-gray-400 p-10 text-center">
          <h2 className="font-semibold text-outer-space-500 dark:text-platinum-500">No projects found</h2>
          <p className="mt-2 text-sm text-paynes-gray-500 dark:text-french-gray-400">
            {projects.length === 0 ? "Create a project to get started." : "Try a different search or role filter."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </>
  )
}
