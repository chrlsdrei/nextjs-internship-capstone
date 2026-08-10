const POSTGRES_PROTOCOLS = new Set(["postgres:", "postgresql:"])

export const DEVELOPMENT_RESET_CONFIRMATION = "RESET_PROJECTFLOW_DEVELOPMENT_DATA"

export type DatabaseIdentity = {
  database: string
  hostname: string
  port: string
}

type IsolatedTestDatabaseInput = {
  applicationUrl?: string
  testUrl?: string
}

type DevelopmentResetInput = {
  applicationUrl?: string
  confirmation?: string
  confirmedIdentity?: string
  configuredExpectedIdentity?: string
  databaseEnvironment?: string
  execute: boolean
  nodeEnvironment?: string
  productionDatabaseUrl?: string
  protectedDatabaseIdentities?: string
  vercelEnvironment?: string
}

function requiredValue(value: string | undefined, name: string) {
  const normalized = value?.trim()
  if (!normalized) {
    throw new Error(`${name} is required`)
  }
  return normalized
}

export function parseDatabaseIdentity(value: string, name = "database URL"): DatabaseIdentity {
  let url: URL

  try {
    url = new URL(requiredValue(value, name))
  } catch (error) {
    if (error instanceof Error && error.message === `${name} is required`) {
      throw error
    }
    throw new Error(`${name} must be a valid PostgreSQL connection URL`)
  }

  if (!POSTGRES_PROTOCOLS.has(url.protocol)) {
    throw new Error(`${name} must use the postgres or postgresql protocol`)
  }

  const hostname = url.hostname.toLowerCase().replace(/\.$/, "")
  const database = decodeURIComponent(url.pathname.replace(/^\/+/, ""))

  if (!hostname || !database) {
    throw new Error(`${name} must include a hostname and database name`)
  }

  return {
    database,
    hostname,
    port: url.port || "5432",
  }
}

export function formatDatabaseIdentity(identity: DatabaseIdentity) {
  return `${identity.hostname}:${identity.port}/${identity.database}`
}

export function databasesMatch(firstUrl: string, secondUrl: string) {
  return (
    formatDatabaseIdentity(parseDatabaseIdentity(firstUrl, "first database URL")) ===
    formatDatabaseIdentity(parseDatabaseIdentity(secondUrl, "second database URL"))
  )
}

export function assertIsolatedTestDatabase({ applicationUrl, testUrl }: IsolatedTestDatabaseInput) {
  const testIdentity = parseDatabaseIdentity(requiredValue(testUrl, "TEST_DATABASE_URL"), "TEST_DATABASE_URL")

  if (applicationUrl && databasesMatch(applicationUrl, testUrl as string)) {
    throw new Error("TEST_DATABASE_URL must target a different database or Neon branch than DATABASE_URL")
  }

  return testIdentity
}

function parseProtectedIdentities(value: string | undefined) {
  return new Set(
    (value ?? "")
      .split(",")
      .map((identity) => identity.trim().toLowerCase())
      .filter(Boolean),
  )
}

export function assertDevelopmentResetAllowed(input: DevelopmentResetInput) {
  if (!input.execute) {
    throw new Error("Refusing reset without the --execute flag")
  }

  if (input.confirmation !== DEVELOPMENT_RESET_CONFIRMATION) {
    throw new Error(`Refusing reset without --confirm ${DEVELOPMENT_RESET_CONFIRMATION}`)
  }

  if (input.databaseEnvironment?.trim().toLowerCase() !== "development") {
    throw new Error('DATABASE_ENVIRONMENT must be set to "development"')
  }

  if (input.nodeEnvironment?.trim().toLowerCase() === "production") {
    throw new Error("Refusing reset while NODE_ENV is production")
  }

  if (input.vercelEnvironment?.trim().toLowerCase() === "production") {
    throw new Error("Refusing reset while VERCEL_ENV is production")
  }

  const applicationUrl = requiredValue(input.applicationUrl, "DATABASE_URL")
  const targetIdentity = formatDatabaseIdentity(parseDatabaseIdentity(applicationUrl, "DATABASE_URL"))
  const configuredIdentity = requiredValue(
    input.configuredExpectedIdentity,
    "DEVELOPMENT_RESET_DATABASE_IDENTITY",
  ).toLowerCase()
  const confirmedIdentity = requiredValue(input.confirmedIdentity, "--database-identity").toLowerCase()

  if (targetIdentity.toLowerCase() !== configuredIdentity || targetIdentity.toLowerCase() !== confirmedIdentity) {
    throw new Error(`Database identity confirmation does not match the reset target (${targetIdentity})`)
  }

  if (input.productionDatabaseUrl && databasesMatch(applicationUrl, input.productionDatabaseUrl)) {
    throw new Error("Refusing reset because DATABASE_URL matches PRODUCTION_DATABASE_URL")
  }

  const protectedIdentities = parseProtectedIdentities(input.protectedDatabaseIdentities)
  if (protectedIdentities.has(targetIdentity.toLowerCase())) {
    throw new Error(`Refusing reset because ${targetIdentity} is listed in PROTECTED_DATABASE_IDENTITIES`)
  }

  return parseDatabaseIdentity(applicationUrl, "DATABASE_URL")
}
