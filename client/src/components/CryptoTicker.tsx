import React, { useEffect, useRef } from 'react';

interface CryptoTickerProps {
  symbols?: string[];
  colorTheme?: 'light' | 'dark';
  isTransparent?: boolean;
  displayMode?: 'adaptive' | 'compact' | 'regular';
  width?: string | number;
  height?: string | number;
}

const CryptoTicker: React.FC<CryptoTickerProps> = ({
  symbols = [
    'BINANCE:BTCUSDT',
    'BINANCE:ETHUSDT', 
    'BINANCE:BNBUSDT',
    'BINANCE:BCHUSDT',
    'BINANCE:USDTUSD'
  ],
  colorTheme = 'light',
  isTransparent = false,
  displayMode = 'adaptive',
  width = '100%',
  height = 46
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
    script.type = 'text/javascript';
    script.async = true;

    script.innerHTML = JSON.stringify({
      symbols: symbols.map(symbol => ({
        proName: symbol,
        title: symbol.split(':')[1]?.replace('USDT', '/USDT').replace('USD', '/USD')
      })),
      showSymbolLogo: true,
      colorTheme,
      isTransparent,
      displayMode,
      locale: 'en'
    });

    if (containerRef.current) {
      containerRef.current.appendChild(script);
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [symbols, colorTheme, isTransparent, displayMode]);

  return (
    <div 
      className="tradingview-widget-container"
      ref={(el) => {
        if (el) {
          el.style.width = typeof width === 'number' ? `${width}px` : width;
          el.style.height = typeof height === 'number' ? `${height}px` : height;
        }
      }}
    >
      <div ref={containerRef} className="tradingview-widget-container__widget" />
      <div className="tradingview-widget-copyright">
        <a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank">
          <span className="blue-text">Track all markets on TradingView</span>
        </a>
      </div>
    </div>
  );
};

export default CryptoTicker;
