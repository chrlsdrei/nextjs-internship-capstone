import { setupClerkTestingToken } from "@clerk/testing/playwright"
import { expect, test } from "@playwright/test"

test.describe("public and signed-out flows", () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
  })

  test("homepage navigation reaches features and authentication entry points", async ({ page }) => {
    await page.goto("/")

    const navigation = page.getByRole("navigation", { name: "Homepage navigation" })
    await expect(navigation.getByRole("link", { name: "Features" })).toHaveAttribute("href", "#features")
    await expect(navigation.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/sign-in")
    await expect(navigation.getByRole("link", { name: "Get Started" })).toHaveAttribute("href", "/sign-up")

    await navigation.getByRole("link", { name: "Features" }).click()
    await expect(page).toHaveURL(/#features$/)
    await expect(page.locator("#features")).toBeInViewport()
  })

  test("Clerk sign-in and sign-up pages render", async ({ page }) => {
    await page.goto("/sign-in")
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible()
    await expect(page.locator(".cl-signIn-root")).toBeAttached()

    await page.goto("/sign-up")
    await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible()
    await expect(page.locator(".cl-signUp-root")).toBeAttached()
  })

  test("signed-out users are redirected away from protected routes", async ({ page }) => {
    await page.goto("/dashboard")

    await expect(page).toHaveURL(/\/sign-in(?:[/?].*)?$/)
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible()
  })
})
