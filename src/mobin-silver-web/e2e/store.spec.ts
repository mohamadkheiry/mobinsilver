import { expect, test } from '@playwright/test'

function captureRuntimeErrors(page: import('@playwright/test').Page) {
  const errors: string[] = []
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', error => errors.push(error.message))
  return errors
}

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

test('newsletter subscription is persisted through the public API', async ({ page }) => {
  const errors = captureRuntimeErrors(page)
  await page.goto('/')
  await page.locator('#newsletter-email').fill(`qa-${Date.now()}@example.com`)
  await page.getByRole('button', { name: 'عضویت' }).click()
  await expect(page.getByRole('status')).toContainText('عضویت شما در خبرنامه ثبت شد')
  expect(errors).toEqual([])
})

test('new customer can register, place an approval request and cancel it', async ({ page, request }) => {
  const errors = captureRuntimeErrors(page)
  const email = `customer-${Date.now()}@example.com`
  const stockBefore = await (await request.get('/api/products/silver-bar-1oz')).json()
  await page.goto('/product/silver-bar-1oz')
  await page.getByRole('button', { name: /افزودن به سبد خرید/ }).click()
  await page.goto('/checkout')
  await expect(page).toHaveURL(/\/login$/)
  await page.getByRole('button', { name: 'ثبت‌نام' }).click()
  await page.getByLabel('نام و نام خانوادگی').fill('کاربر آزمون مبین')
  await page.getByLabel('شماره موبایل').fill('09123456789')
  await page.getByLabel('ایمیل').fill(email)
  await page.getByLabel('رمز عبور').fill('StrongPass123!')
  await page.getByRole('button', { name: 'ایجاد حساب' }).click()
  await expect(page).toHaveURL(/\/checkout$/)
  await page.getByLabel('نشانی کامل').fill('تهران، خیابان ولیعصر، کوچه آزمون، پلاک ۱۲')
  await page.getByRole('button', { name: 'ثبت سفارش و درخواست تأیید' }).click()
  await expect(page.getByRole('heading', { name: 'سفارش شما ثبت شد' })).toBeVisible()
  await page.getByRole('link', { name: 'مشاهده داشبورد' }).click()
  await page.getByRole('button', { name: 'سفارش‌های من' }).click()
  page.once('dialog', dialog => dialog.accept())
  await page.getByRole('button', { name: 'لغو سفارش' }).click()
  await expect(page.getByText('لغو شده').first()).toBeVisible()
  const stockAfter = await (await request.get('/api/products/silver-bar-1oz')).json()
  expect(stockAfter.stock).toBe(stockBefore.stock)
  expect(errors).toEqual([])
})

test('admin product edit, persistent settings and CSV report controls work', async ({ page }) => {
  const errors = captureRuntimeErrors(page)
  await page.goto('/login')
  await page.getByLabel('نام کاربری یا ایمیل').fill(process.env.E2E_ADMIN_USER ?? 'admin')
  await page.getByLabel('رمز عبور').fill(process.env.E2E_ADMIN_PASSWORD ?? 'admin123')
  await page.getByRole('button', { name: 'ورود به حساب' }).click()
  await page.getByRole('button', { name: 'محصولات' }).click()
  await page.getByRole('button', { name: /ویرایش شمش/ }).first().click()
  await expect(page.getByRole('heading', { name: 'ویرایش محصول' })).toBeVisible()
  await page.getByRole('button', { name: 'بستن' }).click()
  await page.getByRole('button', { name: 'تنظیمات' }).click()
  await page.getByRole('button', { name: 'ذخیره تنظیمات' }).click()
  await expect(page.getByRole('status')).toContainText('تنظیمات فروشگاه ذخیره شد')
  await page.getByRole('button', { name: 'گزارش‌ها' }).click()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'خروجی CSV' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/^mobinsilver-orders-.*\.csv$/)
  expect(errors).toEqual([])
})

test('mobile storefront and account drawers remain within the viewport', async ({ page }) => {
  const errors = captureRuntimeErrors(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.getByRole('button', { name: 'باز کردن منو' }).click()
  await expect(page.getByLabel('ناوبری اصلی').getByRole('link', { name: 'شمش طلا', exact: true })).toBeVisible()
  await page.keyboard.press('Escape')
  const sizes = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }))
  expect(sizes.scroll).toBe(sizes.client)
  expect(errors).toEqual([])
})

test('API rejects weak registration and exposes safe public settings', async ({ request }) => {
  const settings = await request.get('/api/store/settings')
  expect(settings.ok()).toBeTruthy()
  const body = await settings.json()
  expect(body.storeName).toBe('مبین سیلور')
  expect(body).not.toHaveProperty('id')
  const weak = await request.post('/api/auth/register', { data: { fullName: 'کاربر تست', email: `weak-${Date.now()}@example.com`, password: '123', phone: '09123456789' } })
  expect(weak.status()).toBe(400)
  const malformedLogin = await request.post('/api/auth/login', { data: { username: null, password: null } })
  expect(malformedLogin.status()).toBe(400)
  const malformedNewsletter = await request.post('/api/newsletter', { data: { email: null } })
  expect(malformedNewsletter.status()).toBe(400)
})

test('API throttles repeated failed login attempts without locking other accounts', async ({ request }) => {
  const username = `throttle-${Date.now()}@example.com`
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const failure = await request.post('/api/auth/login', { data: { username, password: 'DefinitelyWrong123!' } })
    expect(failure.status()).toBe(401)
  }
  const throttled = await request.post('/api/auth/login', { data: { username, password: 'DefinitelyWrong123!' } })
  expect(throttled.status()).toBe(429)

  const unrelated = await request.post('/api/auth/login', { data: { username: `${username}-other`, password: 'DefinitelyWrong123!' } })
  expect(unrelated.status()).toBe(401)
})
