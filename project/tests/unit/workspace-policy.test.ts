import { describe, expect, it } from "vitest"

import {
  canChangeWorkspaceMemberRole,
  canCreateProjectInWorkspace,
  canRemoveWorkspaceMember,
  canTransferWorkspaceOwnership,
  resolveWorkspaceRole,
  workspaceCapabilities,
} from "../../features/workspaces/workspace.policy"

describe("workspace project creation", () => {
  it("allows active owners and administrators to create projects", () => {
    expect(canCreateProjectInWorkspace({ role: "owner", membersCanCreateProjects: false, status: "active" })).toBe(true)
    expect(canCreateProjectInWorkspace({ role: "admin", membersCanCreateProjects: false, status: "active" })).toBe(true)
  })

  it("shows regular members only when the workspace rule allows creation", () => {
    expect(canCreateProjectInWorkspace({ role: "member", membersCanCreateProjects: false, status: "active" })).toBe(
      false,
    )
    expect(canCreateProjectInWorkspace({ role: "member", membersCanCreateProjects: true, status: "active" })).toBe(true)
    expect(canCreateProjectInWorkspace({ role: "owner", membersCanCreateProjects: true, status: "suspended" })).toBe(
      false,
    )
  })
})

describe("workspace role resolution", () => {
  it("derives ownership from the workspace owner pointer", () => {
    expect(resolveWorkspaceRole("member-owner", { id: "member-owner", role: "admin", removedAt: null })).toBe("owner")
    expect(resolveWorkspaceRole("member-owner", { id: "member-admin", role: "admin", removedAt: null })).toBe("admin")
    expect(resolveWorkspaceRole("member-owner", { id: "member-user", role: "member", removedAt: null })).toBe("member")
    expect(
      resolveWorkspaceRole("member-owner", { id: "member-user", role: "member", removedAt: new Date() }),
    ).toBeNull()
  })

  it("grants workspace administration capabilities only to the owner", () => {
    expect(workspaceCapabilities("owner")).toEqual({
      canManageDetails: true,
      canManageSettings: true,
      canManageMemberRoles: true,
      canRemoveMembers: true,
      canTransferOwnership: true,
    })
    expect(workspaceCapabilities("admin")).toEqual({
      canManageDetails: false,
      canManageSettings: false,
      canManageMemberRoles: false,
      canRemoveMembers: true,
      canTransferOwnership: false,
    })
  })
})

describe("workspace member permission matrix", () => {
  it("allows only the owner to change non-owner roles", () => {
    expect(canChangeWorkspaceMemberRole("owner", "admin")).toBe(true)
    expect(canChangeWorkspaceMemberRole("owner", "member")).toBe(true)
    expect(canChangeWorkspaceMemberRole("owner", "owner")).toBe(false)
    expect(canChangeWorkspaceMemberRole("admin", "member")).toBe(false)
    expect(canChangeWorkspaceMemberRole("member", "member")).toBe(false)
  })

  it("allows only the owner to transfer workspace ownership", () => {
    expect(canTransferWorkspaceOwnership("owner")).toBe(true)
    expect(canTransferWorkspaceOwnership("admin")).toBe(false)
    expect(canTransferWorkspaceOwnership("member")).toBe(false)
  })

  it("prevents admins from removing owners or other admins", () => {
    expect(canRemoveWorkspaceMember("admin", "owner", false)).toBe(false)
    expect(canRemoveWorkspaceMember("admin", "admin", false)).toBe(false)
    expect(canRemoveWorkspaceMember("admin", "member", false)).toBe(true)
  })

  it("allows non-owners to leave while requiring transfer before an owner leaves", () => {
    expect(canRemoveWorkspaceMember("member", "member", true)).toBe(true)
    expect(canRemoveWorkspaceMember("admin", "admin", true)).toBe(true)
    expect(canRemoveWorkspaceMember("owner", "owner", true)).toBe(false)
  })
})
