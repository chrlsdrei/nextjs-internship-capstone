import { describe, expect, it } from "vitest"

import {
  assertDevelopmentResetAllowed,
  assertIsolatedTestDatabase,
  DEVELOPMENT_RESET_CONFIRMATION,
  databasesMatch,
  formatDatabaseIdentity,
  parseDatabaseIdentity,
} from "../../scripts/lib/database-safety"

const developmentUrl = "postgresql://developer:secret@ep-development.example.com/projectflow?sslmode=require"
const testUrl = "postgresql://tester:secret@ep-test.example.com/projectflow_test?sslmode=require"
const developmentIdentity = "ep-development.example.com:5432/projectflow"

function validResetInput() {
  return {
    applicationUrl: developmentUrl,
    confirmation: DEVELOPMENT_RESET_CONFIRMATION,
    confirmedIdentity: developmentIdentity,
    configuredExpectedIdentity: developmentIdentity,
    databaseEnvironment: "development",
    execute: true,
  }
}

describe("database identities", () => {
  it("formats a connection target without credentials or query parameters", () => {
    const identity = parseDatabaseIdentity(developmentUrl)

    expect(formatDatabaseIdentity(identity)).toBe(developmentIdentity)
  })

  it("treats URLs with different credentials and options as the same target", () => {
    expect(
      databasesMatch(
        developmentUrl,
        "postgres://another-user:another-password@ep-development.example.com:5432/projectflow?sslmode=verify-full",
      ),
    ).toBe(true)
  })

  it("rejects non-PostgreSQL URLs", () => {
    expect(() => parseDatabaseIdentity("https://example.com/database")).toThrow(/postgres/i)
  })
})

describe("isolated database tests", () => {
  it("requires TEST_DATABASE_URL", () => {
    expect(() => assertIsolatedTestDatabase({ applicationUrl: developmentUrl })).toThrow(/TEST_DATABASE_URL/)
  })

  it("rejects the application database even when credentials differ", () => {
    expect(() =>
      assertIsolatedTestDatabase({
        applicationUrl: developmentUrl,
        testUrl: "postgresql://other:credentials@ep-development.example.com/projectflow",
      }),
    ).toThrow(/different database or Neon branch/)
  })

  it("accepts a distinct test database", () => {
    expect(formatDatabaseIdentity(assertIsolatedTestDatabase({ applicationUrl: developmentUrl, testUrl }))).toBe(
      "ep-test.example.com:5432/projectflow_test",
    )
  })
})

describe("development reset guard", () => {
  it("requires the execute flag", () => {
    expect(() => assertDevelopmentResetAllowed({ ...validResetInput(), execute: false })).toThrow(/--execute/)
  })

  it("requires the exact confirmation phrase", () => {
    expect(() => assertDevelopmentResetAllowed({ ...validResetInput(), confirmation: "reset" })).toThrow(/--confirm/)
  })

  it("requires a development database environment", () => {
    expect(() => assertDevelopmentResetAllowed({ ...validResetInput(), databaseEnvironment: "preview" })).toThrow(
      /DATABASE_ENVIRONMENT/,
    )
  })

  it("rejects production runtime environments", () => {
    expect(() => assertDevelopmentResetAllowed({ ...validResetInput(), nodeEnvironment: "production" })).toThrow(
      /NODE_ENV/,
    )
    expect(() => assertDevelopmentResetAllowed({ ...validResetInput(), vercelEnvironment: "production" })).toThrow(
      /VERCEL_ENV/,
    )
  })

  it("requires both configured and command-line identities to match", () => {
    expect(() =>
      assertDevelopmentResetAllowed({
        ...validResetInput(),
        confirmedIdentity: "ep-other.example.com:5432/projectflow",
      }),
    ).toThrow(/identity confirmation/)
  })

  it("rejects the configured production database", () => {
    expect(() =>
      assertDevelopmentResetAllowed({ ...validResetInput(), productionDatabaseUrl: developmentUrl }),
    ).toThrow(/PRODUCTION_DATABASE_URL/)
  })

  it("rejects a protected database identity", () => {
    expect(() =>
      assertDevelopmentResetAllowed({
        ...validResetInput(),
        protectedDatabaseIdentities: `staging.example.com:5432/projectflow,${developmentIdentity}`,
      }),
    ).toThrow(/PROTECTED_DATABASE_IDENTITIES/)
  })

  it("returns only the confirmed target identity after every guard passes", () => {
    expect(formatDatabaseIdentity(assertDevelopmentResetAllowed(validResetInput()))).toBe(developmentIdentity)
  })
})
