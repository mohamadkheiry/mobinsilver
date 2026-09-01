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
  await page.locator('.order-history > button').first().click()
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

test('shop keeps global category counts and normalizes an invalid category', async ({ page, request }) => {
  const productsResponse = await request.get('/api/products')
  expect(productsResponse.ok()).toBeTruthy()
  const products = await productsResponse.json() as Array<{ category: string }>
  const expected = new Map([
    ['همه محصولات', products.length],
    ['شمش نقره', products.filter(product => product.category === 'silver-bar').length],
    ['زیورآلات نقره', products.filter(product => product.category === 'silver-jewelry').length],
    ['شمش طلا', products.filter(product => product.category === 'gold-bar').length],
  ])

  await page.goto('/shop?category=silver-bar')
  const mainNavigation = page.getByRole('navigation', { name: 'ناوبری اصلی' })
  await expect(mainNavigation.getByRole('link', { name: 'شمش نقره', exact: true })).toHaveAttribute('aria-current', 'page')
  await expect(mainNavigation.locator('a[aria-current="page"]')).toHaveCount(1)
  for (const [label, count] of expected) {
    await expect(page.locator('.shop-categories button').filter({ hasText: label }).locator('small')).toHaveText(new Intl.NumberFormat('fa-IR').format(count))
  }

  await page.locator('.shop-categories button').filter({ hasText: 'شمش طلا' }).click()
  await expect(page).toHaveURL(/category=gold-bar/)
  await expect(page.getByRole('heading', { level: 1, name: 'شمش طلا' })).toBeVisible()
  await expect(page.locator('.product-grid .product-card')).toHaveCount(expected.get('شمش طلا') ?? 0)

  await page.goto('/shop?category=invalid-category')
  await expect(page).toHaveURL(/\/shop$/)
  await expect(page.getByRole('heading', { level: 1, name: 'همه محصولات' })).toBeVisible()
  await expect(page.locator('.product-grid .product-card')).toHaveCount(products.length)
})

test('a stale stored session never renders a protected dashboard', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('mobin-silver-token', 'expired-token')
    localStorage.setItem('mobin-silver-user', JSON.stringify({ id: 999, username: 'stale-admin', fullName: 'نشست منقضی', email: 'stale@example.com', phone: '', address: '', role: 'Admin' }))
  })
  await page.route('**/api/account/profile', async route => {
    await new Promise(resolve => setTimeout(resolve, 500))
    await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'نشست منقضی است.' }) })
  })
  await page.goto('/admin')
  await expect(page.getByRole('status')).toContainText('در حال بررسی نشست')
  await expect(page.getByRole('heading', { name: 'داشبورد مدیریت' })).toHaveCount(0)
  await expect(page).toHaveURL(/\/login$/)

  await page.evaluate(() => {
    localStorage.removeItem('mobin-silver-token')
    localStorage.setItem('mobin-silver-user', JSON.stringify({ id: 999, username: 'orphan-admin', fullName: 'کاربر بدون توکن', email: 'orphan@example.com', phone: '', address: '', role: 'Admin' }))
  })
  await page.goto('/admin')
  await expect(page.getByRole('heading', { name: 'داشبورد مدیریت' })).toHaveCount(0)
  await expect(page).toHaveURL(/\/login$/)
  expect(await page.evaluate(() => localStorage.getItem('mobin-silver-user'))).toBeNull()
})

test('cart refreshes cached price, stock and quantity from the API', async ({ page, request }) => {
  const productsResponse = await request.get('/api/products')
  const products = await productsResponse.json() as Array<Record<string, unknown> & { id: number; name: string; price: number; stock: number }>
  const product = products.find(item => item.stock > 1)!
  await page.addInitScript(current => {
    localStorage.setItem('mobin-silver-cart-v1', JSON.stringify([{ product: { ...current, price: 1, stock: 999 }, quantity: 999 }]))
  }, product)
  const refreshed = page.waitForResponse(response => response.url().endsWith('/api/products') && response.ok())
  await page.goto('/cart')
  await refreshed
  await expect(page.locator('.cart-item__info strong')).toHaveText(`${new Intl.NumberFormat('fa-IR').format(product.price)} تومان`)
  await expect(page.locator('.cart-item .quantity span')).toHaveText(new Intl.NumberFormat('fa-IR').format(product.stock))
})

test('blog distinguishes an API failure from an empty search result', async ({ page }) => {
  await page.route('**/api/blog', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ message: 'سرویس مجله موقتاً در دسترس نیست.' }) }))
  await page.goto('/blog')
  await expect(page.getByRole('alert')).toContainText('دریافت مقاله‌ها ممکن نشد')
  await expect(page.getByRole('alert')).toContainText('سرویس مجله موقتاً در دسترس نیست.')
  await expect(page.getByRole('button', { name: 'تلاش دوباره' })).toBeVisible()
})

test('order quantity bounds, revenue rules and status transitions are enforced', async ({ request }) => {
  const suffix = Date.now()
  const email = `boundary-${suffix}@example.com`
  const registration = await request.post('/api/auth/register', { data: { fullName: 'کاربر مرزی', email, password: 'StrongPass123!', phone: '09123456789' } })
  expect(registration.ok()).toBeTruthy()
  const customerToken = (await registration.json()).token as string
  const customerHeaders = { Authorization: `Bearer ${customerToken}` }
  const products = await (await request.get('/api/products')).json() as Array<{ id: number; stock: number }>
  const product = products.find(item => item.stock > 1)!
  const orderData = { customerName: 'کاربر مرزی', phone: '09123456789', address: 'تهران، خیابان تست، پلاک ۱۰', paymentMethod: 'پرداخت پس از تأیید کارشناس' }

  const huge = await request.post('/api/orders', { headers: customerHeaders, data: { ...orderData, items: [{ productId: product.id, quantity: 2_147_483_647 }] } })
  expect(huge.status()).toBe(400)
  const tooManyLines = await request.post('/api/orders', { headers: customerHeaders, data: { ...orderData, items: Array.from({ length: 101 }, () => ({ productId: product.id, quantity: 1 })) } })
  expect(tooManyLines.status()).toBe(400)
  const excessiveAggregate = await request.post('/api/orders', { headers: customerHeaders, data: { ...orderData, items: [{ productId: product.id, quantity: 60 }, { productId: product.id, quantity: 60 }] } })
  expect(excessiveAggregate.status()).toBe(400)

  const adminLogin = await request.post('/api/auth/login', { data: { username: process.env.E2E_ADMIN_USER ?? 'admin', password: process.env.E2E_ADMIN_PASSWORD ?? 'admin123' } })
  expect(adminLogin.ok()).toBeTruthy()
  const adminHeaders = { Authorization: `Bearer ${(await adminLogin.json()).token as string}` }
  const salesBefore = (await (await request.get('/api/admin/dashboard', { headers: adminHeaders })).json()).salesToday as number

  const created = await request.post('/api/orders', { headers: customerHeaders, data: { ...orderData, items: [{ productId: product.id, quantity: 1 }] } })
  expect(created.ok()).toBeTruthy()
  const createdOrder = await created.json() as { id: number }
  const salesWhilePending = (await (await request.get('/api/admin/dashboard', { headers: adminHeaders })).json()).salesToday as number
  expect(salesWhilePending).toBe(salesBefore)

  const invalidJump = await request.patch(`/api/admin/orders/${createdOrder.id}/status`, { headers: adminHeaders, data: { status: 'تحویل شده' } })
  expect(invalidJump.status()).toBe(400)
  const cancelled = await request.patch(`/api/account/orders/${createdOrder.id}/cancel`, { headers: customerHeaders })
  expect(cancelled.ok()).toBeTruthy()
  const salesAfterCancel = (await (await request.get('/api/admin/dashboard', { headers: adminHeaders })).json()).salesToday as number
  expect(salesAfterCancel).toBe(salesBefore)
})

test('admin content APIs reject unsafe external asset paths', async ({ request }) => {
  const login = await request.post('/api/auth/login', { data: { username: process.env.E2E_ADMIN_USER ?? 'admin', password: process.env.E2E_ADMIN_PASSWORD ?? 'admin123' } })
  const headers = { Authorization: `Bearer ${(await login.json()).token as string}` }
  const unsafeProduct = await request.post('/api/admin/products', { headers, data: { name: 'محصول ناامن', slug: `unsafe-${Date.now()}`, category: 'silver-bar', description: 'توضیحات کافی برای محصول آزمایشی', price: 1000, imageUrl: '//tracking.example/image.png', stock: 1, purity: '۹۹۹', weight: '۱ گرم', featured: false } })
  expect(unsafeProduct.status()).toBe(400)
  const ambiguousAsset = await request.post('/api/admin/products', { headers, data: { name: 'محصول ناامن', slug: `unsafe-path-${Date.now()}`, category: 'silver-bar', description: 'توضیحات کافی برای محصول آزمایشی', price: 1000, imageUrl: '/assets//tracking.png', stock: 1, purity: '۹۹۹', weight: '۱ گرم', featured: false } })
  expect(ambiguousAsset.status()).toBe(400)
  const unsafePost = await request.post('/api/admin/blog', { headers, data: { title: 'مقاله آزمایشی ناامن', slug: `unsafe-post-${Date.now()}`, excerpt: 'خلاصه‌ای معتبر و طولانی برای مقاله آزمایشی ناامن', content: '## عنوان\n\n'.padEnd(100, 'متن آزمایشی '), coverImageUrl: '//tracking.example/image.png', category: 'دسته نامعتبر', author: 'تست', tags: '', readingMinutes: 5, featured: false, isPublished: false, publishedAt: null } })
  expect(unsafePost.status()).toBe(400)
})
