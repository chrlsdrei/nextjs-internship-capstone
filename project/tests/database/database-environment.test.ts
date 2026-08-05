import { describe, expect, it } from "vitest"

describe("database integration environment", () => {
  it("uses a verified isolated database identity", () => {
    expect(process.env.VERIFIED_TEST_DATABASE_IDENTITY).toMatch(/^[^/]+:\d+\/.+$/)
  })
})
