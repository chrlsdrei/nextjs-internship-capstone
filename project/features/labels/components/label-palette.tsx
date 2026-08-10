import { Plus, Save, Tag, Trash2 } from "lucide-react"

import { ActionFeedback } from "@/components/ui/action-feedback"
import { Button } from "@/components/ui/button"
import { LabelBadge } from "@/features/labels/components/label-badge"
import type { LabelDto } from "@/features/labels/label.types"
import type { ActionState } from "@/lib/action-state"

type FormAction = (payload: FormData) => void

export function LabelPalette({
  projectId,
  labels,
  createAction,
  updateAction,
  deleteAction,
  createState,
  updateState,
  deleteState,
  creating,
  updating,
  deleting,
}: {
  projectId: string
  labels: LabelDto[]
  createAction: FormAction
  updateAction: FormAction
  deleteAction: FormAction
  createState: ActionState
  updateState: ActionState
  deleteState: ActionState
  creating: boolean
  updating: boolean
  deleting: boolean
}) {
  return (
    <section className="rounded-lg border border-french-gray-300 bg-white p-4 dark:border-paynes-gray-400 dark:bg-outer-space-500">
      <div>
        <h2 className="flex items-center gap-2 font-semibold text-outer-space-500 dark:text-platinum-500">
          <Tag aria-hidden="true" size={17} /> Label palette
        </h2>
        <p className="mt-1 text-paynes-gray-500 text-sm dark:text-french-gray-400">
          Create reusable labels for cards in this project.
        </p>
      </div>

      <form action={createAction} className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <input type="hidden" name="projectId" value={projectId} />
        <input
          name="name"
          required
          maxLength={100}
          placeholder="Label name"
          aria-label="New label name"
          className="min-w-0 rounded border border-french-gray-300 bg-white px-3 py-2 text-sm dark:border-paynes-gray-400 dark:bg-outer-space-400"
        />
        <input
          name="color"
          type="color"
          defaultValue="#2563eb"
          aria-label="New label color"
          className="h-9 w-full min-w-14 cursor-pointer rounded border border-french-gray-300 bg-white p-1 dark:border-paynes-gray-400 dark:bg-outer-space-400 sm:w-14"
        />
        <Button type="submit" size="sm" disabled={creating}>
          <Plus aria-hidden="true" size={15} /> {creating ? "Adding…" : "Add label"}
        </Button>
      </form>
      <ActionFeedback state={createState} />

      {labels.length === 0 ? (
        <p className="mt-4 rounded border border-dashed border-french-gray-300 p-4 text-paynes-gray-500 text-sm dark:border-paynes-gray-400 dark:text-french-gray-400">
          No labels yet. Add the first label above.
        </p>
      ) : (
        <div className="mt-4 space-y-2">
          {labels.map((label) => (
            <div
              key={label.id}
              className="grid gap-2 rounded-lg border border-french-gray-300 p-3 sm:grid-cols-[auto_1fr_auto_auto_auto] sm:items-center dark:border-paynes-gray-400"
            >
              <LabelBadge label={label} />
              <form action={updateAction} className="contents">
                <input type="hidden" name="projectId" value={projectId} />
                <input type="hidden" name="labelId" value={label.id} />
                <input
                  name="name"
                  required
                  maxLength={100}
                  defaultValue={label.name}
                  aria-label={`Name for ${label.name}`}
                  className="min-w-0 rounded border border-french-gray-300 bg-white px-2 py-1.5 text-sm dark:border-paynes-gray-400 dark:bg-outer-space-400"
                />
                <input
                  name="color"
                  type="color"
                  defaultValue={label.color}
                  aria-label={`Color for ${label.name}`}
                  className="h-8 w-full min-w-12 cursor-pointer rounded border border-french-gray-300 bg-white p-1 dark:border-paynes-gray-400 dark:bg-outer-space-400 sm:w-12"
                />
                <Button
                  type="submit"
                  variant="outline"
                  size="icon"
                  disabled={updating}
                  aria-label={`Save ${label.name}`}
                >
                  <Save aria-hidden="true" size={15} />
                </Button>
              </form>
              <form action={deleteAction} className="sm:col-start-5">
                <input type="hidden" name="projectId" value={projectId} />
                <input type="hidden" name="labelId" value={label.id} />
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon"
                  disabled={deleting}
                  aria-label={`Delete ${label.name}`}
                  className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950"
                >
                  <Trash2 aria-hidden="true" size={15} />
                </Button>
              </form>
            </div>
          ))}
        </div>
      )}
      <ActionFeedback state={updateState} />
      <ActionFeedback state={deleteState} />
    </section>
  )
}
