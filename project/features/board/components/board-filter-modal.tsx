import { Check, Filter, Users } from "lucide-react"

import { Modal } from "@/components/ui/modal"
import type { BoardMemberDto, BoardTaskDto } from "@/features/board/board.types"
import type { LabelDto } from "@/features/labels/label.types"
import { labelColorStyle } from "@/features/labels/label-color"

type BoardFilterModalProps = {
  open: boolean
  priority: "all" | BoardTaskDto["priority"]
  selectedAssigneeIds: string[]
  includeUnassigned: boolean
  selectedLabelIds: string[]
  members: BoardMemberDto[]
  labels: LabelDto[]
  onClose: () => void
  onPriorityChange: (value: "all" | BoardTaskDto["priority"]) => void
  onAssigneeToggle: (memberId: string) => void
  onUnassignedToggle: () => void
  onClearAssignees: () => void
  onLabelToggle: (labelId: string) => void
  onClearLabels: () => void
  onClearAll: () => void
}

const filterChipClass =
  "inline-flex max-w-full items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"

export function BoardFilterModal({
  open,
  priority,
  selectedAssigneeIds,
  includeUnassigned,
  selectedLabelIds,
  members,
  labels,
  onClose,
  onPriorityChange,
  onAssigneeToggle,
  onUnassignedToggle,
  onClearAssignees,
  onLabelToggle,
  onClearLabels,
  onClearAll,
}: BoardFilterModalProps) {
  const hasFilters =
    priority !== "all" || includeUnassigned || selectedAssigneeIds.length > 0 || selectedLabelIds.length > 0

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Filter board"
      description="Narrow the visible cards without changing the board data."
      footer={
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClearAll}
            disabled={!hasFilters}
            className="rounded px-3 py-2 text-cyan-100/70 text-sm hover:bg-white/10 hover:text-white disabled:opacity-40"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded bg-cyan-400 px-4 py-2 font-medium text-blue-950 text-sm"
          >
            Done
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        <label className="block text-sm">
          <span className="mb-2 flex items-center gap-2 font-medium text-white">
            <Filter size={16} /> Priority
          </span>
          <select
            value={priority}
            onChange={(event) => onPriorityChange(event.target.value as "all" | BoardTaskDto["priority"])}
            className="w-full rounded border border-cyan-300/35 bg-blue-950/70 px-3 py-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            <option value="all">All priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>

        <section aria-labelledby="modal-assignee-filter-title">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 id="modal-assignee-filter-title" className="flex items-center gap-2 font-medium text-sm text-white">
              <Users size={16} /> Assignees
            </h3>
            {(selectedAssigneeIds.length > 0 || includeUnassigned) && (
              <button type="button" onClick={onClearAssignees} className="text-cyan-300 text-xs hover:underline">
                Clear
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              aria-pressed={includeUnassigned}
              onClick={onUnassignedToggle}
              className={`${filterChipClass} ${
                includeUnassigned
                  ? "border-cyan-300 bg-cyan-400/20 text-white ring-1 ring-cyan-300"
                  : "border-cyan-300/35 bg-blue-950/35 text-cyan-50"
              }`}
            >
              {includeUnassigned && <Check size={12} />} Unassigned
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
                  className={`${filterChipClass} ${
                    selected
                      ? "border-cyan-300 bg-cyan-400/20 text-white ring-1 ring-cyan-300"
                      : "border-cyan-300/35 bg-blue-950/35 text-cyan-50"
                  }`}
                >
                  {selected && <Check size={12} />}
                  <span className="truncate">{member.name}</span>
                </button>
              )
            })}
          </div>
          <p className="mt-2 text-cyan-100/60 text-xs">Multiple selections match any selected assignee.</p>
        </section>

        {labels.length > 0 && (
          <section aria-labelledby="modal-label-filter-title">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h3 id="modal-label-filter-title" className="font-medium text-sm text-white">
                Labels
              </h3>
              {selectedLabelIds.length > 0 && (
                <button type="button" onClick={onClearLabels} className="text-cyan-300 text-xs hover:underline">
                  Clear
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
                    className={`inline-flex max-w-full items-center gap-1 rounded-full px-2.5 py-1 font-semibold text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
                      selected ? "ring-2 ring-cyan-300 ring-offset-2 ring-offset-[#03112b]" : "opacity-70"
                    }`}
                    style={labelColorStyle(label.color)}
                  >
                    {selected && <Check size={12} />}
                    <span className="truncate">{label.name}</span>
                  </button>
                )
              })}
            </div>
            <p className="mt-2 text-cyan-100/60 text-xs">Multiple selections match any selected label.</p>
          </section>
        )}
      </div>
    </Modal>
  )
}
