import React, { useEffect, useRef } from 'react';

const TradingViewWidget: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && !ref.current.querySelector('iframe')) {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
      script.type = 'text/javascript';
      script.async = true;
      script.innerHTML = JSON.stringify({
        "symbols": [
          { "proName": "FOREXCOM:SPXUSD", "title": "S&P 500" },
          { "proName": "FOREXCOM:NSXUSD", "title": "Nasdaq 100" },
          { "proName": "FX_IDC:EURUSD", "title": "EUR/USD" },
          { "proName": "BITSTAMP:BTCUSD", "title": "Bitcoin" },
          { "proName": "BITSTAMP:ETHUSD", "title": "Ethereum" }
        ],
        "colorTheme": "light",
        "isTransparent": false,
        "displayMode": "adaptive",
        "locale": "en"
      });
      ref.current.appendChild(script);
    }
  }, []);

  return (
    <div className="w-full mx-auto mb-4 sm:mb-6 overflow-hidden rounded-lg shadow-sm">
      <div ref={ref} className="w-full min-h-[50px]">
        {/* TradingView Widget will be injected here */}
      </div>
    </div>
  );
};

export default TradingViewWidget;
