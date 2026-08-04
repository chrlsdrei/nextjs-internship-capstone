import { ActionFeedback } from "@/components/ui/action-feedback"
import type { ProjectMemberDto } from "@/features/members/member.types"
import type { ActionState } from "@/lib/action-state"

type MemberRowProps = {
  member: ProjectMemberDto
  roleAction: (payload: FormData) => void
  rolePending: boolean
  roleState: ActionState
  removeAction: (payload: FormData) => void
  removePending: boolean
  removeState: ActionState
  projectId: string
}

export function MemberRow({
  member,
  roleAction,
  rolePending,
  roleState,
  removeAction,
  removePending,
  removeState,
  projectId,
}: MemberRowProps) {
  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium text-outer-space-500 dark:text-platinum-500">{member.name}</p>
        <p className="text-paynes-gray-500 text-sm dark:text-french-gray-400">{member.email}</p>
      </div>
      <div className="flex items-center gap-4">
        {member.role === "owner" ? (
          <span className="capitalize text-paynes-gray-500 text-sm dark:text-french-gray-400">Owner</span>
        ) : (
          <>
            <form action={roleAction} className="flex items-center gap-2">
              <input type="hidden" name="projectId" value={projectId} />
              <input type="hidden" name="memberId" value={member.id} />
              <select
                name="role"
                defaultValue={member.role}
                className="rounded border border-french-gray-300 bg-white px-2 py-1 text-sm dark:border-paynes-gray-400 dark:bg-outer-space-400"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <button
                type="submit"
                disabled={rolePending}
                className="text-blue-munsell-500 text-sm disabled:opacity-60"
              >
                Save
              </button>
              <ActionFeedback state={roleState} />
            </form>
            <form action={removeAction}>
              <input type="hidden" name="projectId" value={projectId} />
              <input type="hidden" name="memberId" value={member.id} />
              <button type="submit" disabled={removePending} className="text-red-600 text-sm disabled:opacity-60">
                Remove
              </button>
              <ActionFeedback state={removeState} />
            </form>
          </>
        )}
      </div>
    </div>
  )
}
