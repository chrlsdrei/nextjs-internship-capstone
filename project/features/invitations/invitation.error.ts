export type InvitationErrorCode =
  | "INVITATION_INVALID"
  | "INVITATION_EXPIRED"
  | "INVITATION_REVOKED"
  | "INVITATION_DECLINED"
  | "INVITATION_ACCEPTED"
  | "INVITATION_EMAIL_MISMATCH"
  | "INVITATION_CONFLICT"
  | "INVITATION_FORBIDDEN"
  | "INVITATION_DELIVERY_FAILED"
  | "INVITATION_CONFIGURATION"

export class InvitationError extends Error {
  constructor(
    message: string,
    readonly code: InvitationErrorCode,
    readonly status = 400,
  ) {
    super(message)
    this.name = "InvitationError"
  }
}
