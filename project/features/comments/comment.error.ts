export class CommentError extends Error {
  constructor(
    message: string,
    public readonly code: "COMMENT_NOT_FOUND" | "COMMENT_DELETED" | "COMMENT_FORBIDDEN" | "TASK_NOT_FOUND",
    public readonly status = 400,
  ) {
    super(message)
    this.name = "CommentError"
  }
}
