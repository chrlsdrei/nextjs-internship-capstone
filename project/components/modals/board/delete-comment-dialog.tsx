"use client"

import { LoaderCircle, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"

type DeleteCommentDialogProps = {
  open: boolean
  authorName: string
  commentContent: string | null
  errorMessage?: string
  isDeleting: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function DeleteCommentDialog({
  open,
  authorName,
  commentContent,
  errorMessage,
  isDeleting,
  onCancel,
  onConfirm,
}: DeleteCommentDialogProps) {
  const closeDialog = () => {
    if (!isDeleting) onCancel()
  }

  return (
    <Modal
      open={open}
      onClose={closeDialog}
      title="Delete comment"
      description="This action cannot be undone."
      className="max-w-md"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" disabled={isDeleting} onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="bg-red-600 text-white hover:bg-red-500 focus-visible:ring-red-300"
          >
            {isDeleting ? (
              <>
                <LoaderCircle aria-hidden="true" className="animate-spin" size={16} />
                Deleting…
              </>
            ) : (
              <>
                <Trash2 aria-hidden="true" size={16} />
                Delete comment
              </>
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 px-1">
        <p className="text-cyan-50 text-sm">
          Delete <span className="font-semibold text-white">{authorName}&apos;s</span> comment?
        </p>
        {commentContent && (
          <blockquote className="max-h-28 overflow-hidden rounded-lg border border-cyan-300/20 bg-slate-950/45 px-4 py-3 text-cyan-100/70 text-sm">
            <p className="line-clamp-4 whitespace-pre-wrap break-words">{commentContent}</p>
          </blockquote>
        )}
        {errorMessage && (
          <p role="alert" className="rounded-lg border border-red-400/35 bg-red-950/45 px-3 py-2 text-red-200 text-sm">
            {errorMessage}
          </p>
        )}
      </div>
    </Modal>
  )
}
