import { Check, Filter, Search, Users } from "lucide-react"

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
    <div className="grid gap-3 rounded-lg border border-french-gray-300 bg-white p-4 sm:grid-cols-2 dark:border-paynes-gray-400 dark:bg-outer-space-500">
      <label className="relative sm:col-span-1">
        <span className="sr-only">Search tasks</span>
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-paynes-gray-500" />
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search tasks"
          className="w-full rounded border border-french-gray-300 bg-white py-2 pr-3 pl-9 dark:border-paynes-gray-400 dark:bg-outer-space-400"
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <Filter size={16} />
        <span className="sr-only">Filter priority</span>
        <select
          value={priority}
          onChange={(event) => onPriorityChange(event.target.value as "all" | BoardTaskDto["priority"])}
          className="min-w-0 flex-1 rounded border border-french-gray-300 bg-white px-2 py-2 dark:border-paynes-gray-400 dark:bg-outer-space-400"
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
            <button type="button" onClick={onClearAssignees} className="text-blue-munsell-600 text-xs hover:underline">
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
                ? "border-blue-munsell-500 bg-blue-munsell-50 text-blue-munsell-800 ring-1 ring-blue-munsell-500 dark:bg-blue-munsell-950 dark:text-blue-munsell-100"
                : "border-french-gray-300 dark:border-paynes-gray-400"
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
                    ? "border-blue-munsell-500 bg-blue-munsell-50 text-blue-munsell-800 ring-1 ring-blue-munsell-500 dark:bg-blue-munsell-950 dark:text-blue-munsell-100"
                    : "border-french-gray-300 dark:border-paynes-gray-400"
                }`}
              >
                {selected && <Check aria-hidden="true" size={12} />}
                <span className="truncate">{member.name}</span>
              </button>
            )
          })}
        </div>
        <p className="mt-2 text-paynes-gray-500 text-xs dark:text-french-gray-400">
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
              <button type="button" onClick={onClearLabels} className="text-blue-munsell-600 text-xs hover:underline">
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
          <p className="mt-2 text-paynes-gray-500 text-xs dark:text-french-gray-400">
            Selecting multiple labels shows tasks matching any selected label.
          </p>
        </section>
      )}
    </div>
  )
}
