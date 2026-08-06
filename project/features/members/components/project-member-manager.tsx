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
  updateProject: FormController
}

export function ProjectMemberManager({
  project,
  members,
  workspaceOwner,
  role,
  addMember,
  deleteProject,
  updateProject,
}: ProjectMemberManagerProps) {
  const canDelete = role === "board_admin"
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
          Add an active member of this workspace by email. Removing board access unassigns their tasks without deleting
          their workspace membership.
        </p>
        <div className="mt-4 rounded-lg border border-blue-munsell-200 bg-blue-munsell-50 p-4 dark:border-blue-munsell-800 dark:bg-blue-munsell-900/20">
          <p className="font-medium text-sm">{workspaceOwner.name}</p>
          <p className="text-paynes-gray-500 text-sm dark:text-french-gray-400">{workspaceOwner.email}</p>
          <p className="mt-1 text-blue-munsell-700 text-xs dark:text-blue-munsell-300">
            Workspace owner · implicit board administrator access
          </p>
        </div>
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
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
            <option value="board_admin">Board administrator</option>
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

      {canDelete && (
        <section className="rounded-lg border border-yellow-300 bg-yellow-50 p-6 dark:border-yellow-800 dark:bg-yellow-900/20">
          <h2 className="font-semibold text-lg text-yellow-900 dark:text-yellow-100">Project controls</h2>
          <form action={deleteProject.action} className="mt-4">
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
