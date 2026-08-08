export class LabelError extends Error {
  constructor(
    message: string,
    public readonly code: "LABEL_NOT_FOUND" | "DUPLICATE_LABEL" | "INVALID_TASK_LABELS",
    public readonly status = 400,
  ) {
    super(message)
    this.name = "LabelError"
  }
}
