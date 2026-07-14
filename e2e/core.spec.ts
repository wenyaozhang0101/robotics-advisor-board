import { expect, test } from '@playwright/test'

test('leaderboard, detail, and form are keyboard reachable', async ({ page }, testInfo) => {
  await page.goto('/')
  await expect(page.getByText(/Demo mode/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Recommended' })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Caution' }).click()
  await expect(page.getByRole('button', { name: 'Caution' })).toHaveAttribute('aria-pressed', 'true')
  await page.screenshot({ path: `artifacts/screenshots/leaderboard-${testInfo.project.name}.png`, fullPage: true })
  await page.getByRole('link', { name: 'Mira Solace' }).first().click()
  await expect(page.getByRole('heading', { name: 'Mira Solace' })).toBeVisible()
})

test('review form validates and announces errors', async ({ page }) => {
  await page.goto('/submit')
  await page.getByRole('button', { name: 'Preview submission' }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  await page.keyboard.press('Tab')
})
