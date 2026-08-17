import { ArrowLeft, Search, Settings, SlidersHorizontal } from "lucide-react"
import Link from "next/link"

import { TechFrameCard } from "@/components/ui/tech-frame-card"

type BoardToolbarProps = {
  projectId: string
  title: string
  description: string | null
  search: string
  activeFilterCount: number
  canManage: boolean
  onSearchChange: (value: string) => void
  onOpenFilters: () => void
}

export function BoardToolbar({
  projectId,
  title,
  description,
  search,
  activeFilterCount,
  canManage,
  onSearchChange,
  onOpenFilters,
}: BoardToolbarProps) {
  return (
    <TechFrameCard className="min-h-0 w-full" contentClassName="min-h-0 gap-0 px-5 py-4 sm:min-h-0 sm:px-7 sm:py-5">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Link
            href="/projects"
            className="rounded p-2 text-cyan-50 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            aria-label="Back to projects"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="min-w-0">
            <h1 className="truncate font-bold text-2xl text-white sm:text-3xl" title={title}>
              {title}
            </h1>
            <p className="mt-1 line-clamp-2 text-cyan-100/70 text-sm sm:text-base">
              {description || "Plan and track this project’s work."}
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row xl:w-auto">
          <label className="relative min-w-0 flex-1 xl:w-72">
            <span className="sr-only">Search tasks</span>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-100/55" size={16} />
            <input
              type="search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search tasks"
              className="w-full rounded-lg border border-cyan-300/40 bg-blue-950/55 py-2.5 pr-3 pl-9 text-cyan-50 placeholder:text-cyan-100/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            />
          </label>
          <button
            type="button"
            onClick={onOpenFilters}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-cyan-300/40 bg-blue-950/55 px-3 py-2.5 font-medium text-cyan-50 text-sm hover:bg-blue-900/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            <SlidersHorizontal size={16} /> Filters
            {activeFilterCount > 0 && (
              <span className="flex min-w-5 items-center justify-center rounded-full bg-cyan-300 px-1.5 py-0.5 text-[0.65rem] text-blue-950">
                {activeFilterCount}
              </span>
            )}
          </button>
          {canManage && (
            <Link
              href={`/projects/${projectId}/members`}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-cyan-300/40 bg-blue-950/55 px-3 py-2.5 font-medium text-cyan-50 text-sm hover:bg-blue-900/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              <Settings size={16} /> Manage project
            </Link>
          )}
        </div>
      </header>
    </TechFrameCard>
  )
}
