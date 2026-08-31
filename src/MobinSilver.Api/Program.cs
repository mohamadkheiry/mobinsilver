using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MobinSilver.Api.Data;
using MobinSilver.Api.Models;
using MobinSilver.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("Default")));
builder.Services.AddScoped<TokenService>();
builder.Services.AddCors(options => options.AddPolicy("Frontend", policy =>
    policy.WithOrigins("http://localhost:5173", "http://127.0.0.1:5173", "https://mobinsilver.00f.ir", "http://mobinsilver.00f.ir")
        .AllowAnyHeader().AllowAnyMethod()));
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto | ForwardedHeaders.XForwardedHost;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

var jwtKey = Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!);
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(jwtKey),
            ClockSkew = TimeSpan.Zero
        };
    });
builder.Services.AddAuthorization(options =>
    options.AddPolicy("Admin", policy => policy.RequireRole("Admin")));

var app = builder.Build();
Directory.CreateDirectory(Path.Combine(app.Environment.ContentRootPath, "App_Data"));
app.UseForwardedHeaders();
app.UseCors("Frontend");
app.UseDefaultFiles();
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
    BlogSeed.EnsureSchema(db);
    SeedData(db);
    BlogSeed.Seed(db);
}

app.MapGet("/api/health", () => Results.Ok(new { status = "healthy", service = "MobinSilver.Api" }));

app.MapGet("/api/products", async (AppDbContext db, string? category, string? search, bool? featured) =>
{
    var query = db.Products.AsNoTracking().AsQueryable();
    if (!string.IsNullOrWhiteSpace(category) && category != "all") query = query.Where(x => x.Category == category);
    if (!string.IsNullOrWhiteSpace(search)) query = query.Where(x => x.Name.Contains(search) || x.Description.Contains(search));
    if (featured is not null) query = query.Where(x => x.Featured == featured);
    return Results.Ok(await query.OrderByDescending(x => x.Featured).ThenByDescending(x => x.CreatedAt).ToListAsync());
});

app.MapGet("/api/products/{slug}", async (AppDbContext db, string slug) =>
{
    var product = await db.Products.AsNoTracking().FirstOrDefaultAsync(x => x.Slug == slug || x.Id.ToString() == slug);
    return product is null ? Results.NotFound() : Results.Ok(product);
});

app.MapGet("/api/blog", async (AppDbContext db, string? category, string? search, bool? featured) =>
{
    var now = DateTime.UtcNow;
    var query = db.BlogPosts.AsNoTracking().Where(x => x.IsPublished && x.PublishedAt != null && x.PublishedAt <= now);
    if (!string.IsNullOrWhiteSpace(category) && category != "all") query = query.Where(x => x.Category == category);
    if (!string.IsNullOrWhiteSpace(search))
    {
        var term = search.Trim();
        query = query.Where(x => x.Title.Contains(term) || x.Excerpt.Contains(term) || x.Tags.Contains(term));
    }
    if (featured is not null) query = query.Where(x => x.Featured == featured);
    return Results.Ok(await query.OrderByDescending(x => x.Featured).ThenByDescending(x => x.PublishedAt).ToListAsync());
});

app.MapGet("/api/blog/{slug}", async (AppDbContext db, string slug) =>
{
    var now = DateTime.UtcNow;
    var post = await db.BlogPosts.AsNoTracking().FirstOrDefaultAsync(x =>
        (x.Slug == slug || x.Id.ToString() == slug) && x.IsPublished && x.PublishedAt != null && x.PublishedAt <= now);
    return post is null ? Results.NotFound(new { message = "مقاله موردنظر پیدا نشد." }) : Results.Ok(post);
});

app.MapPost("/api/auth/login", async (LoginRequest request, AppDbContext db, TokenService tokens) =>
{
    var login = request.Username.Trim().ToLowerInvariant();
    var user = await db.Users.FirstOrDefaultAsync(x => x.Username.ToLower() == login || x.Email.ToLower() == login);
    if (user is null || !PasswordService.Verify(request.Password, user.PasswordHash, user.PasswordSalt))
        return Results.Json(new { message = "نام کاربری یا رمز عبور صحیح نیست." }, statusCode: 401);
    return Results.Ok(ToAuthResponse(user, tokens.Create(user)));
});

app.MapPost("/api/auth/register", async (RegisterRequest request, AppDbContext db, TokenService tokens) =>
{
    var username = request.Email.Trim().ToLowerInvariant();
    if (await db.Users.AnyAsync(x => x.Email == username || x.Username == username))
        return Results.BadRequest(new { message = "این ایمیل قبلاً ثبت شده است." });
    var (hash, salt) = PasswordService.Hash(request.Password);
    var user = new AppUser
    {
        Username = username, Email = username, FullName = request.FullName.Trim(), Phone = request.Phone?.Trim() ?? "",
        PasswordHash = hash, PasswordSalt = salt, Role = "Customer"
    };
    db.Users.Add(user);
    await db.SaveChangesAsync();
    return Results.Ok(ToAuthResponse(user, tokens.Create(user)));
});

app.MapGet("/api/account/profile", async (ClaimsPrincipal principal, AppDbContext db) =>
{
    var uid = UserId(principal);
    var user = await db.Users.AsNoTracking().FirstAsync(x => x.Id == uid);
    return Results.Ok(new { user.Id, user.Username, user.FullName, user.Email, user.Phone, user.Address, user.Role });
}).RequireAuthorization();
app.MapPut("/api/account/profile", async (ProfileRequest request, ClaimsPrincipal principal, AppDbContext db) =>
{
    var uid = UserId(principal);
    var user = await db.Users.FirstAsync(x => x.Id == uid);
    user.FullName = request.FullName.Trim();
    user.Phone = request.Phone.Trim();
    user.Address = request.Address.Trim();
    await db.SaveChangesAsync();
    return Results.Ok(new { message = "اطلاعات حساب ذخیره شد." });
}).RequireAuthorization();
app.MapGet("/api/account/orders", async (ClaimsPrincipal principal, AppDbContext db) =>
{
    var uid = UserId(principal);
    var orders = await db.Orders.AsNoTracking().Include(x => x.Items).Where(x => x.UserId == uid)
        .OrderByDescending(x => x.CreatedAt).ToListAsync();
    return Results.Ok(orders);
}).RequireAuthorization();

app.MapPost("/api/orders", async (CreateOrderRequest request, ClaimsPrincipal principal, AppDbContext db) =>
{
    if (request.Items.Count == 0) return Results.BadRequest(new { message = "سبد خرید خالی است." });
    var productIds = request.Items.Select(x => x.ProductId).Distinct().ToList();
    var products = await db.Products.Where(x => productIds.Contains(x.Id)).ToDictionaryAsync(x => x.Id);
    if (products.Count != productIds.Count) return Results.BadRequest(new { message = "یکی از محصولات معتبر نیست." });
    if (request.Items.Any(x => x.Quantity < 1 || products[x.ProductId].Stock < x.Quantity))
        return Results.BadRequest(new { message = "موجودی یکی از محصولات کافی نیست." });
    var order = new Order
    {
        UserId = UserId(principal),
        OrderNumber = $"MS-{DateTime.UtcNow:yyMMdd}-{Random.Shared.Next(1000, 9999)}",
        CustomerName = request.CustomerName.Trim(), Phone = request.Phone.Trim(), Address = request.Address.Trim(),
        PaymentMethod = request.PaymentMethod, Status = "در انتظار بررسی", CreatedAt = DateTime.UtcNow
    };
    foreach (var item in request.Items)
    {
        var product = products[item.ProductId];
        product.Stock -= item.Quantity;
        order.Items.Add(new OrderItem { ProductId = product.Id, ProductName = product.Name, Quantity = item.Quantity, UnitPrice = product.Price });
    }
    order.Total = order.Items.Sum(x => x.UnitPrice * x.Quantity);
    db.Orders.Add(order);
    await db.SaveChangesAsync();
    return Results.Ok(new { order.Id, order.OrderNumber, order.Total, order.Status });
}).RequireAuthorization();

app.MapGet("/api/admin/dashboard", async (AppDbContext db) =>
{
    var today = DateTime.UtcNow.Date;
    var orders = await db.Orders.AsNoTracking().ToListAsync();
    var products = await db.Products.AsNoTracking().ToListAsync();
    var customers = await db.Users.AsNoTracking().CountAsync(x => x.Role == "Customer");
    var chart = Enumerable.Range(0, 7).Select(offset =>
    {
        var date = today.AddDays(offset - 6);
        var total = orders.Where(x => x.CreatedAt.Date == date).Sum(x => x.Total);
        return new { date, total };
    });
    return Results.Ok(new
    {
        salesToday = orders.Where(x => x.CreatedAt.Date == today).Sum(x => x.Total),
        newOrders = orders.Count(x => x.Status == "در انتظار بررسی"),
        lowStock = products.Count(x => x.Stock <= 5), activeCustomers = customers,
        silverPrice = 3_680_000, goldPrice = 8_950_000, chart
    });
}).RequireAuthorization("Admin");
app.MapGet("/api/admin/orders", async (AppDbContext db) => Results.Ok(await db.Orders.AsNoTracking().Include(x => x.Items)
    .OrderByDescending(x => x.CreatedAt).ToListAsync())).RequireAuthorization("Admin");
app.MapMethods("/api/admin/orders/{id:int}/status", new[] { "PATCH" }, async (int id, UpdateStatusRequest request, AppDbContext db) =>
{
    var order = await db.Orders.FindAsync(id);
    if (order is null) return Results.NotFound();
    order.Status = request.Status.Trim();
    await db.SaveChangesAsync();
    return Results.Ok(order);
}).RequireAuthorization("Admin");
app.MapGet("/api/admin/customers", async (AppDbContext db) => Results.Ok(await db.Users.AsNoTracking().Where(x => x.Role == "Customer")
    .Select(x => new { x.Id, x.FullName, x.Email, x.Phone, x.CreatedAt, Orders = x.Orders.Count }).ToListAsync())).RequireAuthorization("Admin");
app.MapPost("/api/admin/products", async (ProductRequest request, AppDbContext db) =>
{
    var product = ApplyProduct(new Product { CreatedAt = DateTime.UtcNow }, request);
    db.Products.Add(product);
    await db.SaveChangesAsync();
    return Results.Created($"/api/products/{product.Slug}", product);
}).RequireAuthorization("Admin");
app.MapPut("/api/admin/products/{id:int}", async (int id, ProductRequest request, AppDbContext db) =>
{
    var product = await db.Products.FindAsync(id);
    if (product is null) return Results.NotFound();
    ApplyProduct(product, request);
    await db.SaveChangesAsync();
    return Results.Ok(product);
}).RequireAuthorization("Admin");
app.MapDelete("/api/admin/products/{id:int}", async (int id, AppDbContext db) =>
{
    var product = await db.Products.FindAsync(id);
    if (product is null) return Results.NotFound();
    db.Products.Remove(product);
    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization("Admin");

app.MapGet("/api/admin/blog", async (AppDbContext db) => Results.Ok(await db.BlogPosts.AsNoTracking()
    .OrderByDescending(x => x.UpdatedAt).ToListAsync())).RequireAuthorization("Admin");
app.MapPost("/api/admin/blog", async (BlogPostRequest request, AppDbContext db) =>
{
    var validation = ValidateBlogPost(request);
    if (validation is not null) return Results.BadRequest(new { message = validation });
    if (await db.BlogPosts.AnyAsync(x => x.Slug == request.Slug.Trim()))
        return Results.Conflict(new { message = "این نامک قبلاً استفاده شده است." });
    var post = ApplyBlogPost(new BlogPost { CreatedAt = DateTime.UtcNow }, request);
    db.BlogPosts.Add(post);
    await db.SaveChangesAsync();
    return Results.Created($"/api/blog/{post.Slug}", post);
}).RequireAuthorization("Admin");
app.MapPut("/api/admin/blog/{id:int}", async (int id, BlogPostRequest request, AppDbContext db) =>
{
    var validation = ValidateBlogPost(request);
    if (validation is not null) return Results.BadRequest(new { message = validation });
    var post = await db.BlogPosts.FindAsync(id);
    if (post is null) return Results.NotFound();
    var slug = request.Slug.Trim();
    if (await db.BlogPosts.AnyAsync(x => x.Id != id && x.Slug == slug))
        return Results.Conflict(new { message = "این نامک قبلاً استفاده شده است." });
    ApplyBlogPost(post, request);
    await db.SaveChangesAsync();
    return Results.Ok(post);
}).RequireAuthorization("Admin");
app.MapDelete("/api/admin/blog/{id:int}", async (int id, AppDbContext db) =>
{
    var post = await db.BlogPosts.FindAsync(id);
    if (post is null) return Results.NotFound();
    db.BlogPosts.Remove(post);
    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization("Admin");

app.MapFallbackToFile("index.html");

app.Run();

static int UserId(ClaimsPrincipal principal) => int.Parse(principal.FindFirstValue(ClaimTypes.NameIdentifier)!);
static object ToAuthResponse(AppUser user, string token) => new
{
    token, user = new { user.Id, user.Username, user.FullName, user.Email, user.Phone, user.Address, user.Role }
};
static Product ApplyProduct(Product product, ProductRequest request)
{
    product.Name = request.Name.Trim(); product.Slug = request.Slug.Trim(); product.Category = request.Category.Trim();
    product.Description = request.Description.Trim(); product.Price = request.Price; product.ImageUrl = request.ImageUrl.Trim();
    product.Stock = request.Stock; product.Purity = request.Purity.Trim(); product.Weight = request.Weight.Trim(); product.Featured = request.Featured;
    return product;
}
static BlogPost ApplyBlogPost(BlogPost post, BlogPostRequest request)
{
    var now = DateTime.UtcNow;
    post.Title = request.Title.Trim();
    post.Slug = request.Slug.Trim().ToLowerInvariant();
    post.Excerpt = request.Excerpt.Trim();
    post.Content = request.Content.Trim();
    post.CoverImageUrl = request.CoverImageUrl.Trim();
    post.Category = request.Category.Trim();
    post.Author = string.IsNullOrWhiteSpace(request.Author) ? "تحریریه مبین سیلور" : request.Author.Trim();
    post.Tags = request.Tags.Trim();
    post.ReadingMinutes = request.ReadingMinutes;
    post.Featured = request.Featured;
    post.IsPublished = request.IsPublished;
    post.PublishedAt = request.IsPublished ? request.PublishedAt ?? post.PublishedAt ?? now : request.PublishedAt;
    post.UpdatedAt = now;
    return post;
}
static string? ValidateBlogPost(BlogPostRequest request)
{
    if (string.IsNullOrWhiteSpace(request.Title) || request.Title.Trim().Length < 5) return "عنوان مقاله باید دست‌کم ۵ نویسه باشد.";
    if (string.IsNullOrWhiteSpace(request.Slug) || request.Slug.Any(ch => !((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || char.IsDigit(ch) || ch == '-'))) return "نامک فقط می‌تواند شامل حروف انگلیسی، عدد و خط تیره باشد.";
    if (string.IsNullOrWhiteSpace(request.Excerpt) || request.Excerpt.Trim().Length < 20) return "خلاصه مقاله باید دست‌کم ۲۰ نویسه باشد.";
    if (string.IsNullOrWhiteSpace(request.Content) || request.Content.Trim().Length < 80) return "متن مقاله باید دست‌کم ۸۰ نویسه باشد.";
    if (request.ReadingMinutes is < 1 or > 120) return "زمان مطالعه باید بین ۱ تا ۱۲۰ دقیقه باشد.";
    return null;
}
static void SeedData(AppDbContext db)
{
    if (!db.Users.Any())
    {
        var (adminHash, adminSalt) = PasswordService.Hash("admin123");
        var (userHash, userSalt) = PasswordService.Hash("sara123");
        db.Users.AddRange(
            new AppUser { Username = "admin", Email = "admin@mobinsilver.ir", FullName = "مدیر فروشگاه", Role = "Admin", PasswordHash = adminHash, PasswordSalt = adminSalt },
            new AppUser { Username = "sara", Email = "sara@mobinsilver.ir", FullName = "سارا احمدی", Phone = "09121234567", Address = "تهران، خیابان ونک، پلاک ۱۲", Role = "Customer", PasswordHash = userHash, PasswordSalt = userSalt }
        );
        db.SaveChanges();
    }
    if (!db.Products.Any())
    {
        db.Products.AddRange(
            new Product { Name = "شمش نقره یک اونسی", Slug = "silver-bar-1oz", Category = "silver-bar", Description = "شمش نقره خالص با عیار ۹۹۹، مناسب سرمایه‌گذاری و هدیه.", Price = 3_680_000, ImageUrl = "/assets/silver-bar.png", Stock = 24, Purity = "۹۹۹", Weight = "۱ اونس", Featured = true },
            new Product { Name = "شمش نقره ۵۰ گرمی", Slug = "silver-bar-50g", Category = "silver-bar", Description = "شمش نقره ۵۰ گرمی پلمب‌شده همراه با شناسنامه اصالت.", Price = 5_420_000, ImageUrl = "/assets/silver-bar.png", Stock = 11, Purity = "۹۹۹", Weight = "۵۰ گرم", Featured = true },
            new Product { Name = "شمش نقره ۱۰۰ گرمی", Slug = "silver-bar-100g", Category = "silver-bar", Description = "شمش نقره ۱۰۰ گرمی با فاکتور رسمی و بسته‌بندی امن.", Price = 10_650_000, ImageUrl = "/assets/silver-bar.png", Stock = 6, Purity = "۹۹۹", Weight = "۱۰۰ گرم", Featured = false },
            new Product { Name = "انگشتر نقره عقیق سبز", Slug = "green-agate-ring", Category = "silver-jewelry", Description = "انگشتر دست‌ساز نقره با نگین عقیق سبز و قلم‌زنی ظریف ایرانی.", Price = 5_980_000, ImageUrl = "/assets/silver-ring.png", Stock = 8, Purity = "۹۲۵", Weight = "۱۲ گرم", Featured = true },
            new Product { Name = "انگشتر نقره سیاه‌قلم", Slug = "oxidized-silver-ring", Category = "silver-jewelry", Description = "انگشتر نقره سیاه‌قلم با پرداخت دست‌ساز و ضمانت عیار.", Price = 4_750_000, ImageUrl = "/assets/silver-ring.png", Stock = 14, Purity = "۹۲۵", Weight = "۱۰ گرم", Featured = true },
            new Product { Name = "گردنبند نقره ماه", Slug = "silver-moon-necklace", Category = "silver-jewelry", Description = "گردنبند ظریف نقره مناسب استفاده روزانه و هدیه.", Price = 2_890_000, ImageUrl = "/assets/silver-ring.png", Stock = 18, Purity = "۹۲۵", Weight = "۷ گرم", Featured = false },
            new Product { Name = "شمش طلای یک گرمی", Slug = "gold-bar-1g", Category = "gold-bar", Description = "شمش طلای ۲۴ عیار یک گرمی، پلمب‌شده و دارای کد اصالت.", Price = 8_950_000, ImageUrl = "/assets/gold-bar.png", Stock = 17, Purity = "۹۹۹٫۹", Weight = "۱ گرم", Featured = true },
            new Product { Name = "شمش طلای ۲٫۵ گرمی", Slug = "gold-bar-2-5g", Category = "gold-bar", Description = "شمش طلای ۲۴ عیار ۲٫۵ گرمی با بسته‌بندی هدیه.", Price = 22_150_000, ImageUrl = "/assets/gold-bar.png", Stock = 7, Purity = "۹۹۹٫۹", Weight = "۲٫۵ گرم", Featured = true },
            new Product { Name = "شمش طلای ۵ گرمی", Slug = "gold-bar-5g", Category = "gold-bar", Description = "شمش طلای سرمایه‌گذاری ۵ گرمی همراه فاکتور رسمی.", Price = 44_100_000, ImageUrl = "/assets/gold-bar.png", Stock = 4, Purity = "۹۹۹٫۹", Weight = "۵ گرم", Featured = false }
        );
        db.SaveChanges();
    }
    if (!db.Orders.Any())
    {
        var sara = db.Users.First(x => x.Username == "sara");
        var ring = db.Products.First(x => x.Slug == "green-agate-ring");
        var silver = db.Products.First(x => x.Slug == "silver-bar-1oz");
        db.Orders.AddRange(
            new Order { OrderNumber = "MS-140305-568791", UserId = sara.Id, CustomerName = sara.FullName, Phone = sara.Phone, Address = sara.Address, Total = ring.Price, Status = "در حال آماده‌سازی", CreatedAt = DateTime.UtcNow.AddHours(-5), Items = new() { new OrderItem { ProductId = ring.Id, ProductName = ring.Name, Quantity = 1, UnitPrice = ring.Price } } },
            new Order { OrderNumber = "MS-140302-557891", UserId = sara.Id, CustomerName = sara.FullName, Phone = sara.Phone, Address = sara.Address, Total = silver.Price, Status = "ارسال شده", CreatedAt = DateTime.UtcNow.AddDays(-3), Items = new() { new OrderItem { ProductId = silver.Id, ProductName = silver.Name, Quantity = 1, UnitPrice = silver.Price } } }
        );
        db.SaveChanges();
    }
}

record LoginRequest(string Username, string Password);
record RegisterRequest(string FullName, string Email, string Password, string? Phone);
record ProfileRequest(string FullName, string Phone, string Address);
record CreateOrderItemRequest(int ProductId, int Quantity);
record CreateOrderRequest(string CustomerName, string Phone, string Address, string PaymentMethod, List<CreateOrderItemRequest> Items);
record UpdateStatusRequest(string Status);
record ProductRequest(string Name, string Slug, string Category, string Description, decimal Price, string ImageUrl, int Stock, string Purity, string Weight, bool Featured);
record BlogPostRequest(string Title, string Slug, string Excerpt, string Content, string CoverImageUrl, string Category,
    string Author, string Tags, int ReadingMinutes, bool Featured, bool IsPublished, DateTime? PublishedAt);
