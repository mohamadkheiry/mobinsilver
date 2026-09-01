# راهنمای استقرار مبین سیلور

این سند مسیر استقرار امن و قابل پشتیبانی را از build تا rollback توضیح می‌دهد. معماری نمونه شامل reverse proxy، فرانت‌اند استاتیک و ASP.NET Core API است.

## استقرار فعلی Mobin Silver

- دامنه عمومی: `https://mobinsilver.00f.ir`
- برنامه: یک artifact یکپارچه و self-contained برای `linux-x64` شامل ASP.NET Core، runtime و خروجی React در `wwwroot`
- مسیر پایه برنامه: `/opt/mobinsilver`
- داده پایدار: `/opt/mobinsilver/shared/App_Data`
- سرویس: `mobinsilver.service`
- پورت داخلی Kestrel: `5098`
- Reverse proxy: Nginx کانتینری مستقل روی `192.168.20.196`؛ upstream برابر `192.168.10.111:5098`
- دامنه و TLS: `mobinsilver.00f.ir` با گواهی اختصاصی Let's Encrypt و تمدید خودکار Certbot
- آخرین استقرار تأییدشده: commit `bc449f87861a0741cc6c55907e72f2349ff3b14f` در تاریخ ۱۴۰۵/۰۶/۰۹

رمز SSH، کلید JWT و فایل محیطی سرور هرگز در مخزن قرار نمی‌گیرند. Nginx و میزبان برنامه چند پروژه دیگر دارند؛ فقط service، مسیر و server block نام‌برده در این سند باید تغییر کنند.

## 1. پیش‌شرط‌های Production

پیش از انتشار عمومی باید این موارد تعیین و فراهم شوند:

- دامنه و گواهی TLS معتبر
- سرور Windows/IIS یا Linux/Nginx با .NET Runtime سازگار
- مسیر پایدار و دارای بکاپ برای داده‌ها؛ برای مقیاس بالاتر PostgreSQL یا SQL Server
- Secret Manager یا متغیر محیطی امن برای JWT و کلید سرویس‌های بیرونی
- حساب مدیر با رمز قوی و غیرپیش‌فرض
- درگاه پرداخت و webhook دارای امضای معتبر
- سرویس پیامک، ایمیل، قیمت فلزات، حمل‌ونقل و فاکتور رسمی
- سامانه log مرکزی، مانیتورینگ و هشدار
- برنامه بکاپ، retention، بازیابی و rollback آزمایش‌شده

## 2. متغیرهای محیطی

| متغیر | کاربرد | نمونه |
|---|---|---|
| `ASPNETCORE_ENVIRONMENT` | نام محیط | `Production` |
| `ASPNETCORE_URLS` | آدرس داخلی API | `http://0.0.0.0:5098` |
| `Jwt__Key` | کلید امضای JWT؛ حداقل 32 کاراکتر تصادفی | secret |
| `Jwt__Issuer` | صادرکننده token | `MobinSilver.Api` |
| `Jwt__Audience` | مخاطب token | `MobinSilver.Web` |
| `ConnectionStrings__Default` | اتصال پایگاه داده | مسیر امن یا connection string |
| `BootstrapAdmin__Username` | نام کاربری مدیر اولیه؛ فقط وقتی پایگاه داده کاربر ندارد | secret/config |
| `BootstrapAdmin__Email` | ایمیل مدیر اولیه؛ فقط وقتی پایگاه داده کاربر ندارد | secret/config |
| `BootstrapAdmin__Password` | رمز قوی مدیر اولیه؛ در Production برای پایگاه داده خالی الزامی است | secret |
| `ForwardedHeaders__KnownProxies__0` | IP پراکسی معتمد که `X-Forwarded-*` را ارسال می‌کند | `192.168.20.196` |

کلیدها را در فایل tracked، تصویر Docker، command history عمومی یا CI log قرار ندهید. برنامه در Production کلید JWT پیش‌فرض یا کوتاه‌تر از ۳۲ بایت را نمی‌پذیرد. `BootstrapAdmin__Password` پس از ایجاد نخستین مدیر دیگر خوانده نمی‌شود و باید از محیط حذف یا rotate شود.

## 3. Build قابل تکرار

از ریشه مخزن، ابتدا React را build و داخل `wwwroot` API کپی کنید، سپس artifact یکپارچه بسازید:

```powershell
cd src/mobin-silver-web
npm ci
npm run build
npm run test:e2e
cd ../..

# محتوای dist را در src/MobinSilver.Api/wwwroot قرار دهید
dotnet restore src/MobinSilver.Api/MobinSilver.Api.csproj -r linux-x64
dotnet publish src/MobinSilver.Api/MobinSilver.Api.csproj -c Release -r linux-x64 --self-contained true --no-restore -o artifacts/mobinsilver-linux-x64
```

خروجی‌ها:

- artifact یکپارچه: `artifacts/mobinsilver-linux-x64`
- خروجی میانی frontend: `src/mobin-silver-web/dist`

قبل از استقرار، checksum artifactها و شناسه commit را در release ثبت کنید.

## 4. توپولوژی پیشنهادی

```mermaid
flowchart LR
    U[مرورگر مشتری یا مدیر] -->|HTTPS 443| RP[Reverse Proxy / WAF]
    RP -->|Static files| WEB[React dist]
    RP -->|/api| API[ASP.NET Core API]
    API --> DB[(Production Database)]
    API --> PAY[Payment Gateway]
    API --> MSG[SMS / Email]
    API --> PRICE[Metal Price Provider]
    API --> OBS[Central Logs and Metrics]
```

## 5. استقرار Linux و Nginx

### سرویس systemd نمونه

```ini
[Unit]
Description=Mobin Silver Store
Wants=network-online.target
After=network-online.target

[Service]
Type=simple
User=mobinsilver
Group=mobinsilver
WorkingDirectory=/opt/mobinsilver/current
ExecStart=/opt/mobinsilver/current/MobinSilver.Api
Restart=always
RestartSec=5
EnvironmentFile=/etc/mobinsilver.env
UMask=0027
NoNewPrivileges=true
PrivateTmp=true
PrivateDevices=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/mobinsilver/shared/App_Data

[Install]
WantedBy=multi-user.target
```

فایل `/etc/mobinsilver.env` باید فقط برای `root` قابل خواندن باشد و داخل Git قرار نگیرد. template واقعی سرویس در [`deployment/mobinsilver.service`](deployment/mobinsilver.service) نگهداری می‌شود.

### Nginx نمونه برای معماری یکپارچه

```nginx
server {
    listen 443 ssl http2;
    server_name mobinsilver.example;

    location / {
        proxy_pass http://app-server:5098;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

}
```

TLS، HSTS، CSP، محدودسازی request body و rate limit را مطابق زیرساخت سازمانی فعال کنید.

در زیرساخت فعلی، Nginx کانتینری ابتدا TLS/SNI ورودی پورت `443` را در بخش `stream` به HTTP stack داخلی روی `4443` هدایت می‌کند. دو server block اختصاصی مبین سیلور در [`deployment/nginx-mobinsilver.conf`](deployment/nginx-mobinsilver.conf) ثبت شده‌اند. پیش از هر reload باید candidate با `nginx -t` بررسی شود؛ کانتینر را برای تغییر پیکربندی restart نکنید و از reload نرم استفاده کنید.

گواهی در `/etc/letsencrypt/live/mobinsilver.00f.ir` توسط Certbot نگهداری و نسخه قابل‌خواندن کانتینر در `/home/nginx/ssl/mobinsilver.00f.ir` قرار می‌گیرد. hook موجود در [`deployment/mobinsilver-cert-renew-hook.sh`](deployment/mobinsilver-cert-renew-hook.sh) پس از تمدید موفق، فقط گواهی این دامنه را همگام و Nginx را پس از تست پیکربندی reload می‌کند. `certbot.timer` باید `enabled` و `active` باقی بماند.

## 6. استقرار Windows و IIS

1. ASP.NET Core Hosting Bundle سازگار را نصب کنید.
2. خروجی `dotnet publish` را در مسیر نسخه‌دار قرار دهید.
3. Application Pool مستقل با `No Managed Code` بسازید.
4. فرانت‌اند `dist` را به‌عنوان محتوای استاتیک منتشر کنید.
5. URL Rewrite یا reverse proxy را برای `/api` به Kestrel تنظیم کنید.
6. اسرار را در متغیر محیطی App Pool یا secret store سازمان قرار دهید.
7. مجوز نوشتن را فقط برای مسیر داده و لاگ مورد نیاز به identity سرویس بدهید.
8. Health check و recycle کنترل‌شده را فعال کنید.

## 7. پایگاه داده

SQLite برای نصب تک‌نمونه و ترافیک محدود مناسب است. برای چند replica، سفارش‌های پرتعداد یا نیازهای گزارش‌گیری، PostgreSQL یا SQL Server توصیه می‌شود.

قواعد انتشار schema:

1. قبل از migration بکاپ سازگار بگیرید.
2. migration را روی staging با حجم داده نزدیک production اجرا کنید.
3. زمان lock و سازگاری نسخه قدیم/جدید را بررسی کنید.
4. ابتدا تغییر سازگار با عقب، سپس نسخه برنامه و در انتشار بعد cleanup را انجام دهید.
5. نتیجه migration و شماره نسخه schema را ثبت کنید.

## 8. فرایند Release

1. Pull Request تأیید و branch اصلی سبز باشد.
2. نسخه semantic و changelog مشخص شود.
3. artifactها فقط یک‌بار build و بین محیط‌ها promote شوند.
4. بکاپ دیتابیس و تنظیمات تأیید شود.
5. migration سازگار اجرا شود.
6. API جدید روی slot یا مسیر نسخه‌دار بالا بیاید.
7. health، login، products و یک سفارش synthetic کنترل شود.
8. فرانت‌اند با cache policy مناسب منتشر شود.
9. ترافیک به نسخه جدید منتقل شود.
10. متریک‌ها و خطاها حداقل 30 دقیقه زیر نظر باشند.

فرایند نسخه‌دار، کنترل‌های ایمنی و rollback عملیاتی در [`deployment/README.md`](deployment/README.md) آمده است. انتشار روی سرور مشترک نباید شامل `docker compose down`، restart میزبان، restart سرویس‌های دیگر یا بازنویسی server blockهای موجود باشد.

## 9. Smoke Test پس از استقرار

- `GET /api/health` برابر `200` و `healthy`
- صفحه اصلی، assetها و فونت بدون 404
- فهرست مجله، جستجو و یک صفحه مقاله
- بخش مقالات ادمین و بازشدن فرم ایجاد مقاله
- ورود مشتری و مدیر
- مشاهده محصولات و جزئیات
- افزودن سبد و ادامه خرید
- ثبت سفارش آزمایشی در sandbox درگاه
- مشاهده سفارش در پنل مدیر و مشتری
- تغییر وضعیت سفارش
- نبود افزایش غیرعادی 4xx، 5xx یا latency

## 10. Rollback

شرایط rollback فوری:

- خطای پایدار ورود یا ثبت سفارش
- ناسازگاری داده یا migration شکست‌خورده
- افزایش شدید 5xx یا latency
- مشکل امنیتی یا نشت اطلاعات
- شکست callback پرداخت

مراحل:

1. انتشار را متوقف و مسئول رخداد را مشخص کنید.
2. ترافیک را به artifact قبلی سالم برگردانید.
3. migration را فقط با روش از قبل آزمایش‌شده rollback کنید؛ در غیر این صورت نسخه برنامه سازگار با schema جدید اجرا شود.
4. health و سناریوهای حیاتی را دوباره کنترل کنید.
5. رخداد، timeline، اثر و اقدامات اصلاحی ثبت شوند.

## 11. بکاپ و بازیابی

- بکاپ روزانه کامل و بکاپ افزایشی/لاگ مطابق موتور پایگاه داده
- رمزنگاری در انتقال و محل ذخیره
- نگهداری حداقل یک کپی خارج از سرور اصلی
- retention متناسب با مقررات مالی و حریم خصوصی
- تست بازیابی دوره‌ای؛ وجود فایل بکاپ به‌تنهایی کافی نیست
- تعریف و تصویب RPO و RTO توسط کسب‌وکار

برای SQLite، بکاپ سازگار باید با توقف کوتاه writeها یا ابزار backup آنلاین SQLite انجام شود؛ کپی خام فایل هنگام تراکنش فعال ممکن است ناسازگار باشد.

## 12. درگاه پرداخت

نسخه فعلی ثبت سفارش را انجام می‌دهد اما پرداخت واقعی نیست. تا زمانی که Payment Gateway و webhook امن پیاده نشده‌اند، وضعیت سفارش نباید معادل تسویه مالی قطعی تفسیر شود. طراحی چرخه آینده در [نمودارهای توالی](docs/diagrams/sequence-diagrams.md) آمده است.

## 13. اسناد مرتبط

- [امنیت](docs/security.md)
- [عملیات و پشتیبانی](docs/operations-support.md)
- [راهبرد تست](docs/testing.md)
- [معماری](docs/architecture.md)

## 14. آخرین انتشار Production

نسخه `f6c78f194a012ca247c8c9c278474d9f8bcd787a` در تاریخ `2026-09-01` روی سرور برنامه منتشر شد و از طریق `https://mobinsilver.00f.ir` در دسترس است.

مشخصات قابل ممیزی این انتشار:

- مسیر release: `/opt/mobinsilver/releases/f6c78f194a012ca247c8c9c278474d9f8bcd787a`
- artifact نگهداری‌شده: `/opt/mobinsilver/artifacts/f6c78f1-linux-x64.tar.gz`
- SHA-256 artifact: `b9de57892c97b091100c6fb35adc9472c9e775069c8b2f5bdb364ac60e96a06b`
- بکاپ پیش از انتشار: `/opt/mobinsilver/backups/mobinsilver-before-f6c78f1-20260901T014026Z.db`
- سرویس: `active` و `enabled` با `Restart=always`
- health داخلی و عمومی: `healthy`
- داده قابل مشاهده: ۹ محصول و ۲۰ مقاله منتشرشده
- آزمون مرورگری production: پنج سناریوی read-only فروشگاه، وبلاگ، موبایل و داشبورد مقالات Admin موفق
- کنترل سرویس‌های مشترک: hash فهرست سرویس‌های در حال اجرا، به‌جز مبین سیلور، قبل و بعد یکسان بود
- Nginx: در این انتشار هیچ پیکربندی، container یا سایت دیگری تغییر نکرد

در نخستین تلاش، مالکیت پوشه مشترک SQLite به‌دلیل اجرای بازگشتی `chown` روی release دارای symlink تغییر کرد. health check شکست را تشخیص داد و symlink به release قبلی برگشت. مالکیت `/opt/mobinsilver/shared/App_Data` اصلاح و سرویس قبلی سالم تأیید شد؛ سپس انتشار با permission گذاری بدون دنبال‌کردن symlink و تعویض اتمیک `current` تکرار و موفق شد. قاعده عملیاتی این رخداد: روی release دارای symlink دیتابیس هرگز `chown -R` اجرا نشود و قبل و بعد از تعویض release، مالکیت پوشه shared صریحاً کنترل شود.
