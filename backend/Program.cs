using HumanodeTracker.Data;
using HumanodeTracker.Repositories;
using HumanodeTracker.Services;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);

// Configure Kestrel port to 3000
var port = builder.Configuration.GetValue<int>("Port", 3000);
builder.WebHost.ConfigureKestrel(options =>
{
    options.ListenAnyIP(port);
});

// Add services
builder.Services.AddControllers();
builder.Services.AddHttpClient<IHumanodeSidecarClient, HumanodeSidecarClient>();

// Repositories
builder.Services.AddSingleton<IDbConnectionFactory, SqliteConnectionFactory>();
builder.Services.AddSingleton<IStatsRepository, StatsRepository>();
builder.Services.AddSingleton<ITransactionRepository, TransactionRepository>();
builder.Services.AddSingleton<IBlockRepository, BlockRepository>();
builder.Services.AddSingleton<IWhaleRepository, WhaleRepository>();
builder.Services.AddSingleton<ILeaderboardRepository, LeaderboardRepository>();
builder.Services.AddSingleton<ITokenRepository, TokenRepository>();
builder.Services.AddSingleton<ITokenomicsRepository, TokenomicsRepository>();
builder.Services.AddSingleton<IValidatorRepository, ValidatorRepository>();
builder.Services.AddSingleton<IWalletRepository, WalletRepository>();
builder.Services.AddSingleton<IDirectoryRepository, DirectoryRepository>();
builder.Services.AddSingleton<IGovernanceRepository, GovernanceRepository>();
builder.Services.AddSingleton<ILabelRepository, LabelRepository>();
builder.Services.AddSingleton<IPriceRepository, PriceRepository>();
builder.Services.AddSingleton<IEqualityRepository, EqualityRepository>();
builder.Services.AddSingleton<IClusterRepository, ClusterRepository>();
builder.Services.AddSingleton<IDexRepository, DexRepository>();
builder.Services.AddSingleton<ITaxReportRepository, TaxReportRepository>();
builder.Services.AddSingleton<ITimeMachineRepository, TimeMachineRepository>();
builder.Services.AddSingleton<IQuerySandboxRepository, QuerySandboxRepository>();
builder.Services.AddSingleton<IBiomapperRepository, BiomapperRepository>();
builder.Services.AddSingleton<IBridgeRepository, BridgeRepository>();
builder.Services.AddSingleton<IHodlersRepository, HodlersRepository>();
builder.Services.AddSingleton<ILocalizationRepository, LocalizationRepository>();
builder.Services.AddSingleton<IMethodDecoderService, MethodDecoderService>();

// Background Services
builder.Services.AddSingleton<BlockchainIndexerService>();
builder.Services.AddSingleton<IIndexerService>(sp => sp.GetRequiredService<BlockchainIndexerService>());
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
            if (ctx.File.Name.EndsWith(".js") || ctx.File.Name.EndsWith(".css"))
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
            await context.Response.WriteAsJsonAsync(new { error = "Geçersiz API rotası", path = context.Request.Path.Value });
            return;
        }

        var indexPath = Path.Combine(staticDir, "index.html");
        context.Response.ContentType = "text/html; charset=utf-8";
        await context.Response.SendFileAsync(indexPath);
    });
}

app.Run();
