import { ActionFeedback } from "@/components/ui/action-feedback"
import { MemberRowController } from "@/features/members/controllers/member-row.controller"
import type { ProjectManagementDto } from "@/features/members/member.types"
import type { ActionState } from "@/lib/action-state"

type FormController = {
  action: (payload: FormData) => void
  pending: boolean
  state: ActionState
}

type ProjectMemberManagerProps = ProjectManagementDto & {
  addMember: FormController
  deleteProject: FormController
  transferOwnership: FormController
  updateProject: FormController
}

export function ProjectMemberManager({
  project,
  members,
  role,
  addMember,
  deleteProject,
  transferOwnership,
  updateProject,
}: ProjectMemberManagerProps) {
  const isOwner = role === "owner"
  const dateValue = project.dueDate?.slice(0, 10) ?? ""

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-french-gray-300 bg-white p-6 dark:border-paynes-gray-400 dark:bg-outer-space-500">
        <h2 className="font-semibold text-lg text-outer-space-500 dark:text-platinum-500">Project settings</h2>
        <form action={updateProject.action} className="mt-4 grid gap-4">
          <input type="hidden" name="projectId" value={project.id} />
          <label className="font-medium text-sm">
            Name
            <input
              name="name"
              required
              maxLength={100}
              defaultValue={project.name}
              className="mt-1 w-full rounded border border-french-gray-300 bg-white px-3 py-2 dark:border-paynes-gray-400 dark:bg-outer-space-400"
            />
          </label>
          <label className="font-medium text-sm">
            Description
            <textarea
              name="description"
              maxLength={500}
              defaultValue={project.description ?? ""}
              className="mt-1 w-full rounded border border-french-gray-300 bg-white px-3 py-2 dark:border-paynes-gray-400 dark:bg-outer-space-400"
            />
          </label>
          <label className="font-medium text-sm">
            Due date
            <input
              name="dueDate"
              type="date"
              defaultValue={dateValue}
              className="mt-1 w-full rounded border border-french-gray-300 bg-white px-3 py-2 dark:border-paynes-gray-400 dark:bg-outer-space-400"
            />
          </label>
          <div>
            <button
              type="submit"
              disabled={updateProject.pending}
              className="rounded bg-blue-munsell-500 px-4 py-2 text-white disabled:opacity-60"
            >
              {updateProject.pending ? "Saving…" : "Save settings"}
            </button>
            <ActionFeedback state={updateProject.state} />
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-french-gray-300 bg-white p-6 dark:border-paynes-gray-400 dark:bg-outer-space-500">
        <h2 className="font-semibold text-lg text-outer-space-500 dark:text-platinum-500">Members</h2>
        <p className="mt-1 text-paynes-gray-500 text-sm dark:text-french-gray-400">
          Add an already-synchronized Clerk user by email. Removing a member unassigns their tasks without deleting
          them.
        </p>
        <form action={addMember.action} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input type="hidden" name="projectId" value={project.id} />
          <input
            name="email"
            type="email"
            required
            placeholder="name@example.com"
            className="min-w-0 flex-1 rounded border border-french-gray-300 bg-white px-3 py-2 dark:border-paynes-gray-400 dark:bg-outer-space-400"
          />
          <select
            name="role"
            defaultValue="member"
            className="rounded border border-french-gray-300 bg-white px-3 py-2 dark:border-paynes-gray-400 dark:bg-outer-space-400"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <button
            type="submit"
            disabled={addMember.pending}
            className="rounded bg-blue-munsell-500 px-4 py-2 text-white disabled:opacity-60"
          >
            {addMember.pending ? "Adding…" : "Add member"}
          </button>
        </form>
        <ActionFeedback state={addMember.state} />
        <div className="mt-5 divide-y divide-french-gray-300 dark:divide-paynes-gray-400">
          {members.map((member) => (
            <MemberRowController key={member.id} projectId={project.id} member={member} />
          ))}
        </div>
      </section>

      {isOwner && (
        <section className="rounded-lg border border-yellow-300 bg-yellow-50 p-6 dark:border-yellow-800 dark:bg-yellow-900/20">
          <h2 className="font-semibold text-lg text-yellow-900 dark:text-yellow-100">Owner controls</h2>
          <form action={transferOwnership.action} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input type="hidden" name="projectId" value={project.id} />
            <select
              name="memberId"
              required
              className="min-w-0 flex-1 rounded border border-yellow-300 bg-white px-3 py-2 dark:border-yellow-800 dark:bg-outer-space-400"
            >
              <option value="">Transfer ownership to…</option>
              {members
                .filter((member) => member.role !== "owner")
                .map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({member.email})
                  </option>
                ))}
            </select>
            <button
              type="submit"
              disabled={transferOwnership.pending || members.length < 2}
              className="rounded bg-yellow-700 px-4 py-2 text-white disabled:opacity-60"
            >
              {transferOwnership.pending ? "Transferring…" : "Transfer ownership"}
            </button>
          </form>
          <ActionFeedback state={transferOwnership.state} />
          <form action={deleteProject.action} className="mt-6 border-yellow-300 border-t pt-5 dark:border-yellow-800">
            <input type="hidden" name="projectId" value={project.id} />
            <button
              type="submit"
              disabled={deleteProject.pending}
              className="rounded bg-red-600 px-4 py-2 text-white disabled:opacity-60"
            >
              {deleteProject.pending ? "Deleting…" : "Delete project"}
            </button>
            <ActionFeedback state={deleteProject.state} />
            <p className="mt-2 text-sm text-yellow-900 dark:text-yellow-100">
              Deleting a project also deletes its lists, tasks, and memberships.
            </p>
          </form>
        </section>
      )}
    </div>
  )
}
