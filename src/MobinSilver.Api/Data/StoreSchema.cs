using Microsoft.EntityFrameworkCore;
using MobinSilver.Api.Models;

namespace MobinSilver.Api.Data;

public static class StoreSchema
{
    public static void Ensure(AppDbContext db)
    {
        db.Database.ExecuteSqlRaw(@"CREATE TABLE IF NOT EXISTS ""StoreSettings"" (
            ""Id"" INTEGER NOT NULL CONSTRAINT ""PK_StoreSettings"" PRIMARY KEY AUTOINCREMENT,
            ""StoreName"" TEXT NOT NULL,
            ""SupportPhone"" TEXT NOT NULL,
            ""SupportEmail"" TEXT NOT NULL,
            ""Address"" TEXT NOT NULL,
            ""Announcement"" TEXT NOT NULL,
            ""OrdersEnabled"" INTEGER NOT NULL,
            ""UpdatedAt"" TEXT NOT NULL
        );");
        db.Database.ExecuteSqlRaw(@"CREATE TABLE IF NOT EXISTS ""NewsletterSubscriptions"" (
            ""Id"" INTEGER NOT NULL CONSTRAINT ""PK_NewsletterSubscriptions"" PRIMARY KEY AUTOINCREMENT,
            ""Email"" TEXT NOT NULL,
            ""CreatedAt"" TEXT NOT NULL
        );");
        db.Database.ExecuteSqlRaw("CREATE UNIQUE INDEX IF NOT EXISTS \"IX_NewsletterSubscriptions_Email\" ON \"NewsletterSubscriptions\" (\"Email\");");

        if (!db.StoreSettings.Any())
        {
            db.StoreSettings.Add(new StoreSetting());
            db.SaveChanges();
        }
    }
}
