import { useState, useEffect, useCallback } from 'react';
import { fetchCryptoPrices, tradingViewWS, CryptoPrice } from '@/services/tradingViewService';

interface UseCryptoPricesOptions {
  cryptos: string[];
  updateInterval?: number; // in milliseconds
  useWebSocket?: boolean;
}

interface CryptoPricesState {
  prices: Record<string, CryptoPrice>;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

/**
 * Custom hook for real-time crypto prices from TradingView
 */
export const useCryptoPrices = ({
  cryptos,
  updateInterval = 30000, // 30 seconds default
  useWebSocket = false
}: UseCryptoPricesOptions) => {
  const [state, setState] = useState<CryptoPricesState>({
    prices: {},
    loading: true,
    error: null,
    lastUpdated: null
  });

  const fetchPrices = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const prices = await fetchCryptoPrices(cryptos);
      setState({
        prices,
        loading: false,
        error: null,
        lastUpdated: new Date()
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch prices'
      }));
    }
  }, [cryptos]);

  // WebSocket implementation
  useEffect(() => {
    if (useWebSocket) {
      tradingViewWS.connect();
      
      const handlePriceUpdate = (crypto: string, price: CryptoPrice) => {
        setState(prev => ({
          ...prev,
          prices: {
            ...prev.prices,
            [crypto]: price
          },
          lastUpdated: new Date()
        }));
      };

      tradingViewWS.subscribeToPrices(cryptos, handlePriceUpdate);

      return () => {
        tradingViewWS.unsubscribeFromPrices(cryptos);
        tradingViewWS.disconnect();
      };
    }
  }, [cryptos, useWebSocket]);

  // Polling implementation
  useEffect(() => {
    if (!useWebSocket) {
      fetchPrices(); // Initial fetch
      
      const interval = setInterval(fetchPrices, updateInterval);
      
      return () => clearInterval(interval);
    }
  }, [fetchPrices, updateInterval, useWebSocket]);

  const refetch = useCallback(() => {
    if (!useWebSocket) {
      fetchPrices();
    }
  }, [fetchPrices, useWebSocket]);

  const getPrice = useCallback((crypto: string): number => {
    return state.prices[crypto]?.price || 0;
  }, [state.prices]);

  const getPriceChange = useCallback((crypto: string): { change: number; changePercent: number } => {
    const priceData = state.prices[crypto];
    return {
      change: priceData?.change || 0,
      changePercent: priceData?.changePercent || 0
    };
  }, [state.prices]);

  return {
    ...state,
    refetch,
    getPrice,
    getPriceChange
  };
};

/**
 * Simplified hook for just getting exchange rates (prices only)
 */
export const useCryptoRates = (cryptos: string[]) => {
  const { prices, loading, error, lastUpdated, refetch } = useCryptoPrices({
    cryptos,
    updateInterval: 60000, // 1 minute
    useWebSocket: false
  });

  const rates = Object.keys(prices).reduce((acc, crypto) => {
    acc[crypto] = prices[crypto].price;
    return acc;
  }, {} as Record<string, number>);

  return {
    rates,
    loading,
    error,
    lastUpdated,
    refetch
  };
};
