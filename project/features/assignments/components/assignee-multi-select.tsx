import { Check, Search, Users } from "lucide-react"

import { ScrollArea } from "@/components/ui/scroll-area"
import { AssigneeIdentities } from "@/features/assignments/components/assignee-identities"
import type { BoardMemberDto } from "@/features/board/board.types"

export function AssigneeMultiSelect({
  members,
  selectedIds,
  search,
  onSearchChange,
  onToggle,
  onClear,
}: {
  members: BoardMemberDto[]
  selectedIds: string[]
  search: string
  onSearchChange: (value: string) => void
  onToggle: (memberId: string) => void
  onClear: () => void
}) {
  const term = search.trim().toLocaleLowerCase("en-US")
  const visibleMembers = members.filter(
    (member) =>
      !term ||
      member.name.toLocaleLowerCase("en-US").includes(term) ||
      member.email.toLocaleLowerCase("en-US").includes(term),
  )
  const selectedMembers = members.filter((member) => selectedIds.includes(member.id))

  return (
    <fieldset>
      <legend className="text-sm font-medium">Assignees</legend>
      <input type="hidden" name="assigneeIds" value={JSON.stringify(selectedIds)} />
      <div className="mt-2 rounded-lg border border-french-gray-300 dark:border-paynes-gray-400">
        <label className="relative block border-french-gray-300 border-b dark:border-paynes-gray-400">
          <span className="sr-only">Search project members</span>
          <Search
            aria-hidden="true"
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-paynes-gray-500"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search members by name or email"
            className="w-full rounded-t-lg bg-white py-2 pr-3 pl-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-munsell-500 dark:bg-outer-space-400"
          />
        </label>
        <ScrollArea className="max-h-44 space-y-1 p-2">
          {visibleMembers.length === 0 ? (
            <p className="px-2 py-3 text-center text-paynes-gray-500 text-sm dark:text-french-gray-400">
              No active project members match your search.
            </p>
          ) : (
            visibleMembers.map((member) => {
              const selected = selectedIds.includes(member.id)
              return (
                <label
                  key={member.id}
                  className="flex cursor-pointer items-center gap-3 rounded px-2 py-2 hover:bg-platinum-700 dark:hover:bg-outer-space-300"
                >
                  <input type="checkbox" checked={selected} onChange={() => onToggle(member.id)} className="sr-only" />
                  <span
                    aria-hidden="true"
                    className={`flex size-5 items-center justify-center rounded border ${
                      selected
                        ? "border-blue-munsell-600 bg-blue-munsell-600 text-white"
                        : "border-french-gray-400 dark:border-paynes-gray-300"
                    }`}
                  >
                    {selected && <Check size={13} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{member.name}</span>
                    <span className="block truncate text-paynes-gray-500 text-xs dark:text-french-gray-400">
                      {member.email}
                    </span>
                  </span>
                </label>
              )
            })
          )}
        </ScrollArea>
      </div>
      <div className="mt-2 flex min-h-7 items-center gap-2 text-paynes-gray-500 text-xs dark:text-french-gray-400">
        {selectedMembers.length > 0 ? (
          <>
            <AssigneeIdentities assignees={selectedMembers} limit={5} />
            <span>{selectedMembers.length} selected</span>
            <button type="button" onClick={onClear} className="ml-auto text-blue-munsell-600 hover:underline">
              Clear assignments
            </button>
          </>
        ) : (
          <>
            <Users aria-hidden="true" size={15} /> Unassigned
          </>
        )}
      </div>
    </fieldset>
  )
}
