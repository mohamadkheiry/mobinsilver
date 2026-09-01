# نمودارهای Sequence

## 1. ورود و صدور JWT

```mermaid
sequenceDiagram
    autonumber
    actor U as کاربر
    participant W as React Login
    participant A as Auth Endpoint
    participant D as Database
    participant P as PasswordService
    participant T as TokenService

    U->>W: نام کاربری و رمز
    W->>A: POST /api/auth/login
    A->>D: جست‌وجو با username یا email
    D-->>A: AppUser یا null
    A->>P: Verify(password, hash, salt)
    P-->>A: true یا false
    alt معتبر
        A->>T: Create(user)
        T-->>A: JWT signed
        A-->>W: 200 token + user
        W->>W: ذخیره نشست و redirect با role
    else نامعتبر
        A->>A: افزایش شمارنده IP + username
        alt پنج شکست قبلی
            A-->>W: 429 محدودسازی ۱۵ دقیقه
        else زیر آستانه
            A-->>W: 401 پیام عمومی
        end
        W-->>U: نمایش خطای ورود
    end
```

## 2. دریافت محصولات و جزئیات

```mermaid
sequenceDiagram
    autonumber
    actor U as بازدیدکننده
    participant W as React Store
    participant A as Products API
    participant D as EF Core / Database

    U->>W: ورود به فروشگاه
    W->>A: GET /api/products?category&search&featured
    A->>D: AsNoTracking + filters + sort
    D-->>A: Products
    A-->>W: 200 JSON
    W-->>U: کارت‌های محصول
    U->>W: انتخاب محصول
    W->>A: GET /api/products/{slug}
    A->>D: Find by slug or id
    alt موجود
        D-->>A: Product
        A-->>W: 200 Product
        W-->>U: جزئیات و افزودن به سبد
    else ناموجود
        D-->>A: null
        A-->>W: 404
        W-->>U: صفحه یافت نشد
    end
```

## 3. ثبت سفارش فعلی

```mermaid
sequenceDiagram
    autonumber
    actor C as مشتری
    participant W as React Checkout
    participant J as JWT Middleware
    participant O as Orders Endpoint
    participant D as Database

    C->>W: تأیید نشانی و سبد
    W->>J: POST /api/orders + Bearer Token
    J->>J: validate token
    J->>O: UserId claim + request
    O->>O: بررسی سبد غیرخالی
    O->>D: خواندن محصولات و موجودی
    D-->>O: Products
    O->>O: کنترل Quantity و Stock
    O->>O: محاسبه قیمت معتبر سمت سرور
    O->>D: Insert Order/Items + Update Stock
    alt موفق
        D-->>O: commit
        O-->>W: 200 id, orderNumber, total, status
        W->>W: پاک‌کردن سبد
        W-->>C: تأیید سفارش
    else نامعتبر یا موجودی ناکافی
        O-->>W: 400 message
        W-->>C: نمایش خطا و حفظ سبد
    end
```

## 4. مشاهده سفارش‌های مشتری

```mermaid
sequenceDiagram
    autonumber
    actor C as مشتری
    participant W as Customer Dashboard
    participant J as JWT Middleware
    participant A as Account Endpoint
    participant D as Database

    C->>W: بازکردن داشبورد
    W->>J: GET /api/account/orders
    J->>A: UserId claim
    A->>D: Orders WHERE UserId = claim + Items
    D-->>A: فقط سفارش‌های همین کاربر
    A-->>W: 200 Orders
    W-->>C: آخرین سفارش و تاریخچه
```

## 5. تغییر وضعیت توسط مدیر

```mermaid
sequenceDiagram
    autonumber
    actor M as مدیر
    participant W as Admin Dashboard
    participant J as JWT + Admin Policy
    participant A as Admin Orders API
    participant D as Database
    participant N as Notification آینده

    M->>W: انتخاب وضعیت جدید
    W->>J: PATCH /api/admin/orders/{id}/status
    J->>J: validate token and Admin role
    alt role مجاز
        J->>A: id + status
        A->>D: Find Order + Items
        alt سفارش موجود
            D-->>A: Order
            A->>A: whitelist و terminal guard
            opt وضعیت جدید لغو شده است
                A->>D: Restore Product Stock
            end
            A->>D: Update Status
            D-->>A: commit
            A-->>W: 200 Order
            A-->>N: اعلان تغییر وضعیت - آینده
            W-->>M: جدول به‌روز
        else ناموجود
            D-->>A: null
            A-->>W: 404
        end
    else فاقد مجوز
        J-->>W: 401 یا 403
    end
```

## 6. مدیریت محصول

```mermaid
sequenceDiagram
    autonumber
    actor M as مدیر
    participant W as Admin Products
    participant J as Admin Policy
    participant A as Admin Products API
    participant D as Database

    M->>W: ثبت فرم محصول
    W->>J: POST یا PUT + JWT
    J->>A: Authorized request
    A->>A: Trim and map ProductRequest
    A->>D: Insert یا Update
    alt موفق
        D-->>A: Saved Product
        A-->>W: 201 یا 200
        W->>A: GET /api/products
        A-->>W: فهرست تازه
        W-->>M: نمایش نتیجه
    else slug تکراری یا خطای داده
        D-->>A: Persistence error
        A-->>W: خطای کنترل‌شده پیشنهادی
        W-->>M: حفظ فرم و نمایش خطا
    end
```

## 7. پرداخت امن پیشنهادی آینده

```mermaid
sequenceDiagram
    autonumber
    actor C as مشتری
    participant W as Checkout
    participant A as Mobin Silver API
    participant D as Database
    participant P as Payment Gateway
    participant N as Notification

    C->>W: انتخاب پرداخت
    W->>A: POST /payments با Idempotency-Key
    A->>D: ایجاد PaymentAttempt Pending
    A->>P: ایجاد تراکنش با مبلغ سرور و callback
    P-->>A: authority + redirectUrl
    A-->>W: redirectUrl
    W->>P: هدایت مشتری
    C->>P: تکمیل پرداخت
    P-->>A: Callback/Webhook signed
    A->>A: بررسی امضا، مبلغ، order و replay
    A->>P: Verify transaction server-to-server
    P-->>A: نتیجه قطعی
    alt موفق و پردازش‌نشده
        A->>D: Transaction: Payment=Success, Order=Paid
        D-->>A: commit
        A->>N: ارسال رسید
        A-->>W: نتیجه موفق
    else تکراری
        A->>D: خواندن نتیجه قبلی
        A-->>W: همان نتیجه بدون ثبت دوباره
    else ناموفق یا مشکوک
        A->>D: ثبت failure/audit بدون Paid کردن سفارش
        A-->>W: نتیجه ناموفق و شناسه پیگیری
    end
```

## 8. قیمت لحظه‌ای فلزات پیشنهادی

```mermaid
sequenceDiagram
    participant S as Scheduled Worker
    participant P as Trusted Price Provider
    participant D as Price Cache/Database
    participant A as Products API
    participant W as Storefront

    S->>P: دریافت قیمت با authentication
    P-->>S: price + timestamp + source
    S->>S: validate freshness and bounds
    S->>D: ذخیره snapshot معتبر
    W->>A: درخواست قیمت/محصول
    A->>D: latest valid snapshot
    D-->>A: price metadata
    A-->>W: price + lastUpdatedAt
```
