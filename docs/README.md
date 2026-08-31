# مستندات فنی مبین سیلور

این پوشه مرجع فنی و عملیاتی پروژه است. هر Pull Request که رفتار، مدل داده، API، استقرار یا سناریوی کسب‌وکار را تغییر می‌دهد باید سند مرتبط را نیز به‌روزرسانی کند.

## فهرست اسناد

| سند | مخاطب | هدف |
|---|---|---|
| [معماری](architecture.md) | توسعه‌دهنده و معمار | مرز سامانه، اجزا، جریان داده و تصمیم‌های فنی |
| [مدل داده](data-model.md) | Backend و DBA | ERD، موجودیت‌ها، قیود و تکامل schema |
| [مرجع API](api-reference.md) | Frontend، Backend و QA | endpointها، سطح دسترسی و قراردادها |
| [امنیت](security.md) | توسعه، DevOps و مدیر محصول | threat model، اسرار، احراز هویت و hardening |
| [تست](testing.md) | QA و توسعه | هرم تست، سناریوها و معیار پذیرش |
| [مجله](blog.md) | تحریریه، Frontend و Backend | مدل داده، قالب محتوا و گردش انتشار |
| [عملیات و پشتیبانی](operations-support.md) | پشتیبانی و DevOps | مانیتورینگ، رخداد، بکاپ و runbook |
| [نقشه راه](roadmap.md) | مالک محصول و تیم فنی | شکاف‌های production و اولویت توسعه |
| [Use Caseها](diagrams/use-cases.md) | محصول، تحلیل و توسعه | بازیگران، قابلیت‌ها و شرح سناریوها |
| [Activity Diagramها](diagrams/activity-diagrams.md) | تحلیل، توسعه و QA | جریان‌های تصمیم‌گیری کسب‌وکار |
| [Sequence Diagramها](diagrams/sequence-diagrams.md) | توسعه و یکپارچه‌سازی | تعامل زمانی اجزا و سرویس‌های بیرونی |

## نمودارهای اصلی

- System Context و Container: [architecture.md](architecture.md)
- ERD: [data-model.md](data-model.md)
- Use Case: [diagrams/use-cases.md](diagrams/use-cases.md)
- Activity: [diagrams/activity-diagrams.md](diagrams/activity-diagrams.md)
- Sequence: [diagrams/sequence-diagrams.md](diagrams/sequence-diagrams.md)
- وضعیت سفارش: [diagrams/activity-diagrams.md](diagrams/activity-diagrams.md#نمودار-وضعیت-سفارش)
- Deployment: [deployment.md در ریشه پروژه](../deployment.md)

تمام نمودارها با Mermaid نگهداری می‌شوند تا GitHub آن‌ها را مستقیم نمایش دهد، تغییرشان در code review قابل مشاهده باشد و نیاز به فایل باینری اختصاصی نداشته باشند.

## قواعد نگهداری مستندات

1. نام route، فیلد، نقش و وضعیت باید عین کد باشد.
2. قابلیت آینده باید صریحاً با برچسب «آینده» یا «پیشنهادی» مشخص شود.
3. secret، token، اطلاعات شخصی واقعی و آدرس production در مثال‌ها قرار نگیرد.
4. تغییر شکستن قرارداد API باید همراه برنامه migration و نسخه‌بندی باشد.
5. تاریخچه تصمیم مهم معماری در بخش تصمیم‌های [architecture.md](architecture.md) ثبت شود.
