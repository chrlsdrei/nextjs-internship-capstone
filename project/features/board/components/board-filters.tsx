import { Check, Filter, Search, Users } from "lucide-react"
import { TechFrameCard } from "@/components/ui/tech-frame-card"
import type { BoardMemberDto, BoardTaskDto } from "@/features/board/board.types"
import type { LabelDto } from "@/features/labels/label.types"
import { labelColorStyle } from "@/features/labels/label-color"

export function BoardFilters({
  search,
  priority,
  selectedAssigneeIds,
  includeUnassigned,
  selectedLabelIds,
  members,
  labels,
  onSearchChange,
  onPriorityChange,
  onAssigneeToggle,
  onUnassignedToggle,
  onClearAssignees,
  onLabelToggle,
  onClearLabels,
}: {
  search: string
  priority: "all" | BoardTaskDto["priority"]
  selectedAssigneeIds: string[]
  includeUnassigned: boolean
  selectedLabelIds: string[]
  members: BoardMemberDto[]
  labels: LabelDto[]
  onSearchChange: (value: string) => void
  onPriorityChange: (value: "all" | BoardTaskDto["priority"]) => void
  onAssigneeToggle: (memberId: string) => void
  onUnassignedToggle: () => void
  onClearAssignees: () => void
  onLabelToggle: (labelId: string) => void
  onClearLabels: () => void
}) {
  return (
    <TechFrameCard className="w-full">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="relative sm:col-span-1">
          <span className="sr-only">Search tasks</span>
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-100/60" />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search tasks"
            className="w-full rounded border border-cyan-300/35 bg-blue-950/55 py-2 pr-3 pl-9 text-white placeholder:text-cyan-100/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Filter size={16} />
          <span className="sr-only">Filter priority</span>
          <select
            value={priority}
            onChange={(event) => onPriorityChange(event.target.value as "all" | BoardTaskDto["priority"])}
            className="min-w-0 flex-1 rounded border border-cyan-300/35 bg-blue-950/55 px-2 py-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
          >
            <option value="all">All priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>
        <section className="sm:col-span-2" aria-labelledby="assignee-filter-title">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 id="assignee-filter-title" className="flex items-center gap-2 text-sm font-medium">
              <Users aria-hidden="true" size={16} /> Filter by assignees
            </h3>
            {(selectedAssigneeIds.length > 0 || includeUnassigned) && (
              <button type="button" onClick={onClearAssignees} className="text-cyan-300 text-xs hover:underline">
                Clear assignees
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              aria-pressed={includeUnassigned}
              onClick={onUnassignedToggle}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-munsell-500 ${
                includeUnassigned
                  ? "border-cyan-300 bg-cyan-400/20 text-white ring-1 ring-cyan-300"
                  : "border-cyan-300/35 bg-blue-950/35 text-cyan-50"
              }`}
            >
              {includeUnassigned && <Check aria-hidden="true" size={12} />} Unassigned
            </button>
            {members.map((member) => {
              const selected = selectedAssigneeIds.includes(member.id)
              return (
                <button
                  key={member.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onAssigneeToggle(member.id)}
                  title={member.email}
                  className={`inline-flex max-w-full items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-munsell-500 ${
                    selected
                      ? "border-cyan-300 bg-cyan-400/20 text-white ring-1 ring-cyan-300"
                      : "border-cyan-300/35 bg-blue-950/35 text-cyan-50"
                  }`}
                >
                  {selected && <Check aria-hidden="true" size={12} />}
                  <span className="truncate">{member.name}</span>
                </button>
              )
            })}
          </div>
          <p className="mt-2 text-cyan-100/65 text-xs">
            Selecting multiple assignees shows tasks assigned to any selected member.
          </p>
        </section>
        {labels.length > 0 && (
          <section className="sm:col-span-2" aria-labelledby="label-filter-title">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h3 id="label-filter-title" className="text-sm font-medium">
                Filter by labels
              </h3>
              {selectedLabelIds.length > 0 && (
                <button type="button" onClick={onClearLabels} className="text-cyan-300 text-xs hover:underline">
                  Clear labels
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {labels.map((label) => {
                const selected = selectedLabelIds.includes(label.id)
                return (
                  <button
                    key={label.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onLabelToggle(label.id)}
                    className={`inline-flex max-w-full items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-munsell-500 ${
                      selected
                        ? "ring-2 ring-blue-munsell-500 ring-offset-2 dark:ring-offset-outer-space-500"
                        : "opacity-75"
                    }`}
                    style={labelColorStyle(label.color)}
                  >
                    {selected && <Check aria-hidden="true" size={12} />}
                    <span className="truncate">{label.name}</span>
                  </button>
                )
              })}
            </div>
            <p className="mt-2 text-cyan-100/65 text-xs">
              Selecting multiple labels shows tasks matching any selected label.
            </p>
          </section>
        )}
      </div>
    </TechFrameCard>
  )
}
