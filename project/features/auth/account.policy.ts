export type ApplicationAccountStatus = "active" | "suspended" | "deleted"

export class AccountAccessError extends Error {
  readonly status = 403

  constructor(message: string) {
    super(message)
    this.name = "AccountAccessError"
  }
}

export function assertAccountCanAccessApplication(status: ApplicationAccountStatus) {
  if (status === "suspended") {
    throw new AccountAccessError("Your account is suspended. Contact support for assistance.")
  }
  if (status === "deleted") {
    throw new AccountAccessError("This account is no longer active.")
  }
}
