import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

declare global {
  interface Window {
    crCryptocoinPriceWidget: any;
  }
}

const CryptoPriceWidget: React.FC = () => {
  const widgetRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    if (scriptLoadedRef.current) return;

    const script = document.createElement('script');
    script.src = 'https://co-in.io/widget/pricelist.js?items=BTC%2CETH%2CUSDT%2CBNB%2CXRP%2CSOL%2CDOGE%2CTRX';
    script.async = true;

    const initWidget = () => {
      if (window.crCryptocoinPriceWidget && widgetRef.current) {
        try {
          const widget = window.crCryptocoinPriceWidget.init({
            base: "USD,EUR,CNY,GBP",
            items: "BTC,ETH,USDT,BNB,XRP,SOL,DOGE,TRX",
            backgroundColor: "6B4D2E",
            streaming: "1",
            striped: "1",
            rounded: "1",
            boxShadow: "1",
            border: "1"
          });
          
          // Clear existing content and add widget
          widgetRef.current.innerHTML = '';
          widgetRef.current.appendChild(widget);
        } catch (error) {
          console.error('Error initializing crypto widget:', error);
        }
      }
    };

    script.onload = initWidget;
    script.onerror = () => {
      console.error('Failed to load crypto widget script');
    };

    // For IE compatibility
    if ('onreadystatechange' in script) {
      (script as any).onreadystatechange = function() {
        if ((script as any).readyState === 'loaded' || (script as any).readyState === 'complete') {
          (script as any).onreadystatechange = null;
          initWidget();
        }
      };
    }

    document.head.appendChild(script);
    scriptLoadedRef.current = true;

    return () => {
      // Cleanup if needed
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Cryptocurrency Prices
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={widgetRef} className="min-h-[200px] flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm">Loading cryptocurrency prices...</p>
          </div>
        </div>
        <div className="mt-4 text-center">
          <a 
            href="https://currencyrate.today/" 
            rel="noopener" 
            target="_blank"
            className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            CurrencyRate.Today
          </a>
        </div>
      </CardContent>
    </Card>
  );
};

export default CryptoPriceWidget;
