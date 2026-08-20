export class ProjectAccessError extends Error {
  constructor(
    message: string,
    public readonly status = 403,
  ) {
    super(message)
    this.name = "ProjectAccessError"
  }
}
