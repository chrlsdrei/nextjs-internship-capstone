import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getCurrentDatabaseUser: vi.fn(),
  paymongoLivemode: vi.fn(),
  findUserSubscriptionTier: vi.fn(),
  findWorkspaceSubscriptionTier: vi.fn(),
  listActiveBillingPlans: vi.fn(),
  countWorkspaceCapacity: vi.fn(),
  listActiveOwnedWorkspaces: vi.fn(),
  findLatestUserCheckoutPurchase: vi.fn(),
  findLatestWorkspaceCheckoutPurchase: vi.fn(),
}))

vi.mock("@/features/auth/server/session.service", () => ({
  getCurrentDatabaseUser: mocks.getCurrentDatabaseUser,
}))
vi.mock("@/features/billing/server/paymongo.gateway", () => ({
  paymongoLivemode: mocks.paymongoLivemode,
}))
vi.mock("@/features/billing/server/billing.repository", () => ({
  findUserSubscriptionTier: mocks.findUserSubscriptionTier,
  findWorkspaceSubscriptionTier: mocks.findWorkspaceSubscriptionTier,
  listActiveBillingPlans: mocks.listActiveBillingPlans,
  countWorkspaceCapacity: mocks.countWorkspaceCapacity,
}))
vi.mock("@/features/billing/server/subscription-page.repository", () => ({
  listActiveOwnedWorkspaces: mocks.listActiveOwnedWorkspaces,
  findLatestUserCheckoutPurchase: mocks.findLatestUserCheckoutPurchase,
  findLatestWorkspaceCheckoutPurchase: mocks.findLatestWorkspaceCheckoutPurchase,
}))

import { getSubscriptionPageData } from "@/features/billing/server/subscription-page.service"

const userFreePlan = {
  id: "00000000-0000-4000-8000-000000000001",
  code: "user-free",
  name: "Free",
  target: "user",
  currency: "PHP",
  amount: 0,
  interval: "monthly",
  maxProjects: null,
  maxMembers: null,
  version: 1,
}
const userProPlan = {
  ...userFreePlan,
  id: "00000000-0000-4000-8000-000000000002",
  code: "user-pro",
  name: "Pro",
  amount: 29_900,
}
const workspaceFreePlan = {
  ...userFreePlan,
  id: "00000000-0000-4000-8000-000000000003",
  code: "workspace-free",
  target: "workspace",
  maxProjects: 2,
  maxMembers: 3,
}
const workspaceProPlan = {
  ...workspaceFreePlan,
  id: "00000000-0000-4000-8000-000000000004",
  code: "workspace-pro",
  name: "Pro",
  amount: 39_900,
  maxProjects: 20,
  maxMembers: 30,
}

describe("subscription page service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getCurrentDatabaseUser.mockResolvedValue({ id: "user-1" })
    mocks.paymongoLivemode.mockReturnValue(false)
    mocks.findUserSubscriptionTier.mockResolvedValue({
      tier: "pro",
      endsAt: new Date("2026-09-18T00:00:00.000Z"),
    })
    mocks.listActiveBillingPlans.mockImplementation((target: string, livemode: boolean) => {
      expect(livemode).toBe(false)
      return target === "user" ? [userFreePlan, userProPlan] : [workspaceFreePlan, workspaceProPlan]
    })
    mocks.listActiveOwnedWorkspaces.mockResolvedValue([
      { id: "workspace-free", name: "Free Workspace" },
      { id: "workspace-pro", name: "Pro Workspace" },
    ])
    mocks.findWorkspaceSubscriptionTier.mockImplementation((id: string) => ({
      tier: id === "workspace-pro" ? "pro" : "free",
      endsAt: id === "workspace-pro" ? new Date("2026-09-18T00:00:00.000Z") : null,
    }))
    mocks.countWorkspaceCapacity.mockImplementation((id: string) =>
      id === "workspace-pro" ? { projectCount: 8, memberCount: 10 } : { projectCount: 3, memberCount: 2 },
    )
    mocks.findLatestUserCheckoutPurchase.mockResolvedValue(null)
    mocks.findLatestWorkspaceCheckoutPurchase.mockResolvedValue(null)
  })

  it("returns environment-matched catalogs and active owned workspace access data", async () => {
    const result = await getSubscriptionPageData()

    expect(result.user).toEqual({
      tier: "pro",
      periodEndsAt: "2026-09-18T00:00:00.000Z",
      latestPurchase: null,
    })
    expect(result.catalog.user).toMatchObject({
      free: { code: "user-free" },
      pro: { code: "user-pro" },
    })
    expect(result.catalog.workspace).toMatchObject({
      free: { code: "workspace-free" },
      pro: { code: "workspace-pro" },
    })
    expect(result.ownedWorkspaces).toEqual([
      expect.objectContaining({
        id: "workspace-free",
        tier: "free",
        capacity: { maxProjects: 2, maxMembers: 3 },
        usage: { projectCount: 3, memberCount: 2 },
        readOnly: true,
      }),
      expect.objectContaining({
        id: "workspace-pro",
        tier: "pro",
        capacity: { maxProjects: 20, maxMembers: 30 },
        usage: { projectCount: 8, memberCount: 10 },
        readOnly: false,
      }),
    ])
    expect(mocks.listActiveOwnedWorkspaces).toHaveBeenCalledWith("user-1")
    expect(mocks.listActiveBillingPlans).toHaveBeenCalledWith("user", false)
    expect(mocks.listActiveBillingPlans).toHaveBeenCalledWith("workspace", false)
  })
})
