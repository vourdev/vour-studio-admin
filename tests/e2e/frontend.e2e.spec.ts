import { test, expect } from '@playwright/test'

test.describe('Root redirect', () => {
  test('root redirects to the admin login page', async ({ page }) => {
    await page.goto('http://localhost:3000')

    // next.config.ts redirects / -> /admin, and Payload sends unauthenticated
    // visitors from /admin to /admin/login.
    await expect(page).toHaveURL(/\/admin\/login/)
  })
})
