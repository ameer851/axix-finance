import React, { useEffect, useRef } from 'react';

interface CryptoMarketWidgetProps {
  theme?: 'light' | 'dark';
  height?: number;
  width?: string | number;
}

const CryptoMarketWidget: React.FC<CryptoMarketWidgetProps> = ({
  theme = 'light',
  height = 400,
  width = '100%'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Clean up any previous instances
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    // Create a container div for the widget
    const widgetContainer = document.createElement('div');
    widgetContainer.style.height = `${height}px`;
    widgetContainer.style.width = typeof width === 'number' ? `${width}px` : width;
    widgetContainer.style.overflow = 'hidden';
    widgetContainer.style.borderRadius = '8px';
    widgetContainer.className = 'crypto-market-widget-container';

    // Add the container to the DOM
    if (containerRef.current) {
      containerRef.current.appendChild(widgetContainer);
    }

    // Create the script for CoinMarketCap widget
    const script = document.createElement('script');
    script.src = 'https://files.coinmarketcap.com/static/widget/coinMarquee.js';
    script.async = true;
    
    // Configure the widget
    window.coinmarketcapWidget = {
      marquee: {
        coins: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        currency: "USD",
        theme: theme,
        transparent: false,
        showSymbolLogo: true
      }
    };

    // Add the script to the container
    if (containerRef.current) {
      containerRef.current.appendChild(script);
    }

    // Cleanup function
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      
      // TypeScript-friendly way to clean up global object
      if ('coinmarketcapWidget' in window) {
        (window as any).coinmarketcapWidget = undefined;
      }
    };
  }, [theme, height, width]); // Re-run effect if these props change

  return (
    <div className="crypto-market-widget">
      <h3 className="text-lg font-medium mb-2">Crypto Market Overview</h3>
      <div ref={containerRef} className="rounded-lg shadow overflow-hidden" />
    </div>
  );
};

// Add this to the window type definition to avoid TypeScript errors
declare global {
  interface Window {
    coinmarketcapWidget: {
      marquee: {
        coins: number[];
        currency: string;
        theme: string;
        transparent: boolean;
        showSymbolLogo: boolean;
      }
    }
  }
}

export default CryptoMarketWidget;
