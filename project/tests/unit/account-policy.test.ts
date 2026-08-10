import { describe, expect, it } from "vitest"

import { AccountAccessError, assertAccountCanAccessApplication } from "../../features/auth/account.policy"

describe("application account access", () => {
  it("allows active accounts", () => {
    expect(() => assertAccountCanAccessApplication("active")).not.toThrow()
  })

  it.each(["suspended", "deleted"] as const)("denies %s accounts", (status) => {
    expect(() => assertAccountCanAccessApplication(status)).toThrow(AccountAccessError)
  })
})
