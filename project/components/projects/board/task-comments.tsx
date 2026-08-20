import { LoaderCircle, MessageSquare, Pencil, Trash2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { TaskCommentDto } from "@/features/comments/comment.types"
import type { ActionState } from "@/lib/action-state"

const timestampFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
})

type TaskCommentsProps = {
  comments: TaskCommentDto[]
  canComment: boolean
  draft: string
  editingCommentId: string | null
  editDraft: string
  feedback: ActionState<TaskCommentDto>
  loadError: string | null
  hasMore: boolean
  isLoading: boolean
  isMutating: boolean
  onDraftChange: (value: string) => void
  onSubmit: () => void
  onEditStart: (comment: TaskCommentDto) => void
  onEditCancel: () => void
  onEditDraftChange: (value: string) => void
  onEditSubmit: () => void
  onDelete: (comment: TaskCommentDto) => void
  onLoadMore: () => void
}

function feedbackMessage(state: ActionState<TaskCommentDto>) {
  if (state.status !== "error") return state.status === "success" ? state.message : null
  if (state.retryAfterSeconds === undefined) return state.message
  return `${state.message} Try again in ${state.retryAfterSeconds} seconds.`
}

export function TaskComments({
  comments,
  canComment,
  draft,
  editingCommentId,
  editDraft,
  feedback,
  loadError,
  hasMore,
  isLoading,
  isMutating,
  onDraftChange,
  onSubmit,
  onEditStart,
  onEditCancel,
  onEditDraftChange,
  onEditSubmit,
  onDelete,
  onLoadMore,
}: TaskCommentsProps) {
  const message = feedbackMessage(feedback)

  return (
    <section
      aria-labelledby="task-comments-heading"
      className="border-french-gray-300 border-t pt-5 dark:border-paynes-gray-400"
    >
      <div>
        <h3 id="task-comments-heading" className="flex items-center gap-2 font-semibold">
          <MessageSquare aria-hidden="true" size={18} /> Comments
        </h3>
        <p className="mt-1 text-paynes-gray-500 text-sm dark:text-french-gray-400">
          Discuss this task with the project team.
        </p>
      </div>

      {canComment ? (
        <form
          className="mt-4"
          onSubmit={(event) => {
            event.preventDefault()
            onSubmit()
          }}
        >
          <label htmlFor="new-task-comment" className="sr-only">
            Add a comment
          </label>
          <textarea
            id="new-task-comment"
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            required
            maxLength={5000}
            rows={3}
            disabled={isMutating}
            placeholder="Write a comment…"
            className="w-full resize-y rounded border border-french-gray-300 bg-white px-3 py-2 text-sm dark:border-paynes-gray-400 dark:bg-outer-space-400"
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-paynes-gray-500 text-xs dark:text-french-gray-400">{draft.length}/5000</span>
            <Button type="submit" size="sm" disabled={isMutating || draft.trim().length === 0}>
              {isMutating ? "Posting…" : "Comment"}
            </Button>
          </div>
        </form>
      ) : (
        <p className="mt-4 rounded border border-french-gray-300 bg-platinum-700 p-3 text-paynes-gray-500 text-sm dark:border-paynes-gray-400 dark:bg-outer-space-400 dark:text-french-gray-400">
          You have read-only access to this discussion.
        </p>
      )}

      <p
        role={feedback.status === "error" || loadError ? "alert" : "status"}
        aria-live="polite"
        className={`mt-3 min-h-5 text-sm ${
          feedback.status === "error" || loadError ? "text-red-600 dark:text-red-400" : "text-green-600"
        }`}
      >
        {loadError ?? message ?? ""}
      </p>

      {isLoading && comments.length === 0 ? (
        <p
          role="status"
          className="mt-3 flex items-center gap-2 text-paynes-gray-500 text-sm dark:text-french-gray-400"
        >
          <LoaderCircle aria-hidden="true" className="animate-spin" size={16} /> Loading comments…
        </p>
      ) : comments.length === 0 ? (
        <p className="mt-3 rounded border border-dashed border-french-gray-300 p-4 text-paynes-gray-500 text-sm dark:border-paynes-gray-400 dark:text-french-gray-400">
          No comments yet.
        </p>
      ) : (
        <ol className="mt-3 space-y-3">
          {comments.map((comment) => {
            const isEditing = editingCommentId === comment.id
            return (
              <li key={comment.id} className="rounded-lg border border-french-gray-300 p-3 dark:border-paynes-gray-400">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-outer-space-500 dark:text-platinum-500">
                      {comment.author.name}
                      {comment.author.removed && (
                        <span className="ml-2 font-normal text-paynes-gray-500 text-xs dark:text-french-gray-400">
                          Former workspace member
                        </span>
                      )}
                    </p>
                    <time
                      dateTime={comment.createdAt}
                      className="text-paynes-gray-500 text-xs dark:text-french-gray-400"
                    >
                      {timestampFormatter.format(new Date(comment.createdAt))}
                      {comment.updatedAt !== comment.createdAt && !comment.deletedAt ? " · edited" : ""}
                    </time>
                  </div>
                  {!comment.deletedAt && (comment.permissions.canEdit || comment.permissions.canDelete) && (
                    <div className="flex shrink-0 items-center gap-1">
                      {comment.permissions.canEdit && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={isMutating}
                          onClick={() => onEditStart(comment)}
                          aria-label={`Edit comment by ${comment.author.name}`}
                        >
                          <Pencil aria-hidden="true" size={14} />
                        </Button>
                      )}
                      {comment.permissions.canDelete && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={isMutating}
                          onClick={() => onDelete(comment)}
                          aria-label={`Delete comment by ${comment.author.name}`}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950"
                        >
                          <Trash2 aria-hidden="true" size={14} />
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {comment.deletedAt ? (
                  <p className="mt-2 text-paynes-gray-500 text-sm italic dark:text-french-gray-400">
                    This comment was deleted.
                  </p>
                ) : isEditing ? (
                  <form
                    className="mt-3"
                    onSubmit={(event) => {
                      event.preventDefault()
                      onEditSubmit()
                    }}
                  >
                    <label htmlFor={`edit-comment-${comment.id}`} className="sr-only">
                      Edit comment
                    </label>
                    <textarea
                      id={`edit-comment-${comment.id}`}
                      value={editDraft}
                      onChange={(event) => onEditDraftChange(event.target.value)}
                      required
                      maxLength={5000}
                      rows={3}
                      disabled={isMutating}
                      className="w-full resize-y rounded border border-french-gray-300 bg-white px-3 py-2 text-sm dark:border-paynes-gray-400 dark:bg-outer-space-400"
                    />
                    <div className="mt-2 flex justify-end gap-2">
                      <Button type="button" variant="ghost" size="sm" disabled={isMutating} onClick={onEditCancel}>
                        <X aria-hidden="true" size={14} /> Cancel
                      </Button>
                      <Button type="submit" size="sm" disabled={isMutating || editDraft.trim().length === 0}>
                        {isMutating ? "Saving…" : "Save"}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm">{comment.content}</p>
                )}
              </li>
            )
          })}
        </ol>
      )}

      {hasMore && (
        <Button type="button" variant="outline" className="mt-4 w-full" disabled={isLoading} onClick={onLoadMore}>
          {isLoading && <LoaderCircle aria-hidden="true" className="animate-spin" size={16} />}
          {isLoading ? "Loading comments…" : "Load older comments"}
        </Button>
      )}
    </section>
  )
}
