# امنیت مبین سیلور

## 1. مدل تهدید خلاصه

دارایی‌های حساس سامانه:

- حساب مدیر و مجوزهای مدیریتی
- رمز و token کاربران
- اطلاعات شخصی مشتری، تلفن و نشانی
- سفارش، مبلغ، موجودی و وضعیت مالی
- کلید JWT و کلید سرویس‌های بیرونی
- داده پرداخت آینده و شناسه‌های تراکنش

مرزهای اصلی اعتماد:

1. مرورگر به API
2. API به پایگاه داده
3. reverse proxy به API
4. API به درگاه پرداخت، پیامک و منبع قیمت آینده
5. CI/CD به محیط production

## 2. کنترل‌های موجود

- رمز خام ذخیره نمی‌شود؛ PBKDF2 همراه salt مستقل استفاده می‌شود.
- JWT از نظر امضا، issuer، audience و lifetime بررسی می‌شود.
- `ClockSkew` برابر صفر است تا انقضا دقیق اعمال شود.
- endpointهای مدیریت policy نقش `Admin` دارند.
- سفارش‌های مشتری با UserId استخراج‌شده از claim فیلتر می‌شوند.
- مبلغ سفارش از قیمت سرور محاسبه می‌شود، نه مقدار frontend.
- ورود برای هر ترکیب IP و نام کاربری پس از پنج شکست، ۱۵ دقیقه با پاسخ `429` محدود می‌شود.
- نام، ایمیل، تلفن، نشانی، محصول، تنظیمات، وضعیت و قرارداد سفارش سمت API اعتبارسنجی می‌شوند.
- محصول دارای سابقه سفارش حذف نمی‌شود و سفارش لغوشده قابل بازگردانی نیست.
- لغو سفارش توسط مشتری یا مدیر موجودی اقلام را به‌صورت کنترل‌شده بازمی‌گرداند.
- نشست ذخیره‌شده frontend هنگام راه‌اندازی با API دوباره اعتبارسنجی می‌شود.
- کم‌کردن موجودی سفارش در تراکنش serializable و با شرط اتمیک `Stock >= quantity` انجام می‌شود.
- وضعیت سفارش فقط در امتداد transitionهای مجاز تغییر می‌کند و وضعیت‌های نهایی دوباره تغییر نمی‌کنند.
- forwarded header فقط از IP پراکسی‌های صریحاً پیکربندی‌شده پذیرفته می‌شود.
- Production با کلید JWT پیش‌فرض/کوتاه یا پایگاه داده خالی بدون رمز bootstrap مدیر شروع نمی‌شود.
- مسیر تصویر محصول و مقاله فقط از `/assets/` داخلی و بدون traversal پذیرفته می‌شود.
- فایل دیتابیس، `.env`، artifact و فایل‌های build در `.gitignore` هستند.
- CORS توسعه فقط originهای localhost مشخص را می‌پذیرد.

## 3. شکاف‌های مهم پیش از Production

این موارد باید پیش از فروش واقعی تکمیل شوند:

- انتقال کلید JWT به Secret Manager و rotation دوره‌ای
- تکمیل rate limit توزیع‌شده برای register، سفارش و endpointهای حساس؛ limiter فعلی login در حافظه همان instance است
- lockout یا تأخیر افزایشی حساب‌محور برای تلاش ورود ناموفق در کنار limiter فعلی
- refresh session امن، revoke و logout سمت سرور
- ترجیح HttpOnly Secure SameSite cookie یا طراحی دفاعی در برابر XSS
- MFA برای مدیران
- Content Security Policy، HSTS، X-Content-Type-Options و Referrer-Policy
- محدودسازی CORS به دامنه واقعی production
- audit log تغییر محصول، موجودی، نقش و وضعیت سفارش
- soft delete محصول؛ کنترل جلوگیری از حذف محصول دارای سفارش اکنون فعال است
- سیاست تغییر اجباری رمز مدیر bootstrap در نخستین ورود
- پرداخت امضاشده، idempotent و verify سمت سرور
- رمزنگاری بکاپ و کنترل دسترسی داده شخصی
- dependency scanning، secret scanning و SAST در CI

## 4. مدیریت Secret

هیچ secret واقعی نباید در این مخزن قرار گیرد. منابع مجاز:

- GitHub Actions Secrets برای CI/CD
- Azure Key Vault، AWS Secrets Manager، HashiCorp Vault یا secret store سازمانی
- فایل محیطی خارج از repository با permission محدود

نام‌های پیشنهادی:

```text
JWT_SIGNING_KEY
DATABASE_CONNECTION_STRING
PAYMENT_MERCHANT_ID
PAYMENT_API_KEY
PAYMENT_WEBHOOK_SECRET
SMS_API_KEY
PRICE_PROVIDER_API_KEY
```

در ASP.NET Core می‌توان آن‌ها را با نام‌های `Jwt__Key` و `ConnectionStrings__Default` نگاشت کرد. secret نباید در exception، telemetry، screenshot یا ticket پشتیبانی ظاهر شود.

## 5. احراز هویت و نشست

### وضعیت فعلی

- token در login/register صادر می‌شود.
- frontend token را در localStorage نگه می‌دارد.
- routeهای UI با role محافظت می‌شوند؛ API مرجع نهایی مجوز است.

### هدف Production

- access token کوتاه‌عمر
- refresh token چرخشی و hash‌شده در دیتابیس
- امکان revoke بر اساس session/device
- MFA برای Admin
- نمایش نشست‌های فعال و خروج از همه دستگاه‌ها
- ثبت رخداد ورود موفق/ناموفق بدون ذخیره credential

## 6. مجوز و جلوگیری از IDOR

- هیچ UserId از request client برای سفارش‌های شخصی پذیرفته نشود.
- مالکیت منبع همیشه با claim کاربر بررسی شود.
- عملیات admin فقط با policy سرور انجام شود.
- افزودن نقش Support باید با کمترین مجوز و endpointهای جدا باشد؛ استفاده مشترک از Admin ممنوع است.
- تست خودکار برای دسترسی مشتری A به سفارش مشتری B الزامی است.

## 7. پرداخت آینده

- مبلغ و شناسه سفارش فقط سمت سرور تعیین شوند.
- callback مرورگر اثبات پرداخت نیست؛ verify server-to-server الزامی است.
- webhook باید امضا، timestamp، replay window و IP/provider policy داشته باشد.
- هر Payment Attempt کلید idempotency یکتا داشته باشد.
- تغییر سفارش به Paid و ثبت Payment در یک تراکنش انجام شود.
- مبلغ، currency، merchant، order و authority تطبیق داده شوند.
- داده کارت هرگز وارد سامانه مبین سیلور نشود؛ کاربر در صفحه رسمی درگاه پرداخت کند.
- بازپرداخت مجوز مجزا، MFA و audit کامل نیاز دارد.

## 8. حفاظت از داده و حریم خصوصی

- فقط داده لازم جمع‌آوری شود.
- retention تلفن، نشانی و سفارش بر اساس قانون و نیاز حسابداری تعریف شود.
- دسترسی پشتیبان به PII ثبت و محدود شود.
- خروجی گزارش‌ها و logها PII را mask کنند.
- بکاپ رمزنگاری و restore دوره‌ای آزمایش شود.
- درخواست اصلاح/حذف داده با محدودیت قانونی سفارش مالی فرآیند مشخص داشته باشد.

## 9. Logging امن

مجاز:

- request id، endpoint، status، latency
- user id داخلی در دسترسی محدود
- order id داخلی، نه تمام نشانی
- نوع خطا و stack trace در محیط امن

غیرمجاز:

- password، token، salt یا hash
- header کامل Authorization
- کلید درگاه و connection string
- شماره کارت یا اطلاعات حساس پرداخت
- نشانی/تلفن کامل در log عمومی

## 10. پاسخ به رخداد امنیتی

1. دسترسی یا قابلیت آسیب‌پذیر را محدود کنید.
2. secret مشکوک را rotate کنید.
3. شواهد و logها را بدون تغییر حفظ کنید.
4. دامنه، زمان و کاربران متاثر را تعیین کنید.
5. مسیر سوءاستفاده را رفع و تست regression اضافه کنید.
6. الزامات اطلاع‌رسانی قانونی و قراردادی را اجرا کنید.
7. postmortem و اقدام پیشگیرانه ثبت شود.

## 11. چک‌لیست بازبینی امنیتی Release

- [ ] secret scanning سبز است
- [ ] وابستگی آسیب‌پذیر بحرانی/بالا وجود ندارد
- [ ] endpoint جدید policy صحیح دارد
- [ ] ورودی‌ها validate و encode می‌شوند
- [ ] تست 401، 403 و IDOR وجود دارد
- [ ] log فاقد اطلاعات حساس است
- [ ] CORS و headerهای امنیتی production بررسی شده‌اند
- [ ] backup و rollback آزمایش شده‌اند
- [ ] برای پرداخت، verify و idempotency تست شده‌اند

## 12. گزارش آسیب‌پذیری

آسیب‌پذیری امنیتی را در Issue عمومی همراه exploit واقعی، token یا داده مشتری منتشر نکنید. از یک کانال خصوصی مالک مخزن یا GitHub Private Vulnerability Reporting استفاده کنید و نسخه، اثر، گام بازتولید امن و راهکار پیشنهادی را ارائه دهید.
