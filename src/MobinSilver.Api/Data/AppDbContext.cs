using Microsoft.EntityFrameworkCore;
using MobinSilver.Api.Models;

namespace MobinSilver.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Product> Products => Set<Product>();
    public DbSet<AppUser> Users => Set<AppUser>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<BlogPost> BlogPosts => Set<BlogPost>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Product>().HasIndex(x => x.Slug).IsUnique();
        modelBuilder.Entity<AppUser>().HasIndex(x => x.Username).IsUnique();
        modelBuilder.Entity<AppUser>().HasIndex(x => x.Email).IsUnique();
        modelBuilder.Entity<Order>().HasIndex(x => x.OrderNumber).IsUnique();
        modelBuilder.Entity<BlogPost>().HasIndex(x => x.Slug).IsUnique();
        modelBuilder.Entity<BlogPost>().HasIndex(x => new { x.IsPublished, x.PublishedAt });
        modelBuilder.Entity<Product>().Property(x => x.Price).HasPrecision(18, 0);
        modelBuilder.Entity<Order>().Property(x => x.Total).HasPrecision(18, 0);
        modelBuilder.Entity<OrderItem>().Property(x => x.UnitPrice).HasPrecision(18, 0);
    }
}
