export type BillingErrorCode =
  | "SUBSCRIPTION_REQUIRED"
  | "WORKSPACE_SUBSCRIPTION_REQUIRED"
  | "WORKSPACE_READ_ONLY"
  | "PROJECT_LIMIT_REACHED"
  | "MEMBER_LIMIT_REACHED"
  | "BILLING_FORBIDDEN"
  | "BILLING_PROVIDER_ERROR"
  | "CHECKOUT_ALREADY_COMPLETED"
  | "CHECKOUT_IDEMPOTENCY_CONFLICT"
  | "CHECKOUT_UNAVAILABLE"

export class BillingError extends Error {
  constructor(
    message: string,
    public readonly code: BillingErrorCode,
    public readonly status = 403,
  ) {
    super(message)
    this.name = "BillingError"
  }
}
