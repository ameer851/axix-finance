import helmet from "helmet";

export const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: [
        "'self'",
        // Allow Google Translate & related APIs
        "https://*.google.com",
        "https://*.googleapis.com",
        "https://translate.googleapis.com",
        "https://translate.google.com",
        "https://*.gstatic.com",
        // TradingView / finance related
        "wss://*.tradingview.com",
        "https://*.tradingview.com",
        "https://s3.tradingview.com",
        "https://static.tradingview.com",
        // Supabase
        "https://*.supabase.co",
        "https://oyqanlnqfyyaqheehsmw.supabase.co",
        // Project specific
        "https://co-in.io",
        ...(process.env.NODE_ENV === "development"
          ? ["http://localhost:*", "ws://localhost:*"]
          : []),
      ],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        // Google Translate scripts & tag manager
        "https://translate.google.com",
        "https://translate.googleapis.com",
        "https://translate-pa.googleapis.com",
        "https://www.google.com",
        "https://www.gstatic.com",
        "https://*.gstatic.com",
        "https://www.googletagmanager.com",
        "https://*.translate.goog",
        // TradingView widgets
        "https://www.tradingview.com",
        "https://*.tradingview.com",
        "https://www.tradingview-widget.com",
        "https://s3.tradingview.com",
        "https://static.tradingview.com",
        // Project specific
        "https://co-in.io",
        "blob:",
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
        // TradingView
        "https://www.tradingview.com",
        // Project specific
        "https://co-in.io",
        // Google Translate injected styles sometimes come from gstatic
        "https://www.gstatic.com",
      ],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      fontSrc: [
        "'self'",
        "data:",
        "https:",
        "http:",
        "https://fonts.gstatic.com",
      ],
      mediaSrc: ["'self'", "data:", "https:", "http:"],
      frameSrc: [
        "'self'",
        "https:",
        "http:",
        // Allow Google translate iframe
        "https://translate.google.com",
        "https://*.translate.goog",
        // TradingView widgets in iframes
        "https://www.tradingview.com",
        "https://*.tradingview.com",
      ],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: false,
});
