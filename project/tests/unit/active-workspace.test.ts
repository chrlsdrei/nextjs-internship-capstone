import { describe, expect, it } from "vitest"

import { resolveActiveWorkspace } from "@/features/workspaces/active-workspace"

const workspaces = [
  { id: "workspace-one", name: "One" },
  { id: "workspace-two", name: "Two" },
]

describe("active workspace selection", () => {
  it("returns the requested accessible workspace", () => {
    expect(resolveActiveWorkspace(workspaces, "workspace-two")).toEqual(workspaces[1])
  })

  it("falls back safely when the cookie references an unavailable workspace", () => {
    expect(resolveActiveWorkspace(workspaces, "removed-workspace")).toEqual(workspaces[0])
  })

  it("returns null when the user has no workspaces", () => {
    expect(resolveActiveWorkspace([], "removed-workspace")).toBeNull()
  })
})
