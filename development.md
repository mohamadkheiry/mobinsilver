# راهنمای توسعه مبین سیلور

این سند مرجع شروع کار، توسعه قابلیت، بازبینی کد و نگهداری روزمره پروژه است.

## 1. پیش‌نیازها

- Windows، Linux یا macOS
- Git 2.40 یا جدیدتر
- .NET SDK 6 یا جدیدتر
- Node.js 20 LTS یا جدیدتر
- یک IDE مانند Visual Studio، Rider یا VS Code

بررسی نسخه‌ها:

```powershell
git --version
dotnet --info
node --version
npm --version
```

## 2. دریافت و اجرای پروژه

```powershell
git clone https://github.com/mohamadkheiry/mobinsilver.git
cd mobinsilver
```

API:

```powershell
cd src/MobinSilver.Api
dotnet restore
dotnet run --urls http://127.0.0.1:5088
```

Frontend در ترمینال دیگر:

```powershell
cd src/mobin-silver-web
npm ci
npm run dev
```

Vite در محیط توسعه درخواست‌های `/api` را به `http://127.0.0.1:5088` proxy می‌کند.

## 3. معماری کد

### Backend

- `Program.cs`: ثبت سرویس‌ها، middlewareها و endpointهای Minimal API
- `Data/AppDbContext.cs`: DbContext، نگاشت و seed داده‌های نمایشی
- `Models/Entities.cs`: موجودیت‌ها و قراردادهای درخواست
- `Services/PasswordService.cs`: تولید و بررسی هش PBKDF2
- `Services/TokenService.cs`: صدور JWT
- `App_Data/`: دیتابیس محلی تولیدشده در runtime؛ در Git ثبت نمی‌شود

### Frontend

- `src/App.tsx`: جدول routeها و مرزبندی بخش عمومی، مشتری و ادمین
- `src/pages/`: صفحات سطح route
- `src/components/`: اجزای مشترک و layoutها
- `src/contexts/`: وضعیت احراز هویت، سبد و علاقه‌مندی‌ها
- `src/lib/api.ts`: client ارتباط با API و مدیریت header احراز هویت
- `src/styles.css`: توکن‌ها، کامپوننت‌ها و responsive styling
- `public/assets/`: تصاویر محصول و هویت بصری

## 4. تنظیمات محیط توسعه

در تنظیمات ASP.NET Core از نگاشت استاندارد متغیر محیطی استفاده می‌شود. دو زیرخط (`__`) معادل بخش تو‌در‌توی JSON است:

```powershell
$env:ASPNETCORE_ENVIRONMENT = "Development"
$env:Jwt__Key = "LOCAL-ONLY-SECRET-CHANGE-ME-AT-LEAST-32-CHARS"
$env:ConnectionStrings__Default = "Data Source=App_Data/mobinsilver.db"
dotnet run --urls http://127.0.0.1:5088
```

فایل `.env` و تمام مشتقات آن به‌جز `.env.example` توسط Git نادیده گرفته می‌شوند. کلید واقعی را commit نکنید.

## 5. پایگاه داده و Seed

نسخه فعلی برای شروع سریع از `EnsureCreated` و SQLite استفاده می‌کند. در نخستین اجرا، حساب‌های نمایشی، محصولات و سفارش‌های نمونه ایجاد می‌شوند.

برای توسعه بلندمدت و تغییرات schema:

1. پروژه را از `EnsureCreated` به migrationهای EF Core منتقل کنید.
2. migration را همراه تغییر مدل در همان Pull Request ثبت کنید.
3. migration را روی نسخه کپی‌شده از داده staging آزمایش کنید.
4. برای migration مخرب، برنامه rollback یا migration جبرانی ارائه دهید.

پیشنهاد دستورات پس از افزودن بسته ابزار EF:

```powershell
dotnet tool install --global dotnet-ef
dotnet ef migrations add DescriptiveMigrationName
dotnet ef database update
```

## 6. افزودن قابلیت Backend

1. Use Case و قرارداد ورودی/خروجی را در `docs` به‌روزرسانی کنید.
2. موجودیت یا request model را با validation صریح اضافه کنید.
3. queryهای خواندنی را با `AsNoTracking` پیاده‌سازی کنید.
4. endpoint را با policy مناسب `Customer` یا `Admin` محافظت کنید.
5. خطاها را با status code استاندارد و پیام قابل‌مصرف بازگردانید.
6. تست موفق، دسترسی غیرمجاز، ورودی نامعتبر و داده ناموجود را اضافه کنید.
7. مرجع API را به‌روزرسانی کنید.

## 7. افزودن قابلیت Frontend

1. route یا صفحه را در `App.tsx` ثبت کنید.
2. تماس API را در `lib/api.ts` متمرکز نگه دارید.
3. از context فقط برای وضعیت سراسری واقعی استفاده کنید؛ وضعیت فرم را محلی نگه دارید.
4. حالت‌های loading، empty، error و success را طراحی کنید.
5. تعامل با صفحه‌کلید و focus قابل‌مشاهده را بررسی کنید.
6. RTL، اعداد فارسی و عرض‌های 390، 768، 1024 و 1536 را کنترل کنید.
7. تصاویر را بهینه و متن جایگزین معنی‌دار تعیین کنید.

## 8. قواعد Git و Pull Request

نام branchها:

```text
feature/product-reviews
fix/order-status-refresh
docs/payment-runbook
chore/dependency-upgrade
```

قالب commit پیشنهادی:

```text
feat(admin): add inventory adjustment history
fix(auth): reject expired refresh sessions
docs(deploy): document reverse proxy headers
```

هر Pull Request باید:

- هدف و دامنه تغییر را توضیح دهد
- Issue یا تصمیم فنی مرتبط را لینک کند
- تست‌های اجراشده را فهرست کند
- برای تغییر UI، اسکرین‌شات دسکتاپ و موبایل داشته باشد
- برای تغییر API، قرارداد و مستندات را به‌روز کند
- فاقد secret، دیتابیس، لاگ حساس و فایل build باشد
- حداقل یک بازبینی‌کننده داشته باشد

## 9. Definition of Done

- معیار پذیرش Use Case کامل شده است
- بیلد backend و frontend موفق است
- تست‌های مرتبط سبز هستند
- کنترل مجوز نقش‌ها انجام شده است
- حالت‌های loading/error/empty پوشش داده شده‌اند
- responsive و RTL بررسی شده‌اند
- logging مناسب و بدون اطلاعات حساس وجود دارد
- مستندات و نمودارهای تحت تأثیر به‌روزرسانی شده‌اند
- برنامه deployment و rollback مشخص است

## 10. دستورات کنترل کیفیت

```powershell
dotnet restore src/MobinSilver.Api/MobinSilver.Api.csproj
dotnet build src/MobinSilver.Api/MobinSilver.Api.csproj -c Release

cd src/mobin-silver-web
npm ci
npm run build
npm audit --omit=dev
```

کنترل دستی ضروری:

- صفحه اصلی و جست‌وجوی محصول
- افزودن، افزایش و حذف سبد خرید
- ثبت‌نام، ورود و خروج
- دسترسی غیرمجاز مشتری به `/admin`
- ورود مدیر و مشاهده تمام بخش‌های داشبورد
- تغییر وضعیت سفارش و مشاهده آن در داشبورد مشتری
- عرض موبایل 390 پیکسل بدون overflow
- نبود خطای Console و درخواست شبکه شکست‌خورده غیرمنتظره

## 11. ارتقای وابستگی‌ها

- ارتقاها را کوچک و دوره‌ای انجام دهید.
- قبل و بعد از ارتقا `npm audit` و build را اجرا کنید.
- release note رسمی .NET، React Router و Vite را بررسی کنید.
- ارتقای major باید Pull Request مستقل و برنامه rollback داشته باشد.
- فایل lock باید همراه `package.json` commit شود.

## 12. خطایابی متداول

### API روی پورت 5088 اجرا نمی‌شود

```powershell
Get-NetTCPConnection -LocalPort 5088 -ErrorAction SilentlyContinue
```

پردازش اشغال‌کننده پورت را شناسایی کنید یا پورت API و proxy داخل `vite.config.ts` را هماهنگ تغییر دهید.

### فرانت‌اند خطای اتصال API دارد

- اجرای API را با `/api/health` بررسی کنید.
- proxy داخل `vite.config.ts` را کنترل کنید.
- در production، مسیر reverse proxy برای `/api` را بررسی کنید.
- header `Authorization: Bearer ...` را بدون ثبت خود token در لاگ کنترل کنید.

### نیاز به بازسازی دیتابیس توسعه وجود دارد

ابتدا API را متوقف کنید، از داده لازم بکاپ بگیرید و فقط فایل دیتابیس محیط محلی را حذف کنید. اجرای بعدی seed را دوباره می‌سازد. این کار هرگز روی production انجام نشود.

## 13. منابع مرتبط

- [معماری](docs/architecture.md)
- [مرجع API](docs/api-reference.md)
- [امنیت](docs/security.md)
- [تست](docs/testing.md)
- [استقرار](deployment.md)
- [پشتیبانی](docs/operations-support.md)

