# نقشه راه توسعه مبین سیلور

این سند فاصله نسخه فعلی تا سرویس تجاری production را شفاف می‌کند. اولویت‌ها پیشنهادی‌اند و باید با الزامات حقوقی، مجوزها و بودجه کسب‌وکار نهایی شوند.

## P0 — الزام پیش از فروش واقعی

- اتصال درگاه پرداخت sandbox و سپس production با verify، webhook و idempotency
- مدل `Payment`، reconciliation و refund کنترل‌شده
- اعتبارسنجی جامع ورودی با پیام استاندارد
- rate limiting، lockout و MFA مدیر
- حذف/تغییر اجباری credentialهای seed
- Secret Manager و rotation کلیدها
- HTTPS، headerهای امنیتی و CORS production
- EF Core migrations و پایگاه داده production
- optimistic concurrency و جلوگیری از oversell
- status enum/transition guard و Audit Log
- structured logging، health عمیق، metrics و alert
- backup/restore آزمایش‌شده و RPO/RTO
- تست integration و E2E در CI

## P1 — عملیات پایدار و تجربه فروش

- سرویس قیمت لحظه‌ای فلز با timestamp، fallback و کنترل دامنه تغییر
- مدل transaction موجودی و تاریخچه اصلاحات
- پیامک/ایمیل تأیید سفارش و تغییر وضعیت
- یکپارچه‌سازی حمل‌ونقل و کد رهگیری
- فاکتور رسمی و قواعد مالیاتی معتبر
- pagination، filter و export امن پنل مدیر
- آپلود تصویر امن با object storage و CDN
- مدیریت چند نشانی مشتری
- فراموشی رمز و تأیید ایمیل/تلفن
- soft delete محصولات و archive سفارش
- دسترس‌پذیری WCAG AA

## P2 — رشد محصول

- لیست علاقه‌مندی سروری و همگام بین دستگاه‌ها
- نقد و امتیاز محصول با moderation
- کد تخفیف، کمپین و قوانین قیمت‌گذاری
- سبد رهاشده با رضایت مشتری
- نقش‌های محدود Support، Inventory و Finance
- گزارش فروش، سود، موجودی و cohort مشتری
- جست‌وجوی پیشرفته
- SEO، metadata و structured data
- PWA یا اپ موبایل بر پایه API نسخه‌دار

## P3 — مقیاس و بلوغ

- مهاجرت به معماری چند replica
- cache و CDN پیشرفته
- outbox، queue و worker اعلان
- distributed tracing و SLO رسمی
- feature flags و canary deployment
- data warehouse و BI
- fraud/risk rules پرداخت
- disaster recovery چندمنطقه‌ای در صورت توجیه تجاری

## معیار خروج از هر مرحله

هر قابلیت فقط زمانی کامل است که:

- Use Case و معیار پذیرش دارد
- threat model و privacy impact بررسی شده است
- تست خودکار و مشاهده‌پذیری دارد
- migration و rollback مشخص است
- مستند توسعه، API و عملیات به‌روز شده است
- مالک پشتیبانی و runbook تعیین شده است

