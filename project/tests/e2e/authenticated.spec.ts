import { clerk } from "@clerk/testing/playwright"
import { expect, test } from "@playwright/test"

test.describe("authenticated QuestBoard flows", () => {
  test("authenticated session opens and survives a dashboard reload", async ({ page }) => {
    await page.goto("/dashboard")

    await expect(page).toHaveURL(/\/dashboard(?:\?.*)?$/)
    await expect(page.getByRole("link", { name: "Dashboard", exact: true })).toBeVisible()
    await page.reload()
    await expect(page).toHaveURL(/\/dashboard(?:\?.*)?$/)
  })

  test("workspace navigation reaches projects and team", async ({ page }) => {
    await page.goto("/dashboard")

    await page.getByRole("link", { name: "Projects", exact: true }).click()
    await expect(page).toHaveURL(/\/projects(?:\?.*)?$/)
    await expect(page.getByRole("heading", { name: "Projects", exact: true })).toBeVisible()

    await page.getByRole("link", { name: "Team", exact: true }).click()
    await expect(page).toHaveURL(/\/team(?:\?.*)?$/)
    await expect(page.getByRole("heading", { name: "Team", exact: true })).toBeVisible()
  })

  test("signing out revokes access to protected routes", async ({ page }) => {
    await page.goto("/")
    await clerk.signOut({ page })
    await page.goto("/dashboard")

    await expect(page).toHaveURL(/\/sign-in(?:[/?].*)?$/)
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible()
  })
})
