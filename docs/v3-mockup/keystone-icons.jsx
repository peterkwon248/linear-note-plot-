// =============================================================
// Keystone — investment tracking app domain icons (~40)
// 24 viewBox · 1.5px stroke · currentColor
// =============================================================

function kk(paths, opts) {
  opts = opts || {};
  function Comp(props) {
    props = props || {};
    var size = props.size || 20;
    var sw = props.strokeWidth || 1.5;
    var color = props.color || "currentColor";
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke={color}
        strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
        width={size} height={size}
        className={props.className || ""} style={props.style}>
        {paths}
      </svg>
    );
  }
  Comp.keywords = opts.keywords || [];
  return Comp;
}

// ---------- Performance ----------
const KsTrendingUp = kk([
  <path key="a" d="m3 17 6-6 4 4 8-8"/>,
  <path key="b" d="M14 7h7v7"/>,
], { keywords: ["up", "gain", "rise"] });

const KsTrendingDown = kk([
  <path key="a" d="m3 7 6 6 4-4 8 8"/>,
  <path key="b" d="M14 17h7v-7"/>,
], { keywords: ["down", "loss", "fall"] });

const KsTrendingFlat = kk([
  <path key="a" d="M3 12h15"/>,
  <path key="b" d="m16 9 3 3-3 3"/>,
], { keywords: ["flat", "neutral", "sideways"] });

const KsCandle = kk([
  <path key="a" d="M6 4v3M6 17v3"/>,
  <rect key="b" x="4.5" y="7" width="3" height="10" rx=".5"/>,
  <path key="c" d="M12 5v3M12 16v3"/>,
  <rect key="d" x="10.5" y="8" width="3" height="8" rx=".5" fill="currentColor" fillOpacity=".3"/>,
  <path key="e" d="M18 3v4M18 18v3"/>,
  <rect key="f" x="16.5" y="7" width="3" height="11" rx=".5"/>,
], { keywords: ["candle", "ohlc", "stick"] });

const KsSparklineUp = kk([
  <path key="a" d="m3 16 4-3 3 2 4-5 4 1 3-3"/>,
  <circle key="b" cx="21" cy="8" r="1" fill="currentColor"/>,
], { keywords: ["sparkline", "up"] });

const KsSparklineDown = kk([
  <path key="a" d="m3 8 4 3 3-2 4 5 4-1 3 3"/>,
  <circle key="b" cx="21" cy="16" r="1" fill="currentColor"/>,
], { keywords: ["sparkline", "down"] });

const KsGain = kk([
  <circle key="a" cx="12" cy="12" r="9"/>,
  <path key="b" d="m8 13 3-4 3 3 3-4"/>,
  <path key="c" d="M14 8h3v3"/>,
], { keywords: ["gain", "profit", "win"] });

const KsLoss = kk([
  <circle key="a" cx="12" cy="12" r="9"/>,
  <path key="b" d="m8 11 3 4 3-3 3 4"/>,
  <path key="c" d="M14 16h3v-3"/>,
], { keywords: ["loss", "drop"] });

const KsPerformance = kk([
  <path key="a" d="M3 20h18"/>,
  <path key="b" d="M6 20v-7M10 20v-12M14 20v-5M18 20v-9"/>,
  <path key="c" d="m3 6 5 4 4-3 5 5 4-2"/>,
], { keywords: ["performance", "stats"] });

// ---------- Portfolio ----------
const KsPortfolio = kk([
  <rect key="a" x="3" y="6" width="18" height="14" rx="2"/>,
  <path key="b" d="M9 6V4h6v2"/>,
  <path key="c" d="M3 12h18"/>,
  <circle key="d" cx="12" cy="12" r="1.5"/>,
], { keywords: ["portfolio", "briefcase"] });

const KsAllocation = kk([
  <circle key="a" cx="12" cy="12" r="8"/>,
  <path key="b" d="M12 4v8h8" fill="currentColor" fillOpacity=".2"/>,
  <path key="c" d="M12 4v8l-7 4" />,
], { keywords: ["allocation", "pie", "split"] });

const KsRebalance = kk([
  <path key="a" d="M5 8h11"/>,
  <path key="b" d="m13 5 3 3-3 3"/>,
  <path key="c" d="M19 16H8"/>,
  <path key="d" d="m11 13-3 3 3 3"/>,
], { keywords: ["rebalance", "swap"] });

const KsWatchlist = kk([
  <path key="a" d="M3 5h13l5 5v9H3z"/>,
  <path key="b" d="M16 5v5h5"/>,
  <circle key="c" cx="11" cy="14" r="2.5"/>,
  <circle key="d" cx="11" cy="14" r=".8" fill="currentColor"/>,
], { keywords: ["watchlist", "watch"] });

const KsAlertPrice = kk([
  <path key="a" d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2H4.5z"/>,
  <path key="b" d="M10 19a2 2 0 0 0 4 0"/>,
  <path key="c" d="M12 7v3l1.5 1.5"/>,
], { keywords: ["alert", "price", "notify"] });

const KsAlertBell = kk([
  <path key="a" d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2H4.5z"/>,
  <path key="b" d="M10 19a2 2 0 0 0 4 0"/>,
  <circle key="c" cx="18" cy="6" r="2.5" fill="currentColor"/>,
], { keywords: ["alert", "notify", "bell"] });

// ---------- Asset classes ----------
const KsAssetStock = kk([
  <rect key="a" x="3" y="6" width="18" height="14" rx="2"/>,
  <path key="b" d="m6 16 3-3 3 1 4-5 3 2"/>,
  <path key="c" d="M3 10h18"/>,
], { keywords: ["stock", "equity", "share"] });

const KsAssetBond = kk([
  <rect key="a" x="3" y="5" width="18" height="14" rx="1"/>,
  <path key="b" d="M3 9h18"/>,
  <circle key="c" cx="8" cy="14" r="2"/>,
  <path key="d" d="M12 13h6M12 16h4"/>,
], { keywords: ["bond", "fixed-income"] });

const KsAssetCrypto = kk([
  <circle key="a" cx="12" cy="12" r="9"/>,
  <path key="b" d="M9 7h5a2.5 2.5 0 0 1 0 5H9zM9 12h6a2.5 2.5 0 0 1 0 5H9z"/>,
  <path key="c" d="M11 5v2M11 17v2M14 5v2M14 17v2"/>,
], { keywords: ["crypto", "btc", "bitcoin"] });

const KsAssetCash = kk([
  <rect key="a" x="3" y="7" width="18" height="11" rx="1.5"/>,
  <circle key="b" cx="12" cy="12.5" r="2.5"/>,
  <circle key="c" cx="6.5" cy="12.5" r=".8" fill="currentColor"/>,
  <circle key="d" cx="17.5" cy="12.5" r=".8" fill="currentColor"/>,
], { keywords: ["cash", "money", "fiat"] });

const KsAssetRealEstate = kk([
  <path key="a" d="M3 11 12 4l9 7"/>,
  <path key="b" d="M5 10v10h14V10"/>,
  <path key="c" d="M10 20v-5h4v5"/>,
  <path key="d" d="M16 8V5h2v5"/>,
], { keywords: ["real-estate", "property", "house"] });

const KsAssetCommodity = kk([
  <circle key="a" cx="8" cy="11" r="4"/>,
  <circle key="b" cx="14" cy="14" r="4"/>,
  <circle key="c" cx="11" cy="17" r="4"/>,
], { keywords: ["commodity", "gold", "metal"] });

// ---------- Transactions ----------
const KsTransactionBuy = kk([
  <circle key="a" cx="12" cy="12" r="9"/>,
  <path key="b" d="M12 8v8M8 12h8"/>,
], { keywords: ["buy", "purchase", "add"] });

const KsTransactionSell = kk([
  <circle key="a" cx="12" cy="12" r="9"/>,
  <path key="b" d="M8 12h8"/>,
], { keywords: ["sell", "remove"] });

const KsDividend = kk([
  <circle key="a" cx="12" cy="9" r="4"/>,
  <path key="b" d="M12 5v8M10 7h3a1 1 0 0 1 0 2h-2a1 1 0 0 0 0 2h3"/>,
  <path key="c" d="m6 17 2 2 8-8"/>,
  <path key="d" d="M14 19h6"/>,
], { keywords: ["dividend", "payout"] });

const KsDeposit = kk([
  <rect key="a" x="3" y="11" width="18" height="9" rx="1.5"/>,
  <path key="b" d="M12 3v8"/>,
  <path key="c" d="m9 8 3 3 3-3"/>,
], { keywords: ["deposit", "in"] });

const KsWithdrawal = kk([
  <rect key="a" x="3" y="4" width="18" height="9" rx="1.5"/>,
  <path key="b" d="M12 13v8"/>,
  <path key="c" d="m9 18 3 3 3-3"/>,
], { keywords: ["withdrawal", "out"] });

const KsFee = kk([
  <path key="a" d="m4 6 14 14M18 6 4 20"/>,
  <circle key="b" cx="12" cy="13" r="2"/>,
], { keywords: ["fee", "cost", "charge"] });

const KsCurrencyExchange = kk([
  <circle key="a" cx="8" cy="8" r="4"/>,
  <circle key="b" cx="16" cy="16" r="4"/>,
  <path key="c" d="m12 8 4 4M8 12l4 4" strokeDasharray="2 2"/>,
], { keywords: ["currency", "exchange", "fx"] });

const KsTaxLot = kk([
  <rect key="a" x="3" y="6" width="18" height="14" rx="1.5"/>,
  <path key="b" d="M3 10h18"/>,
  <path key="c" d="M7 14h2M7 17h2M11 14h2M11 17h2M15 14h2M15 17h2"/>,
], { keywords: ["tax", "lot", "ledger"] });

// ---------- Analytics ----------
const KsTicker = kk([
  <path key="a" d="m4 9 5 6 4-4 7 5"/>,
  <path key="b" d="M16 16h4M16 18h3"/>,
  <path key="c" d="M3 19h12" strokeDasharray="1 2"/>,
], { keywords: ["ticker", "symbol", "stream"] });

const KsMarketCap = kk([
  <circle key="a" cx="12" cy="12" r="9"/>,
  <path key="b" d="M12 3a9 9 0 0 1 9 9h-9z" fill="currentColor" fillOpacity=".25"/>,
  <path key="c" d="M12 12 5.5 17"/>,
], { keywords: ["market", "cap", "size"] });

const KsPeRatio = kk([
  <path key="a" d="M5 18 19 6"/>,
  <circle key="b" cx="7" cy="7" r="2.5"/>,
  <circle key="c" cx="17" cy="17" r="2.5"/>,
], { keywords: ["pe", "ratio", "multiple"] });

const KsBeta = kk([
  <path key="a" d="M7 21V5a3 3 0 0 1 3-3 3 3 0 0 1 0 6h-1c3 0 4 2 4 4s-1 4-4 4H7"/>,
], { keywords: ["beta", "volatility"] });

const KsSharpe = kk([
  <path key="a" d="M3 18h4l3-12 4 18 3-12h4"/>,
], { keywords: ["sharpe", "ratio"] });

const KsDrawdown = kk([
  <path key="a" d="M3 5v14h18"/>,
  <path key="b" d="m6 9 4 1 3 5 4-2 4 4"/>,
  <path key="c" d="m13 14-1 5"/>,
  <path key="d" d="M11 19h2"/>,
], { keywords: ["drawdown", "max-loss"] });

const KsYield = kk([
  <path key="a" d="M12 21V11"/>,
  <path key="b" d="M7 11h10l-2-3H9z"/>,
  <path key="c" d="M5 4h14"/>,
  <circle key="d" cx="12" cy="7.5" r="1"/>,
], { keywords: ["yield", "interest"] });

const KsEarnings = kk([
  <rect key="a" x="3" y="5" width="18" height="14" rx="2"/>,
  <path key="b" d="M3 9h18"/>,
  <path key="c" d="M7 13h2v3H7zM11 14h2v2h-2zM15 12h2v4h-2z"/>,
], { keywords: ["earnings", "report"] });

const KsNews = kk([
  <rect key="a" x="3" y="5" width="18" height="14" rx="1.5"/>,
  <path key="b" d="M7 9h10M7 12h6M7 15h8"/>,
  <rect key="c" x="14" y="11" width="4" height="5" rx=".5"/>,
], { keywords: ["news", "feed"] });

const KsBroker = kk([
  <rect key="a" x="3" y="6" width="18" height="14" rx="2"/>,
  <path key="b" d="M3 10h18"/>,
  <circle key="c" cx="9" cy="14" r="1"/>,
  <path key="d" d="M12 14h6M12 17h4"/>,
  <path key="e" d="M9 6V4h6v2"/>,
], { keywords: ["broker", "account"] });

const KsSector = kk([
  <circle key="a" cx="12" cy="12" r="9"/>,
  <path key="b" d="M12 3v9l8-5"/>,
  <path key="c" d="M12 12 4 17"/>,
  <path key="d" d="M12 12v9"/>,
], { keywords: ["sector", "category"] });

const KsDividendCalendar = kk([
  <rect key="a" x="3" y="5" width="18" height="15" rx="1.5"/>,
  <path key="b" d="M3 10h18"/>,
  <path key="c" d="M9 3v4M15 3v4"/>,
  <path key="d" d="M9 14h2M13 14h2M9 17h2M13 17h2"/>,
  <circle key="e" cx="18" cy="14" r="1.2" fill="currentColor"/>,
], { keywords: ["dividend", "calendar", "payout"] });

const KsCompound = kk([
  <path key="a" d="M3 21 7 9l4 7 4-9 6 14"/>,
  <circle key="b" cx="7" cy="9" r="1.2"/>,
  <circle key="c" cx="11" cy="16" r="1.2"/>,
  <circle key="d" cx="15" cy="7" r="1.2"/>,
], { keywords: ["compound", "growth"] });

// ---------- Registry ----------
const KEYSTONE_ICONS = [
  { name: "ks-trending-up", c: KsTrendingUp, cat: "Keystone" },
  { name: "ks-trending-down", c: KsTrendingDown, cat: "Keystone" },
  { name: "ks-trending-flat", c: KsTrendingFlat, cat: "Keystone" },
  { name: "ks-candle", c: KsCandle, cat: "Keystone" },
  { name: "ks-sparkline-up", c: KsSparklineUp, cat: "Keystone" },
  { name: "ks-sparkline-down", c: KsSparklineDown, cat: "Keystone" },
  { name: "ks-gain", c: KsGain, cat: "Keystone" },
  { name: "ks-loss", c: KsLoss, cat: "Keystone" },
  { name: "ks-performance", c: KsPerformance, cat: "Keystone" },
  { name: "ks-portfolio", c: KsPortfolio, cat: "Keystone" },
  { name: "ks-allocation", c: KsAllocation, cat: "Keystone" },
  { name: "ks-rebalance", c: KsRebalance, cat: "Keystone" },
  { name: "ks-watchlist", c: KsWatchlist, cat: "Keystone" },
  { name: "ks-alert-price", c: KsAlertPrice, cat: "Keystone" },
  { name: "ks-alert-bell", c: KsAlertBell, cat: "Keystone" },
  { name: "ks-asset-stock", c: KsAssetStock, cat: "Keystone" },
  { name: "ks-asset-bond", c: KsAssetBond, cat: "Keystone" },
  { name: "ks-asset-crypto", c: KsAssetCrypto, cat: "Keystone" },
  { name: "ks-asset-cash", c: KsAssetCash, cat: "Keystone" },
  { name: "ks-asset-realestate", c: KsAssetRealEstate, cat: "Keystone" },
  { name: "ks-asset-commodity", c: KsAssetCommodity, cat: "Keystone" },
  { name: "ks-tx-buy", c: KsTransactionBuy, cat: "Keystone" },
  { name: "ks-tx-sell", c: KsTransactionSell, cat: "Keystone" },
  { name: "ks-dividend", c: KsDividend, cat: "Keystone" },
  { name: "ks-deposit", c: KsDeposit, cat: "Keystone" },
  { name: "ks-withdrawal", c: KsWithdrawal, cat: "Keystone" },
  { name: "ks-fee", c: KsFee, cat: "Keystone" },
  { name: "ks-currency-exchange", c: KsCurrencyExchange, cat: "Keystone" },
  { name: "ks-tax-lot", c: KsTaxLot, cat: "Keystone" },
  { name: "ks-ticker", c: KsTicker, cat: "Keystone" },
  { name: "ks-market-cap", c: KsMarketCap, cat: "Keystone" },
  { name: "ks-pe-ratio", c: KsPeRatio, cat: "Keystone" },
  { name: "ks-beta", c: KsBeta, cat: "Keystone" },
  { name: "ks-sharpe", c: KsSharpe, cat: "Keystone" },
  { name: "ks-drawdown", c: KsDrawdown, cat: "Keystone" },
  { name: "ks-yield", c: KsYield, cat: "Keystone" },
  { name: "ks-earnings", c: KsEarnings, cat: "Keystone" },
  { name: "ks-news", c: KsNews, cat: "Keystone" },
  { name: "ks-broker", c: KsBroker, cat: "Keystone" },
  { name: "ks-sector", c: KsSector, cat: "Keystone" },
  { name: "ks-dividend-calendar", c: KsDividendCalendar, cat: "Keystone" },
  { name: "ks-compound", c: KsCompound, cat: "Keystone" },
];
