import { expect, test } from '@playwright/test'

test('storefront exposes the complete premium shopping shell', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('بسم الله الرحمن الرحیم')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1, name: /ارزش ماندگار/ })).toBeVisible()
  await expect(page.getByRole('link', { name: 'مجله', exact: true })).toBeVisible()
  await expect(page.locator('.category-panel')).toHaveCount(3)
  await expect(page.locator('.featured-section .product-card')).toHaveCount(4)
  await expect(page.locator('.home-journal .blog-card')).toHaveCount(3)
})

test('blog search, category filter and article table of contents work', async ({ page }) => {
  await page.goto('/blog')
  await expect(page.getByRole('heading', { level: 1, name: 'مجله مبین' })).toBeVisible()
  await expect(page.locator('.blog-card')).toHaveCount(19)

  await page.getByPlaceholder('جستجو در مقاله‌ها...').fill('راهنمای تشخیص')
  await expect(page.locator('.blog-card')).toHaveCount(1)
  await expect(page.locator('.blog-card h2')).toContainText('راهنمای تشخیص نقره اصل از بدل')

  await page.goto('/blog/how-to-identify-authentic-silver')
  await expect(page.locator('.article-header h1')).toHaveText('راهنمای تشخیص نقره اصل از بدل')
  await expect(page.locator('.article-body h2')).toHaveCount(6)
  await expect(page.locator('.article-toc a')).toHaveCount(6)
})

test('mobile layout has no horizontal overflow and menu is usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/blog')
  const sizes = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }))
  expect(sizes.scroll).toBe(sizes.client)
  await page.getByRole('button', { name: 'باز کردن منو' }).click()
  await expect(page.getByRole('link', { name: 'مجله', exact: true })).toBeVisible()
})

test('admin can reach blog management and article editor', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('نام کاربری یا ایمیل').fill(process.env.E2E_ADMIN_USER ?? 'admin')
  await page.getByLabel('رمز عبور').fill(process.env.E2E_ADMIN_PASSWORD ?? 'admin123')
  await page.getByRole('button', { name: 'ورود به حساب' }).click()
  await expect(page).toHaveURL(/\/admin$/)
  await page.getByRole('button', { name: 'مقالات' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'مدیریت مقالات' })).toBeVisible()
  await expect(page.locator('.blog-admin-table tbody tr')).toHaveCount(20)
  await page.getByRole('button', { name: 'مقاله جدید' }).first().click()
  await expect(page.getByRole('heading', { name: 'مقاله جدید' })).toBeVisible()
  await expect(page.getByLabel('متن مقاله')).toBeVisible()
})
