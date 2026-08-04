"use client"

import { useActionState } from "react"

import {
  addProjectMemberAction,
  deleteProjectAction,
  initialProjectActionState,
  removeProjectMemberAction,
  transferProjectOwnershipAction,
  updateProjectAction,
  updateProjectMemberRoleAction,
} from "@/app/(dashboard)/projects/actions"

type Member = {
  id: string
  userId: string
  email: string
  name: string
  role: "owner" | "admin" | "member"
  createdAt: Date
}
type Project = { id: string; name: string; description: string | null; dueDate: Date | null }

function Feedback({ error, success }: { error?: string; success: boolean }) {
  if (error)
    return (
      <p role="alert" className="mt-2 text-sm text-red-600">
        {error}
      </p>
    )
  if (success)
    return (
      <p role="status" className="mt-2 text-sm text-green-600">
        Saved.
      </p>
    )
  return null
}

function MemberRoleForm({ projectId, member }: { projectId: string; member: Member }) {
  const [state, formAction, isPending] = useActionState(updateProjectMemberRoleAction, initialProjectActionState)
  if (member.role === "owner")
    return <span className="capitalize text-sm text-paynes-gray-500 dark:text-french-gray-400">Owner</span>
  return (
    <form action={formAction} className="flex items-center gap-2">
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
      <button type="submit" disabled={isPending} className="text-sm text-blue-munsell-500 disabled:opacity-60">
        Save
      </button>
      <Feedback error={state.error} success={state.success} />
    </form>
  )
}

function RemoveMemberForm({ projectId, memberId }: { projectId: string; memberId: string }) {
  const [state, formAction, isPending] = useActionState(removeProjectMemberAction, initialProjectActionState)
  return (
    <form action={formAction}>
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="memberId" value={memberId} />
      <button type="submit" disabled={isPending} className="text-sm text-red-600 disabled:opacity-60">
        Remove
      </button>
      <Feedback error={state.error} success={state.success} />
    </form>
  )
}

export function ProjectMemberManager({
  project,
  members,
  role,
}: {
  project: Project
  members: Member[]
  role: Member["role"]
}) {
  const [settingsState, settingsAction, savingSettings] = useActionState(updateProjectAction, initialProjectActionState)
  const [addState, addAction, addingMember] = useActionState(addProjectMemberAction, initialProjectActionState)
  const [transferState, transferAction, transferring] = useActionState(
    transferProjectOwnershipAction,
    initialProjectActionState,
  )
  const [deleteState, deleteAction, deleting] = useActionState(deleteProjectAction, initialProjectActionState)
  const isOwner = role === "owner"
  const dateValue = project.dueDate ? project.dueDate.toISOString().slice(0, 10) : ""

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-french-gray-300 bg-white p-6 dark:border-paynes-gray-400 dark:bg-outer-space-500">
        <h2 className="text-lg font-semibold text-outer-space-500 dark:text-platinum-500">Project settings</h2>
        <form action={settingsAction} className="mt-4 grid gap-4">
          <input type="hidden" name="projectId" value={project.id} />
          <label className="text-sm font-medium">
            Name
            <input
              name="name"
              required
              maxLength={100}
              defaultValue={project.name}
              className="mt-1 w-full rounded border border-french-gray-300 bg-white px-3 py-2 dark:border-paynes-gray-400 dark:bg-outer-space-400"
            />
          </label>
          <label className="text-sm font-medium">
            Description
            <textarea
              name="description"
              maxLength={500}
              defaultValue={project.description ?? ""}
              className="mt-1 w-full rounded border border-french-gray-300 bg-white px-3 py-2 dark:border-paynes-gray-400 dark:bg-outer-space-400"
            />
          </label>
          <label className="text-sm font-medium">
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
              disabled={savingSettings}
              className="rounded bg-blue-munsell-500 px-4 py-2 text-white disabled:opacity-60"
            >
              {savingSettings ? "Saving…" : "Save settings"}
            </button>
            <Feedback error={settingsState.error} success={settingsState.success} />
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-french-gray-300 bg-white p-6 dark:border-paynes-gray-400 dark:bg-outer-space-500">
        <h2 className="text-lg font-semibold text-outer-space-500 dark:text-platinum-500">Members</h2>
        <p className="mt-1 text-sm text-paynes-gray-500 dark:text-french-gray-400">
          Add an already-synchronized Clerk user by email. Removing a member unassigns their tasks without deleting
          them.
        </p>
        <form action={addAction} className="mt-4 flex flex-col gap-3 sm:flex-row">
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
            disabled={addingMember}
            className="rounded bg-blue-munsell-500 px-4 py-2 text-white disabled:opacity-60"
          >
            {addingMember ? "Adding…" : "Add member"}
          </button>
        </form>
        <Feedback error={addState.error} success={addState.success} />
        <div className="mt-5 divide-y divide-french-gray-300 dark:divide-paynes-gray-400">
          {members.map((member) => (
            <div key={member.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-outer-space-500 dark:text-platinum-500">{member.name}</p>
                <p className="text-sm text-paynes-gray-500 dark:text-french-gray-400">{member.email}</p>
              </div>
              <div className="flex items-center gap-4">
                <MemberRoleForm projectId={project.id} member={member} />
                {member.role !== "owner" && <RemoveMemberForm projectId={project.id} memberId={member.id} />}
              </div>
            </div>
          ))}
        </div>
      </section>

      {isOwner && (
        <section className="rounded-lg border border-yellow-300 bg-yellow-50 p-6 dark:border-yellow-800 dark:bg-yellow-900/20">
          <h2 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100">Owner controls</h2>
          <form action={transferAction} className="mt-4 flex flex-col gap-3 sm:flex-row">
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
              disabled={transferring || members.length < 2}
              className="rounded bg-yellow-700 px-4 py-2 text-white disabled:opacity-60"
            >
              {transferring ? "Transferring…" : "Transfer ownership"}
            </button>
          </form>
          <Feedback error={transferState.error} success={transferState.success} />
          <form action={deleteAction} className="mt-6 border-t border-yellow-300 pt-5 dark:border-yellow-800">
            <input type="hidden" name="projectId" value={project.id} />
            <button
              type="submit"
              disabled={deleting}
              className="rounded bg-red-600 px-4 py-2 text-white disabled:opacity-60"
            >
              {deleting ? "Deleting…" : "Delete project"}
            </button>
            <Feedback error={deleteState.error} success={deleteState.success} />
            <p className="mt-2 text-sm text-yellow-900 dark:text-yellow-100">
              Deleting a project also deletes its lists, tasks, and memberships.
            </p>
          </form>
        </section>
      )}
    </div>
  )
}
