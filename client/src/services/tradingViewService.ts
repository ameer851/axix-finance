/**
 * TradingView API Service for Real-time Crypto Rates
 * Fetches live cryptocurrency prices from TradingView
 */

export interface CryptoPrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  lastUpdate: Date;
}

interface TradingViewResponse {
  d: Array<{
    s: string; // symbol
    v: {
      lp: number; // last price
      ch: number; // change
      chp: number; // change percent
      volume: number;
    };
  }>;
}

// TradingView symbols mapping
const CRYPTO_SYMBOLS = {
  bitcoin: 'BINANCE:BTCUSDT',
  ethereum: 'BINANCE:ETHUSDT',
  bnb: 'BINANCE:BNBUSDT',
  bitcoinCash: 'BINANCE:BCHUSDT',
  usdt: 'BINANCE:USDTUSD',
  // Add more as needed
};

/**
 * Fetch real-time crypto prices from TradingView
 */
export const fetchCryptoPrices = async (cryptos: string[]): Promise<Record<string, CryptoPrice>> => {
  try {
    // Convert crypto names to TradingView symbols
    const symbols = cryptos.map(crypto => CRYPTO_SYMBOLS[crypto as keyof typeof CRYPTO_SYMBOLS]).filter(Boolean);
    
    if (symbols.length === 0) {
      throw new Error('No valid crypto symbols found');
    }

    // TradingView WebSocket or REST API endpoint
    const response = await fetch('https://scanner.tradingview.com/crypto/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filter: [
          {
            left: 'name',
            operation: 'in_range',
            right: symbols
          }
        ],
        options: {
          lang: 'en'
        },
        symbols: {
          query: {
            types: []
          },
          tickers: symbols
        },
        columns: ['name', 'close', 'change', 'change_abs', 'volume'],
        sort: {
          sortBy: 'name',
          sortOrder: 'asc'
        },
        range: [0, symbols.length]
      })
    });

    if (!response.ok) {
      throw new Error(`TradingView API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform the response to our format
    const prices: Record<string, CryptoPrice> = {};
    
    data.data?.forEach((item: any) => {
      const symbol = item.s;
      const cryptoKey = Object.keys(CRYPTO_SYMBOLS).find(
        key => CRYPTO_SYMBOLS[key as keyof typeof CRYPTO_SYMBOLS] === symbol
      );
      
      if (cryptoKey && item.d) {
        prices[cryptoKey] = {
          symbol: cryptoKey,
          price: item.d[1] || 0, // close price
          change: item.d[3] || 0, // absolute change
          changePercent: item.d[2] || 0, // percentage change
          volume: item.d[4] || 0, // volume
          lastUpdate: new Date()
        };
      }
    });

    return prices;
  } catch (error) {
    console.error('Error fetching crypto prices from TradingView:', error);
    // Fallback to static prices if API fails
    return getFallbackPrices(cryptos);
  }
};

/**
 * Alternative: Using TradingView WebSocket for real-time data
 */
export class TradingViewWebSocket {
  private ws: WebSocket | null = null;
  private callbacks: Map<string, (price: CryptoPrice) => void> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect() {
    try {
      this.ws = new WebSocket('wss://data.tradingview.com/socket.io/?EIO=3&transport=websocket');
      
      this.ws.onopen = () => {
        console.log('TradingView WebSocket connected');
        this.reconnectAttempts = 0;
        this.sendMessage('set_auth_token', ['unauthorized_user_token']);
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onclose = () => {
        console.log('TradingView WebSocket disconnected');
        this.reconnect();
      };

      this.ws.onerror = (error) => {
        console.error('TradingView WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to connect to TradingView WebSocket:', error);
    }
  }

  private reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Reconnecting to TradingView WebSocket (attempt ${this.reconnectAttempts})`);
        this.connect();
      }, 1000 * this.reconnectAttempts);
    }
  }

  private sendMessage(method: string, params: any[]) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({
        m: method,
        p: params
      });
      this.ws.send(`~m~${message.length}~m~${message}`);
    }
  }

  private handleMessage(data: string) {
    // Parse TradingView WebSocket message format
    const messages = data.split('~m~');
    for (let i = 0; i < messages.length; i += 2) {
      if (messages[i + 1]) {
        try {
          const message = JSON.parse(messages[i + 1]);
          if (message.m === 'du' && message.p && message.p[1]) {
            this.processPriceUpdate(message.p[1]);
          }
        } catch (error) {
          // Ignore parsing errors
        }
      }
    }
  }

  private processPriceUpdate(data: any) {
    // Process real-time price updates
    if (data.lp) { // last price
      const symbol = data.n; // symbol name
      const cryptoKey = Object.keys(CRYPTO_SYMBOLS).find(
        key => CRYPTO_SYMBOLS[key as keyof typeof CRYPTO_SYMBOLS] === symbol
      );
      
      if (cryptoKey) {
        const priceData: CryptoPrice = {
          symbol: cryptoKey,
          price: data.lp,
          change: data.ch || 0,
          changePercent: data.chp || 0,
          volume: data.volume || 0,
          lastUpdate: new Date()
        };

        const callback = this.callbacks.get(cryptoKey);
        if (callback) {
          callback(priceData);
        }
      }
    }
  }

  subscribeToPrices(cryptos: string[], callback: (crypto: string, price: CryptoPrice) => void) {
    cryptos.forEach(crypto => {
      const symbol = CRYPTO_SYMBOLS[crypto as keyof typeof CRYPTO_SYMBOLS];
      if (symbol) {
        this.callbacks.set(crypto, (price) => callback(crypto, price));
        this.sendMessage('quote_add_symbols', [symbol]);
      }
    });
  }

  unsubscribeFromPrices(cryptos: string[]) {
    cryptos.forEach(crypto => {
      const symbol = CRYPTO_SYMBOLS[crypto as keyof typeof CRYPTO_SYMBOLS];
      if (symbol) {
        this.callbacks.delete(crypto);
        this.sendMessage('quote_remove_symbols', [symbol]);
      }
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.callbacks.clear();
  }
}

/**
 * Fallback prices when API fails
 */
const getFallbackPrices = (cryptos: string[]): Record<string, CryptoPrice> => {
  const fallbackPrices: Record<string, CryptoPrice> = {
    bitcoin: {
      symbol: 'bitcoin',
      price: 102500,
      change: 1250,
      changePercent: 1.23,
      volume: 28500000000,
      lastUpdate: new Date()
    },
    ethereum: {
      symbol: 'ethereum',
      price: 3420,
      change: -45,
      changePercent: -1.30,
      volume: 15200000000,
      lastUpdate: new Date()
    },
    bnb: {
      symbol: 'bnb',
      price: 695,
      change: 12,
      changePercent: 1.76,
      volume: 1800000000,
      lastUpdate: new Date()
    },
    bitcoinCash: {
      symbol: 'bitcoinCash',
      price: 465,
      change: -8,
      changePercent: -1.69,
      volume: 520000000,
      lastUpdate: new Date()
    },
    usdt: {
      symbol: 'usdt',
      price: 1.0,
      change: 0,
      changePercent: 0,
      volume: 45000000000,
      lastUpdate: new Date()
    }
  };

  const result: Record<string, CryptoPrice> = {};
  cryptos.forEach(crypto => {
    if (fallbackPrices[crypto]) {
      result[crypto] = fallbackPrices[crypto];
    }
  });

  return result;
};

/**
 * Simplified function to get current crypto exchange rates
 */
export const getCryptoExchangeRates = async (): Promise<Record<string, number>> => {
  try {
    const cryptos = ['bitcoin', 'ethereum', 'bnb', 'bitcoinCash', 'usdt'];
    const prices = await fetchCryptoPrices(cryptos);
    
    const rates: Record<string, number> = {};
    Object.keys(prices).forEach(crypto => {
      rates[crypto] = prices[crypto].price;
    });
    
    return rates;
  } catch (error) {
    console.error('Error getting crypto rates:', error);
    // Return fallback rates
    return {
      bitcoin: 102500,
      ethereum: 3420,
      bnb: 695,
      bitcoinCash: 465,
      usdt: 1.0
    };
  }
};

// Export singleton WebSocket instance
export const tradingViewWS = new TradingViewWebSocket();
