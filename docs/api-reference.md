# مرجع API مبین سیلور

Base path همه endpointها برابر `/api` است. payloadها JSON و نام فیلدها camelCase هستند. endpointهای محافظت‌شده header زیر را نیاز دارند:

```http
Authorization: Bearer <jwt>
Content-Type: application/json
```

## 1. خلاصه endpointها

| Method | Path | دسترسی | کاربرد |
|---|---|---|---|
| GET | `/api/health` | عمومی | سلامت سرویس |
| GET | `/api/store/settings` | عمومی | تنظیمات قابل‌نمایش فروشگاه |
| POST | `/api/newsletter` | عمومی | عضویت در خبرنامه |
| GET | `/api/products` | عمومی | فهرست و فیلتر محصولات |
| GET | `/api/products/{slug}` | عمومی | جزئیات محصول |
| GET | `/api/blog` | عمومی | فهرست مقاله‌های منتشرشده |
| GET | `/api/blog/{slug}` | عمومی | جزئیات مقاله منتشرشده |
| POST | `/api/auth/login` | عمومی | ورود |
| POST | `/api/auth/register` | عمومی | ثبت‌نام مشتری |
| GET | `/api/account/profile` | احرازشده | پروفایل جاری |
| PUT | `/api/account/profile` | احرازشده | ویرایش پروفایل |
| PUT | `/api/account/password` | احرازشده | تغییر رمز عبور |
| GET | `/api/account/orders` | احرازشده | سفارش‌های کاربر جاری |
| PATCH | `/api/account/orders/{id}/cancel` | احرازشده | لغو سفارشِ در انتظار کاربر جاری |
| POST | `/api/orders` | احرازشده | ثبت سفارش |
| GET | `/api/admin/dashboard` | Admin | آمار داشبورد |
| GET | `/api/admin/orders` | Admin | تمام سفارش‌ها |
| PATCH | `/api/admin/orders/{id}/status` | Admin | تغییر وضعیت سفارش |
| GET | `/api/admin/customers` | Admin | فهرست مشتریان |
| POST | `/api/admin/products` | Admin | ایجاد محصول |
| PUT | `/api/admin/products/{id}` | Admin | ویرایش محصول |
| DELETE | `/api/admin/products/{id}` | Admin | حذف محصول |
| GET | `/api/admin/settings` | Admin | دریافت تنظیمات کامل فروشگاه |
| PUT | `/api/admin/settings` | Admin | ذخیره تنظیمات فروشگاه |
| GET | `/api/admin/blog` | Admin | تمام مقاله‌ها و پیش‌نویس‌ها |
| POST | `/api/admin/blog` | Admin | ایجاد مقاله |
| PUT | `/api/admin/blog/{id}` | Admin | ویرایش مقاله |
| DELETE | `/api/admin/blog/{id}` | Admin | حذف مقاله |

## 2. سلامت

### `GET /api/health`

پاسخ `200`:

```json
{
  "status": "healthy",
  "service": "MobinSilver.Api"
}
```

## 3. محصولات

### `GET /api/products`

پارامترهای query اختیاری:

| نام | نوع | توضیح |
|---|---|---|
| `category` | string | `silver-bar`، `silver-jewelry`، `gold-bar` یا `all` |
| `search` | string | جست‌وجو در نام و توضیح |
| `featured` | boolean | محدودسازی محصولات ویژه |

نمونه:

```http
GET /api/products?category=silver-bar&featured=true
```

### `GET /api/products/{slug}`

`slug` یا شناسه عددی را می‌پذیرد. در نبود محصول `404` برمی‌گرداند.

ساختار محصول:

```json
{
  "id": 1,
  "name": "شمش نقره یک اونسی",
  "slug": "silver-bar-1oz",
  "category": "silver-bar",
  "description": "...",
  "price": 3680000,
  "imageUrl": "/assets/silver-bar.png",
  "stock": 24,
  "purity": "۹۹۹",
  "weight": "۱ اونس",
  "featured": true,
  "createdAt": "2026-08-27T00:00:00Z"
}
```

## تنظیمات عمومی و خبرنامه

### `GET /api/store/settings`

فقط فیلدهای عمومی `storeName`، `supportPhone`، `supportEmail`، `address`، `announcement` و `ordersEnabled` را برمی‌گرداند؛ شناسه داخلی و زمان ویرایش افشا نمی‌شوند.

### `POST /api/newsletter`

```json
{ "email": "customer@example.com" }
```

ایمیل نامعتبر `400` است. ثبت دوباره همان ایمیل idempotent است و پاسخ موفق می‌گیرد، اما رکورد تکراری ایجاد نمی‌شود.

## 4. مجله

### `GET /api/blog`

فقط مقاله‌هایی را برمی‌گرداند که منتشر شده و زمان `publishedAt` آن‌ها گذشته باشد. پارامترهای اختیاری:

| نام | کاربرد |
|---|---|
| `category` | تطبیق دقیق دسته یا `all` |
| `search` | جستجو در عنوان، خلاصه و برچسب |
| `featured` | محدودسازی مقاله ویژه |

### `GET /api/blog/{slug}`

مقاله منتشرشده را با slug یا شناسه برمی‌گرداند. پیش‌نویس، مقاله زمان‌بندی‌شده یا شناسه ناموجود پاسخ `404` دارد.

### قرارداد مدیریت مقاله

```json
{
  "title": "راهنمای تشخیص نقره اصل از بدل",
  "slug": "how-to-identify-authentic-silver",
  "excerpt": "خلاصه مقاله...",
  "content": "## عنوان بخش\n\nمتن مقاله...",
  "coverImageUrl": "/assets/blog-authentic-silver.png",
  "category": "دانش نقره",
  "author": "تحریریه مبین سیلور",
  "tags": "اصالت نقره,عیار ۹۲۵",
  "readingMinutes": 8,
  "featured": true,
  "isPublished": true,
  "publishedAt": "2026-08-31T08:00:00Z"
}
```

عنوان حداقل ۵، خلاصه حداقل ۲۰ و متن حداقل ۸۰ نویسه است. slug فقط حروف لاتین، عدد و خط تیره می‌پذیرد و تکراری بودن آن `409` است. ایجاد `201`، ویرایش `200` و حذف `204` برمی‌گرداند.

## 5. احراز هویت

### `POST /api/auth/login`

```json
{
  "username": "admin",
  "password": "admin123"
}
```

`username` می‌تواند نام کاربری یا ایمیل باشد. پاسخ موفق:

```json
{
  "token": "<jwt>",
  "user": {
    "id": 1,
    "username": "admin",
    "fullName": "مدیر فروشگاه",
    "email": "admin@mobinsilver.ir",
    "phone": "",
    "address": "",
    "role": "Admin"
  }
}
```

ورودی اشتباه: `401` با پیام فارسی عمومی؛ پاسخ مشخص نمی‌کند نام کاربری وجود دارد یا خیر. پس از پنج تلاش ناموفق برای ترکیب IP و نام کاربری، درخواست بعدی تا ۱۵ دقیقه `429` می‌گیرد. ورود موفق شمارنده همان کلید را پاک می‌کند.

### `POST /api/auth/register`

```json
{
  "fullName": "نام مشتری",
  "email": "customer@example.com",
  "password": "strong-password",
  "phone": "09120000000"
}
```

ایمیل به‌عنوان Username نیز ذخیره می‌شود. ایمیل تکراری `400` است. نام حداقل ۳ نویسه، رمز حداقل ۸ نویسه، قالب ایمیل و شماره موبایل ایران سمت API اعتبارسنجی می‌شوند.

## 6. حساب مشتری

### `GET /api/account/profile`

اطلاعات کاربر متناظر با claim شناسه را برمی‌گرداند.

### `PUT /api/account/profile`

```json
{
  "fullName": "سارا احمدی",
  "phone": "09121234567",
  "address": "تهران، ..."
}
```

### `GET /api/account/orders`

فقط سفارش‌های کاربر جاری را همراه اقلام، از جدید به قدیم برمی‌گرداند.

### `PUT /api/account/password`

```json
{ "currentPassword": "current-secret", "newPassword": "new-secret-at-least-8" }
```

رمز فعلی باید صحیح و رمز جدید حداقل ۸ نویسه باشد. هش و salt جدید ساخته می‌شود و رمز خام ذخیره نمی‌شود.

### `PATCH /api/account/orders/{id}/cancel`

فقط مالک سفارش می‌تواند سفارش دارای وضعیت `در انتظار بررسی` را لغو کند. با موفقیت، وضعیت `لغو شده` و موجودی تمام اقلام بازگردانده می‌شود. سفارش متعلق به کاربر دیگر `404` و وضعیت غیرقابل‌لغو `400` است.

## 7. ثبت سفارش

### `POST /api/orders`

```json
{
  "customerName": "سارا احمدی",
  "phone": "09121234567",
  "address": "تهران، ...",
  "paymentMethod": "پرداخت پس از تأیید کارشناس",
  "items": [
    { "productId": 1, "quantity": 2 }
  ]
}
```

قواعد:

- سبد خالی رد می‌شود.
- همه ProductIdها باید معتبر باشند.
- Quantity باید مثبت و موجودی کافی باشد.
- قیمت client نادیده گرفته می‌شود؛ مبلغ با قیمت پایگاه داده محاسبه می‌شود.
- موجودی در همان عملیات کم می‌شود.
- تعداد قلم‌های تکراری یک محصول پیش از کنترل موجودی با هم جمع می‌شود.
- تنها روش فعلی `پرداخت پس از تأیید کارشناس` است؛ درگاه آنلاین در این نسخه وجود ندارد.
- وضعیت اولیه `در انتظار بررسی` است.

پاسخ موفق:

```json
{
  "id": 3,
  "orderNumber": "MS-260827-A1B2C3",
  "total": 7360000,
  "status": "در انتظار بررسی"
}
```

## 8. مدیریت

تمام endpointهای این بخش policy نقش `Admin` دارند.

### `GET /api/admin/dashboard`

```json
{
  "salesToday": 44100000,
  "newOrders": 1,
  "lowStock": 1,
  "activeCustomers": 1,
  "silverPrice": 3680000,
  "goldPrice": 8950000,
  "chart": [
    { "date": "2026-08-27T00:00:00Z", "total": 44100000 }
  ]
}
```

قیمت‌های فلز در نسخه فعلی نمونه ثابت هستند و باید با provider معتبر جایگزین شوند.

### `PATCH /api/admin/orders/{id}/status`

```json
{
  "status": "در حال آماده‌سازی"
}
```

در نبود سفارش `404` است. فقط شش وضعیت تعریف‌شده پذیرفته می‌شوند. سفارش لغوشده terminal است و قابل بازگردانی نیست. تغییر هر سفارش غیرلغو به `لغو شده` موجودی اقلام را بازمی‌گرداند؛ ماشین transition کامل‌تر همچنان در نقشه راه قرار دارد.

### قرارداد ایجاد و ویرایش محصول

```json
{
  "name": "شمش نقره ۲۵۰ گرمی",
  "slug": "silver-bar-250g",
  "category": "silver-bar",
  "description": "...",
  "price": 25000000,
  "imageUrl": "/assets/silver-bar.png",
  "stock": 5,
  "purity": "۹۹۹",
  "weight": "۲۵۰ گرم",
  "featured": false
}
```

ایجاد موفق `201`، ویرایش موفق `200`، حذف موفق `204` و شناسه ناموجود `404` است.

نامک محصول یکتا و محدود به حروف لاتین، عدد و خط تیره است. نام، دسته، توضیح، قیمت، موجودی، تصویر، عیار و وزن سمت API اعتبارسنجی می‌شوند. حذف محصول دارای سابقه سفارش با `409` رد می‌شود تا تاریخچه مالی از بین نرود.

### تنظیمات مدیریت

`GET/PUT /api/admin/settings` نام فروشگاه، تلفن، ایمیل، نشانی، اعلان بالای سایت و `ordersEnabled` را مدیریت می‌کند. غیرفعال‌کردن `ordersEnabled` باعث رد کنترل‌شده سفارش جدید می‌شود و مرور فروشگاه همچنان فعال می‌ماند.

## 9. خطاها

ساختار عمومی خطاهای کسب‌وکار:

```json
{
  "message": "پیام قابل نمایش برای کاربر"
}
```

| کد | معنی |
|---|---|
| `200/201/204` | موفق |
| `400` | ورودی یا قاعده کسب‌وکار نامعتبر |
| `401` | token یا credential نامعتبر |
| `403` | نقش فاقد مجوز |
| `404` | منبع یافت نشد |
| `409` | تعارض منبع یکتا مانند slug تکراری |
| `429` | تلاش ورود ناموفق بیش از حد مجاز |
| `500` | خطای غیرمنتظره؛ جزئیات فقط در log امن |

## 10. قواعد نسخه‌بندی آینده

پیش از انتشار عمومی API:

- OpenAPI/Swagger و validation خودکار افزوده شود.
- قراردادها در namespace نسخه‌دار مانند `/api/v1` قرار گیرند.
- pagination برای فهرست‌های admin و محصولات اضافه شود.
- Problem Details استاندارد برای خطاها استفاده شود.
- breaking change فقط در نسخه major جدید انجام شود.
- idempotency برای سفارش و پرداخت پیاده‌سازی شود.
