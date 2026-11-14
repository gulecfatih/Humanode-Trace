using HumanodeTracker.Data;
using HumanodeTracker.Repositories;
using HumanodeTracker.Services;
using Microsoft.Extensions.FileProviders;

// Enable snake_case to PascalCase column mapping across Dapper queries globally
Dapper.DefaultTypeMap.MatchNamesWithUnderscores = true;

var builder = WebApplication.CreateBuilder(args);

// Configure Kestrel port to 3000
var port = builder.Configuration.GetValue<int>("Port", 3000);
builder.WebHost.ConfigureKestrel(options =>
{
    options.ListenAnyIP(port);
});

// Add services
builder.Services.AddControllers();
builder.Services.AddHttpClient<HumanodeSidecarClient>();

// Repositories (Pure Concrete Classes, Zero Interfaces)
builder.Services.AddSingleton<SqliteConnectionFactory>();
builder.Services.AddSingleton<SystemConfigRepository>();
builder.Services.AddSingleton<PriceRepository>();
builder.Services.AddSingleton<LabelRepository>();
builder.Services.AddSingleton<StatsRepository>();
builder.Services.AddSingleton<TransactionRepository>();
builder.Services.AddSingleton<BlockRepository>();
builder.Services.AddSingleton<WhaleRepository>();
builder.Services.AddSingleton<LeaderboardRepository>();
builder.Services.AddSingleton<TokenRepository>();
builder.Services.AddSingleton<TokenomicsRepository>();
builder.Services.AddSingleton<ValidatorRepository>();
builder.Services.AddSingleton<WalletRepository>();
builder.Services.AddSingleton<DirectoryRepository>();
builder.Services.AddSingleton<GovernanceRepository>();
builder.Services.AddSingleton<EqualityRepository>();
builder.Services.AddSingleton<ClusterRepository>();
builder.Services.AddSingleton<DexRepository>();
builder.Services.AddSingleton<TaxReportRepository>();
builder.Services.AddSingleton<TimeMachineRepository>();
builder.Services.AddSingleton<QuerySandboxRepository>();
builder.Services.AddSingleton<BiomapperRepository>();
builder.Services.AddSingleton<BridgeRepository>();
builder.Services.AddSingleton<HodlersRepository>();
builder.Services.AddSingleton<LocalizationRepository>();
builder.Services.AddSingleton<MethodDecoderService>();

// Background Services
builder.Services.AddSingleton<BlockchainIndexerService>();
builder.Services.AddHostedService(sp => sp.GetRequiredService<BlockchainIndexerService>());
builder.Services.AddHostedService<TokenomicsSyncService>();

// CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

app.UseCors();
app.UseRouting();

// Locate static directory (../out or out or ../public)
var staticDir = Path.GetFullPath(Path.Combine(app.Environment.ContentRootPath, "..", "out"));
if (!Directory.Exists(staticDir))
{
    staticDir = Path.GetFullPath(Path.Combine(app.Environment.ContentRootPath, "out"));
    if (!Directory.Exists(staticDir))
    {
        staticDir = Path.GetFullPath(Path.Combine(app.Environment.ContentRootPath, "..", "public"));
    }
}

if (Directory.Exists(staticDir))
{
    var fileProvider = new PhysicalFileProvider(staticDir);

    app.UseDefaultFiles(new DefaultFilesOptions
    {
        FileProvider = fileProvider,
        RequestPath = ""
    });

    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = fileProvider,
        RequestPath = "",
        OnPrepareResponse = ctx =>
        {
            if (ctx.File.Name.EndsWith(".html"))
            {
                ctx.Context.Response.Headers.CacheControl = "no-cache, no-store, must-revalidate";
            }
            else if (ctx.File.Name.EndsWith(".js") || ctx.File.Name.EndsWith(".css"))
            {
                ctx.Context.Response.Headers.CacheControl = "public, max-age=31536000, immutable";
            }
        }
    });
}

app.MapControllers();

// If static dir exists, map SPA fallback
if (Directory.Exists(staticDir) && File.Exists(Path.Combine(staticDir, "index.html")))
{
    var fileProvider = new PhysicalFileProvider(staticDir);
    app.MapFallback(async context =>
    {
        if (context.Request.Path.StartsWithSegments("/api"))
        {
            context.Response.StatusCode = 404;
            context.Response.ContentType = "application/json; charset=utf-8";
            await context.Response.WriteAsJsonAsync(new { error = "Invalid API route", path = context.Request.Path.Value });
            return;
        }

        var indexPath = Path.Combine(staticDir, "index.html");
        context.Response.ContentType = "text/html; charset=utf-8";
        await context.Response.SendFileAsync(indexPath);
    });
}

app.Run();
