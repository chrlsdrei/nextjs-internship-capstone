import { describe, expect, it } from "vitest"

import type { ProjectSummaryDto } from "../../features/projects/project.types"
import type { WorkspaceSummaryDto } from "../../features/workspaces/workspace.types"
import { groupProjectsByWorkspace } from "../../features/workspaces/workspace-projects"

function workspace(id: string, name: string): WorkspaceSummaryDto {
  return {
    id,
    name,
    description: null,
    status: "active",
    role: "member",
    memberCount: 1,
    membersCanCreateProjects: false,
    createdAt: "2026-08-06T00:00:00.000Z",
    updatedAt: "2026-08-06T00:00:00.000Z",
  }
}

function project(id: string, workspaceId: string | null): ProjectSummaryDto {
  return {
    id,
    workspaceId,
    name: `Project ${id}`,
    description: null,
    dueDate: null,
    updatedAt: "2026-08-06T00:00:00.000Z",
    role: "member",
    memberCount: 1,
    taskCount: 0,
  }
}

describe("workspace project grouping", () => {
  it("groups projects under accessible workspaces", () => {
    const groups = groupProjectsByWorkspace(
      [workspace("workspace-a", "Workspace A"), workspace("workspace-b", "Workspace B")],
      [project("a", "workspace-a"), project("b", "workspace-b")],
    )

    expect(groups.map((group) => [group.name, group.projects.map((item) => item.id)])).toEqual([
      ["Workspace A", ["a"]],
      ["Workspace B", ["b"]],
    ])
  })

  it("keeps legacy and inaccessible workspace references in an unassigned group", () => {
    const groups = groupProjectsByWorkspace(
      [workspace("workspace-a", "Workspace A")],
      [project("legacy", null), project("unknown", "workspace-not-accessible")],
    )

    expect(groups).toHaveLength(1)
    expect(groups[0]?.key).toBe("unassigned")
    expect(groups[0]?.projects.map((item) => item.id)).toEqual(["legacy", "unknown"])
  })

  it("can retain empty accessible workspace groups for an explicit filter", () => {
    const groups = groupProjectsByWorkspace([workspace("workspace-a", "Workspace A")], [], true)

    expect(groups).toHaveLength(1)
    expect(groups[0]?.projects).toEqual([])
  })
})
