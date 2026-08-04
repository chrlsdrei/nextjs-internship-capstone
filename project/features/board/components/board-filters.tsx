import { Filter, Search } from "lucide-react"

import type { BoardMemberDto, BoardTaskDto } from "@/features/board/board.types"

export function BoardFilters({
  search,
  priority,
  assigneeId,
  members,
  onSearchChange,
  onPriorityChange,
  onAssigneeChange,
}: {
  search: string
  priority: "all" | BoardTaskDto["priority"]
  assigneeId: string
  members: BoardMemberDto[]
  onSearchChange: (value: string) => void
  onPriorityChange: (value: "all" | BoardTaskDto["priority"]) => void
  onAssigneeChange: (value: string) => void
}) {
  return (
    <div className="grid gap-3 rounded-lg border border-french-gray-300 bg-white p-4 sm:grid-cols-3 dark:border-paynes-gray-400 dark:bg-outer-space-500">
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
      <label className="text-sm">
        <span className="sr-only">Filter assignee</span>
        <select
          value={assigneeId}
          onChange={(event) => onAssigneeChange(event.target.value)}
          className="w-full rounded border border-french-gray-300 bg-white px-2 py-2 dark:border-paynes-gray-400 dark:bg-outer-space-400"
        >
          <option value="all">All assignees</option>
          <option value="unassigned">Unassigned</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
