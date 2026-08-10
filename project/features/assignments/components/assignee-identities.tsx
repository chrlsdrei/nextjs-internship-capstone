import type { BoardMemberDto } from "@/features/board/board.types"

function initials(name: string) {
  const characters = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("en-US"))
    .join("")
  return characters || "?"
}

export function AssigneeIdentities({ assignees, limit = 3 }: { assignees: BoardMemberDto[]; limit?: number }) {
  if (assignees.length === 0) return null
  const visible = assignees.slice(0, limit)
  const remaining = assignees.length - visible.length

  return (
    <ul className="flex -space-x-1.5" aria-label={`Assigned to ${assignees.map((member) => member.name).join(", ")}`}>
      {visible.map((member) => (
        <li key={member.id}>
          <span
            title={`${member.name} (${member.email})`}
            className="flex size-7 items-center justify-center rounded-full border-2 border-white bg-blue-munsell-100 font-semibold text-blue-munsell-800 text-xs dark:border-outer-space-300 dark:bg-blue-munsell-900 dark:text-blue-munsell-100"
          >
            {initials(member.name)}
          </span>
        </li>
      ))}
      {remaining > 0 && (
        <li>
          <span className="flex size-7 items-center justify-center rounded-full border-2 border-white bg-french-gray-300 font-semibold text-paynes-gray-600 text-xs dark:border-outer-space-300 dark:bg-paynes-gray-400 dark:text-platinum-500">
            +{remaining}
          </span>
        </li>
      )}
    </ul>
  )
}
