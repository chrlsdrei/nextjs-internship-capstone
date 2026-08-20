export class WorkspaceAccessError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = "WorkspaceAccessError"
  }
}
