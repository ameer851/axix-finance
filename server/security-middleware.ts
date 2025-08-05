import helmet from "helmet";

export const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: [
        "'self'",
        "https://*.google.com",
        "https://*.googleapis.com",
        "https://*.gstatic.com",
        "wss://*.tradingview.com",
        "https://*.supabase.co",
        "https://oyqanlnqfyyaqheehsmw.supabase.co",
        ...(process.env.NODE_ENV === "development"
          ? ["http://localhost:*", "ws://localhost:*"]
          : []),
      ],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        "https://translate.google.com",
        "https://translate.googleapis.com",
        "https://www.google.com",
        "https://s3.tradingview.com",
        "https://static.tradingview.com",
        "https://*.tradingview.com",
        "https://www.tradingview-widget.com",
        "https://translate-pa.googleapis.com",
        "https://*.gstatic.com",
        "https://www.gstatic.com",
        "https://www.googletagmanager.com",
        "https://*.translate.goog",
        "blob:",
        "https://www.tradingview.com",
      ],
      styleSrc: ["'self'", "'unsafe-inline'", "https:", "http:"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      fontSrc: ["'self'", "data:", "https:", "http:"],
      mediaSrc: ["'self'", "data:", "https:", "http:"],
      frameSrc: ["'self'", "https:", "http:"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: false,
});
