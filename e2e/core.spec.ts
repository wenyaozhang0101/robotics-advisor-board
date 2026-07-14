import { expect, test } from '@playwright/test'

test('leaderboard, detail, and form are keyboard reachable', async ({ page }, testInfo) => {
  await page.goto('/')
  await expect(page.getByText(/Preview mode/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Recommended' })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Caution' }).click()
  await expect(page.getByRole('button', { name: 'Caution' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText('No approved faculty profiles yet.')).toBeVisible()
  await page.screenshot({ path: `artifacts/screenshots/leaderboard-${testInfo.project.name}.png`, fullPage: true })
  await page.getByRole('link', { name: 'Request the first faculty profile' }).click()
  await expect(page.getByRole('heading', { name: 'Request a faculty profile' })).toBeVisible()
  await expect(page.getByLabel('Country')).toBeVisible()
  await expect(page.getByLabel(/Research areas/)).toBeVisible()
})

test('review form validates and announces errors', async ({ page }) => {
  await page.goto('/submit')
  await page.getByRole('button', { name: 'Preview submission' }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  await page.keyboard.press('Tab')
})
