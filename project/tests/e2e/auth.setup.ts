import { mkdir } from "node:fs/promises"
import path from "node:path"
import { clerk } from "@clerk/testing/playwright"
import { expect, test as setup } from "@playwright/test"

setup.describe.configure({ mode: "serial" })

const authDirectory = path.resolve("playwright/.clerk")
const authFile = path.join(authDirectory, "user.json")

setup("authenticate synchronized QuestBoard user", async ({ page }) => {
  const emailAddress = process.env.E2E_CLERK_USER_EMAIL
  if (!emailAddress) {
    throw new Error(
      "E2E_CLERK_USER_EMAIL is required. Use an existing Clerk development user that has already synchronized to Neon.",
    )
  }

  await mkdir(authDirectory, { recursive: true })
  await page.goto("/")
  await clerk.signIn({ page, emailAddress })
  await page.goto("/dashboard")

  await expect(page).toHaveURL(/\/dashboard(?:\?.*)?$/)
  await expect(page.getByRole("link", { name: "Dashboard", exact: true })).toBeVisible()
  await page.context().storageState({ path: authFile })
})
