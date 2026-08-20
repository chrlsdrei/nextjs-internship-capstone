"use client"

import { useEffect, useState, useTransition } from "react"
import { TaskComments } from "@/components/projects/board/task-comments"
import { createTaskCommentAction } from "@/features/comments/actions/create-task-comment"
import { deleteTaskCommentAction } from "@/features/comments/actions/delete-task-comment"
import { listTaskCommentsAction } from "@/features/comments/actions/list-task-comments"
import { updateTaskCommentAction } from "@/features/comments/actions/update-task-comment"
import type { TaskCommentCursorDto, TaskCommentDto } from "@/features/comments/comment.types"
import { mergeTaskComments, replaceTaskComment } from "@/features/comments/comment-feed"
import type { ActionState } from "@/lib/action-state"
import { initialActionState } from "@/lib/action-state"

const PAGE_SIZE = 20

export function TaskCommentsController({
  projectId,
  taskId,
  canComment,
}: {
  projectId: string
  taskId: string
  canComment: boolean
}) {
  const [comments, setComments] = useState<TaskCommentDto[]>([])
  const [nextCursor, setNextCursor] = useState<TaskCommentCursorDto | null>(null)
  const [draft, setDraft] = useState("")
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState("")
  const [feedback, setFeedback] = useState<ActionState<TaskCommentDto>>(initialActionState)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isLoading, startLoadingTransition] = useTransition()
  const [isMutating, startMutationTransition] = useTransition()

  useEffect(() => {
    let active = true
    setComments([])
    setNextCursor(null)
    setLoadError(null)
    setFeedback(initialActionState)
    setEditingCommentId(null)
    setEditDraft("")

    startLoadingTransition(async () => {
      const state = await listTaskCommentsAction({ projectId, taskId, limit: PAGE_SIZE })
      if (!active) return
      if (state.status === "success" && state.data) {
        setComments(state.data.items)
        setNextCursor(state.data.nextCursor)
      } else if (state.status === "error") {
        setLoadError(state.message)
      }
    })

    return () => {
      active = false
    }
  }, [projectId, taskId])

  const loadMore = () => {
    if (!nextCursor || isLoading) return
    setLoadError(null)
    startLoadingTransition(async () => {
      const state = await listTaskCommentsAction({ projectId, taskId, limit: PAGE_SIZE, cursor: nextCursor })
      if (state.status === "success" && state.data) {
        const page = state.data
        setComments((current) => mergeTaskComments(current, page.items))
        setNextCursor(page.nextCursor)
      } else if (state.status === "error") {
        setLoadError(state.message)
      }
    })
  }

  const submitComment = () => {
    if (!canComment || isMutating) return
    setFeedback(initialActionState)
    startMutationTransition(async () => {
      const state = await createTaskCommentAction({ projectId, taskId, content: draft })
      setFeedback(state)
      if (state.status === "success" && state.data) {
        const comment = state.data
        setComments((current) => mergeTaskComments([comment], current))
        setDraft("")
      }
    })
  }

  const submitEdit = () => {
    if (!editingCommentId || isMutating) return
    setFeedback(initialActionState)
    startMutationTransition(async () => {
      const state = await updateTaskCommentAction({
        projectId,
        taskId,
        commentId: editingCommentId,
        content: editDraft,
      })
      setFeedback(state)
      if (state.status === "success" && state.data) {
        const comment = state.data
        setComments((current) => replaceTaskComment(current, comment))
        setEditingCommentId(null)
        setEditDraft("")
      }
    })
  }

  const deleteComment = (comment: TaskCommentDto) => {
    if (isMutating || !window.confirm(`Delete ${comment.author.name}'s comment?`)) return
    setFeedback(initialActionState)
    startMutationTransition(async () => {
      const state = await deleteTaskCommentAction({ projectId, taskId, commentId: comment.id })
      setFeedback(state)
      if (state.status === "success" && state.data) {
        const deletedComment = state.data
        setComments((current) => replaceTaskComment(current, deletedComment))
        if (editingCommentId === comment.id) {
          setEditingCommentId(null)
          setEditDraft("")
        }
      }
    })
  }

  return (
    <TaskComments
      comments={comments}
      canComment={canComment}
      draft={draft}
      editingCommentId={editingCommentId}
      editDraft={editDraft}
      feedback={feedback}
      loadError={loadError}
      hasMore={nextCursor !== null}
      isLoading={isLoading}
      isMutating={isMutating}
      onDraftChange={setDraft}
      onSubmit={submitComment}
      onEditStart={(comment) => {
        setFeedback(initialActionState)
        setEditingCommentId(comment.id)
        setEditDraft(comment.content ?? "")
      }}
      onEditCancel={() => {
        setEditingCommentId(null)
        setEditDraft("")
      }}
      onEditDraftChange={setEditDraft}
      onEditSubmit={submitEdit}
      onDelete={deleteComment}
      onLoadMore={loadMore}
    />
  )
}
