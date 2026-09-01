# معماری سامانه مبین سیلور

## 1. هدف و دامنه

سامانه سه سطح تجربه ارائه می‌کند: فروشگاه عمومی، پنل مشتری و پنل مدیریت. React مسئول رابط و وضعیت موقت مرورگر است؛ ASP.NET Core قوانین سرور، احراز هویت و API را اجرا می‌کند؛ EF Core داده پایدار را در SQLite نگه می‌دارد.

## 2. System Context

```mermaid
flowchart LR
    Customer[مشتری] -->|مرور، خرید و پیگیری| MS[سامانه مبین سیلور]
    Admin[مدیر فروشگاه] -->|محصول، سفارش و مشتری| MS
    Support[پشتیبان] -->|بررسی رخداد و سفارش| MS
    MS -. آینده .-> Payment[درگاه پرداخت]
    MS -. آینده .-> Messaging[پیامک و ایمیل]
    MS -. آینده .-> Price[منبع قیمت فلزات]
    MS -. آینده .-> Shipping[شرکت حمل‌ونقل]
```

خطوط پیوسته بخشی از نسخه فعلی و خطوط نقطه‌چین یکپارچه‌سازی پیشنهادی production هستند.

## 3. Container Diagram

```mermaid
flowchart TB
    Browser[Browser]

    subgraph System[Mobin Silver]
        Web[React SPA\nTypeScript + Vite]
        Api[ASP.NET Core Minimal API\nJWT + Business Rules]
        Db[(SQLite\nUsers Products Orders OrderItems\nBlogPosts StoreSettings Newsletter)]
        Assets[Static Product Assets]
    end

    Browser -->|HTTPS / HTML CSS JS| Web
    Browser -->|HTTPS JSON /api| Api
    Web --> Assets
    Api -->|EF Core| Db
```

در development، Vite درخواست `/api` را به Kestrel روی پورت 5088 proxy می‌کند. در production، reverse proxy باید همین مرز را با HTTPS ارائه کند.

## 4. اجزای Backend

```mermaid
flowchart LR
    Endpoints[Minimal API Endpoints] --> Auth[Authentication and Authorization]
    Endpoints --> Rules[Order and Product Rules]
    Auth --> Token[TokenService]
    Auth --> Password[PasswordService PBKDF2]
    Rules --> Context[AppDbContext]
    Context --> EF[Entity Framework Core]
    EF --> DB[(SQLite)]
```

- `Program.cs`: composition root، pipeline، routeها و قوانین فعلی
- `TokenService`: ایجاد JWT شامل شناسه، نام و role
- `PasswordService`: salt تصادفی و PBKDF2 برای hash/verify
- `AppDbContext`: query، persistence، index و precision
- `Entities.cs`: مدل دامنه و serialization boundary

برای رشد پروژه توصیه می‌شود endpointها به feature modules، validation و serviceهای کاربردی مستقل تفکیک شوند؛ این تغییر در [نقشه راه](roadmap.md) ثبت شده است.

## 5. اجزای Frontend

```mermaid
flowchart TB
    Router[React Router] --> Public[Store Pages]
    Router --> Customer[Protected Customer Dashboard]
    Router --> Admin[Protected Admin Dashboard]
    Public --> Cart[Cart Context]
    Public --> Favorite[Favorites Context]
    Public --> Store[Store Settings Context]
    Customer --> Auth[Auth Context]
    Admin --> Auth
    Auth --> Client[API Client]
    Customer --> Client
    Admin --> Client
    Client --> API[/ASP.NET API/]
```

- Auth token در نسخه فعلی در `localStorage` قرار می‌گیرد.
- سبد و علاقه‌مندی‌ها برای تجربه سریع در مرورگر پایدار می‌شوند.
- تنظیمات عمومی فروشگاه از API بارگذاری و در `StoreContext` بین هدر و footer مشترک می‌شوند.
- صفحه‌های route-level به‌صورت lazy chunk بارگذاری می‌شوند تا باندل اولیه کوچک بماند.
- `ProtectedRoute` نقش و ورود را قبل از نمایش dashboard کنترل می‌کند؛ کنترل اصلی امنیت همچنان در API است.
- CSS اختصاصی تمام layoutهای RTL و breakpointها را مدیریت می‌کند.

## 6. جریان یک درخواست محافظت‌شده

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant W as React
    participant A as API Client
    participant J as JWT Middleware
    participant E as Endpoint
    participant D as Database

    U->>W: انتخاب بخش محافظت‌شده
    W->>A: درخواست داده
    A->>J: HTTP + Bearer Token
    J->>J: بررسی امضا، issuer، audience و expiry
    alt token معتبر و role مجاز
        J->>E: ClaimsPrincipal
        E->>D: EF Core Query
        D-->>E: داده
        E-->>W: 200 JSON
    else نامعتبر یا فاقد مجوز
        J-->>W: 401 یا 403
    end
```

## 7. مرزهای امنیت و اعتماد

- هر ورودی مرورگر غیرقابل اعتماد است؛ قیمت و مبلغ سفارش فقط از محصول سرور محاسبه می‌شود.
- نقش ارسال‌شده از frontend معتبر نیست؛ role از claim امضاشده و policy سرور خوانده می‌شود.
- مسیرهای `/api/admin/*` به policy `Admin` نیاز دارند.
- داده شخصی، token و secret نباید در log یا repository ثبت شوند.
- API ورود limiter حافظه‌ای IP + نام کاربری دارد؛ reverse proxy همچنان مرز rate limit سراسری، TLS، headerهای امنیتی و محدودسازی اندازه درخواست است.
- سرویس پرداخت آینده باید webhook امضاشده، idempotency و تطبیق مبلغ سمت سرور داشته باشد.

## 8. ویژگی‌های کیفیتی

| ویژگی | وضعیت فعلی | مسیر رشد |
|---|---|---|
| قابلیت استفاده | RTL، responsive، فونت محلی | تست دسترس‌پذیری خودکار |
| امنیت | JWT، PBKDF2، role policy، login throttle | HttpOnly cookie/refresh، limiter توزیع‌شده، MFA ادمین |
| کارایی | SPA و queryهای AsNoTracking | pagination، caching، CDN، image optimization |
| پایداری | SQLite تک‌نمونه | PostgreSQL/SQL Server، migration و HA |
| مشاهده‌پذیری | logging پایه ASP.NET | structured logs، tracing، metrics و alerts |
| تست‌پذیری | build و E2E smoke | unit، integration و CI کامل |

## 9. تصمیم‌های معماری

### ADR-001: React SPA + ASP.NET Core API

- تصمیم: جداسازی UI و API با قرارداد JSON
- دلیل: توسعه مستقل dashboardها، امکان app موبایل آینده و استفاده از اکوسیستم .NET
- پیامد: نیاز به مدیریت CORS، auth token و deployment دو artifact

### ADR-002: SQLite برای نسخه اولیه

- تصمیم: SQLite + EF Core برای اجرای بدون زیرساخت جانبی
- دلیل: راه‌اندازی و تحویل سریع، مناسب demo و نصب تک‌نمونه
- پیامد: برای چند replica و بار بالاتر باید موتور داده تغییر کند

### ADR-003: نمودارهای Mermaid در Git

- تصمیم: نگهداری diagram-as-code
- دلیل: نمایش مستقیم GitHub، diff‌پذیری و همگام‌سازی ساده با کد
- پیامد: syntax نمودارها باید در PR بررسی شود

## 10. معماری هدف Production

```mermaid
flowchart LR
    Client[Client] --> CDN[CDN and WAF]
    CDN --> Web[React Static Hosting]
    CDN --> Gateway[API Gateway / Reverse Proxy]
    Gateway --> API1[API Replica 1]
    Gateway --> API2[API Replica 2]
    API1 --> DB[(Managed SQL Database)]
    API2 --> DB
    API1 --> Queue[Outbox / Message Queue]
    API2 --> Queue
    Queue --> Worker[Notification Worker]
    API1 --> Pay[Payment Provider]
    API2 --> Pay
    API1 --> Obs[Logs Metrics Traces]
    API2 --> Obs
```

این نمودار هدف آینده است و همه اجزای آن در نسخه جاری پیاده نشده‌اند.
