# راهنمای عملیاتی استقرار Mobin Silver

این پوشه templateهای بدون secret را برای استقرار واقعی مبین سیلور نگهداری می‌کند. هیچ رمز SSH، کلید JWT، token یا کلید خصوصی TLS نباید به این پوشه یا تاریخچه Git وارد شود.

## توپولوژی Production

| جزء | مقدار |
|---|---|
| برنامه | ASP.NET Core و React به‌صورت artifact یکپارچه self-contained |
| مسیر پایه | `/opt/mobinsilver` |
| نسخه‌های immutable | `/opt/mobinsilver/releases/{commit-sha}` |
| نسخه فعال | symlink در `/opt/mobinsilver/current` |
| artifact نگهداری‌شده | `/opt/mobinsilver/artifacts/{short-sha}-linux-x64.tar.gz` |
| داده پایدار | `/opt/mobinsilver/shared/App_Data` |
| سرویس | `/etc/systemd/system/mobinsilver.service` |
| محیط و secretها | `/etc/mobinsilver.env` با مالکیت `root:root` و مجوز `0600` |
| upstream | `192.168.10.111:5098` |
| دامنه | `https://mobinsilver.00f.ir` |
| Nginx | کانتینر `nginx_reverse_proxy` با policy برابر `restart: always` |
| پیکربندی Nginx | `/home/nginx/nginx/nginx.conf` |
| TLS قابل‌خواندن کانتینر | `/home/nginx/ssl/mobinsilver.00f.ir` |

## انتشار نسخه جدید

1. سبز بودن CI شاخه `main` و شناسه دقیق commit را تأیید کنید.
2. فرانت‌اند را با `npm ci` و `npm run build` بسازید و `dist` را در `src/MobinSilver.Api/wwwroot` قرار دهید.
3. API را با `-r linux-x64 --self-contained true` در مسیر artifact جدید publish کنید.
4. آرشیو `tar.gz` بسازید و SHA-256 محلی را ثبت کنید.
5. artifact را با نام نسخه‌دار به میزبان برنامه منتقل و SHA-256 مقصد را پیش از extract مقایسه کنید.
6. مسیر جدید `/opt/mobinsilver/releases/{commit-sha}` را ایجاد و artifact را همان‌جا استخراج کنید.
7. `App_Data` داخل release را به `/opt/mobinsilver/shared/App_Data` symlink کنید؛ دیتابیس را داخل release قرار ندهید.
8. مالکیت release باید `root:mobinsilver`، مالکیت داده باید `mobinsilver:mobinsilver` و دسترسی نوشتن فقط برای داده فعال باشد.
9. symlink موقت بسازید و `current` را به‌صورت atomic به release جدید تغییر دهید.
10. فقط `mobinsilver.service` را restart کنید؛ سپس health، صفحه اصلی، ورود، محصولات، وبلاگ و پنل مدیریت را کنترل کنید.

## کنترل ایمنی روی سرور مشترک

- پیش از تغییر، فهرست نام کانتینرهای در حال اجرا و server nameهای Nginx را snapshot کنید.
- از `docker compose down`، restart کل Docker، reboot میزبان و restart سرویس‌های نامرتبط استفاده نکنید.
- قبل از تغییر Nginx، از فایل اصلی یک بکاپ زمان‌دار بگیرید.
- candidate پیکربندی را پیش از اعمال با `nginx -t` آزمایش کنید.
- بعد از اعمال، دوباره `nginx -t` اجرا و فقط `nginx -s reload` انجام دهید.
- پس از reload، snapshot کانتینرها و server nameها را با قبل مقایسه و چند دامنه موجود را smoke test کنید.

## پایداری پس از reboot

سرویس برنامه باید `enabled`، `active` و دارای `Restart=always` باشد:

```bash
systemctl is-enabled mobinsilver.service
systemctl is-active mobinsilver.service
systemctl show mobinsilver.service -p Restart -p User -p MainPID
```

Nginx کانتینری policy برابر `restart: always` دارد و Certbot timer نیز باید فعال باشد:

```bash
docker inspect -f '{{.HostConfig.RestartPolicy.Name}} {{.State.Status}}' nginx_reverse_proxy
systemctl show certbot.timer -p UnitFileState -p ActiveState -p NextElapseUSecRealtime
```

برای اثبات restart برنامه بدون ایجاد اختلال در سایت‌های دیگر، فقط `mobinsilver.service` را restart و تغییر PID، سلامت API و تعداد مقاله‌ها را کنترل کنید. reboot کامل میزبان مشترک برای smoke test مجاز نیست.

## Rollback برنامه

1. release سالم قبلی را در `/opt/mobinsilver/releases` مشخص کنید.
2. `current` را به‌صورت atomic به همان release برگردانید.
3. فقط `mobinsilver.service` را restart کنید.
4. Health API و گردش‌های حیاتی را دوباره بررسی کنید.

داده‌های `/opt/mobinsilver/shared/App_Data` در rollback release حذف یا جایگزین نمی‌شوند. برای SQLite، بکاپ سازگار را با توقف کوتاه writeها یا API آنلاین SQLite بگیرید؛ فایل دیتابیس فعال را به‌صورت خام کپی نکنید.

## Rollback Nginx

1. آخرین فایل `nginx.conf.backup-*-before-mobinsilver*` را مشخص کنید.
2. محتوای بکاپ را روی همان فایل bind-mounted اصلی بازگردانید؛ inode فایل را بی‌دلیل جایگزین نکنید.
3. داخل کانتینر `nginx -t` اجرا کنید.
4. فقط در صورت موفقیت تست، `nginx -s reload` اجرا کنید.
5. دامنه‌های قبلی و مبین سیلور را دوباره آزمایش کنید.

## TLS و تمدید خودکار

Certbot گواهی اصلی را در `/etc/letsencrypt/live/mobinsilver.00f.ir` تمدید می‌کند. چون کانتینر فقط `/home/nginx/ssl` را mount کرده است، hook این پوشه پس از تمدید موفق گواهی را با مجوز مناسب کپی، syntax را کنترل و Nginx را نرم reload می‌کند.

مسیر نصب hook:

```text
/etc/letsencrypt/renewal-hooks/deploy/mobinsilver-nginx.sh
```

مالک hook باید `root:root` و مجوز آن `0750` باشد.
