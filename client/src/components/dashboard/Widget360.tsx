import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Globe,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';

interface Widget360Props {
  onRefresh?: () => void;
}

const Widget360: React.FC<Widget360Props> = ({ onRefresh }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [marketOverview, setMarketOverview] = useState({
    globalMarketCap: '2.1T',
    cryptoFear: 42,
    topGainer: { symbol: 'BTC', change: '+5.2%' },
    topLoser: { symbol: 'ETH', change: '-2.1%' },
    volume24h: '89.4B'
  });

  const handleRefresh = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      if (onRefresh) onRefresh();
    }, 1000);
  };

  const getFearGreedColor = (score: number) => {
    if (score <= 25) return 'text-red-500';
    if (score <= 50) return 'text-yellow-500';
    if (score <= 75) return 'text-blue-500';
    return 'text-green-500';
  };

  const getFearGreedLabel = (score: number) => {
    if (score <= 25) return 'Extreme Fear';
    if (score <= 50) return 'Fear';
    if (score <= 75) return 'Greed';
    return 'Extreme Greed';
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            360° Market View
          </CardTitle>
          <CardDescription>Complete market overview at a glance</CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Market Overview Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Global Cap</span>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-xl font-bold">${marketOverview.globalMarketCap}</div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">24h Volume</span>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-xl font-bold">${marketOverview.volume24h}</div>
            </div>
          </div>

          {/* Fear & Greed Index */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Fear & Greed Index</span>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex items-center justify-between">
              <div className={`text-2xl font-bold ${getFearGreedColor(marketOverview.cryptoFear)}`}>
                {marketOverview.cryptoFear}
              </div>
              <Badge 
                variant="outline" 
                className={`${getFearGreedColor(marketOverview.cryptoFear)} border-current`}
              >
                {getFearGreedLabel(marketOverview.cryptoFear)}
              </Badge>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  marketOverview.cryptoFear <= 25 ? 'bg-red-500' :
                  marketOverview.cryptoFear <= 50 ? 'bg-yellow-500' :
                  marketOverview.cryptoFear <= 75 ? 'bg-blue-500' : 'bg-green-500'
                }`}
                style={{ width: `${marketOverview.cryptoFear}%` }}
              />
            </div>
          </div>

          {/* Top Movers */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Top Movers</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-green-700 dark:text-green-300">
                    {marketOverview.topGainer.symbol}
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400">Top Gainer</div>
                </div>
                <div className="flex items-center text-green-600 dark:text-green-400">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span className="font-medium">{marketOverview.topGainer.change}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-red-700 dark:text-red-300">
                    {marketOverview.topLoser.symbol}
                  </div>
                  <div className="text-xs text-red-600 dark:text-red-400">Top Loser</div>
                </div>
                <div className="flex items-center text-red-600 dark:text-red-400">
                  <TrendingDown className="h-4 w-4 mr-1" />
                  <span className="font-medium">{marketOverview.topLoser.change}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="pt-2 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Market Analysis</span>
              <Button variant="ghost" size="sm" className="h-8 px-3 text-xs">
                View Details
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Widget360;
