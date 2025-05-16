import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  RefreshCw, 
  Star, 
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getMarketData } from '@/services/portfolioService';
import { getWatchlist } from '@/services/watchlistService';
import { getMarketNews, MarketNews } from '@/services/marketService';

interface MarketWatchProps {
  onAddToWatchlist?: (symbol: string) => void;
  onRemoveFromWatchlist?: (symbol: string) => void;
  onBuy?: (symbol: string) => void;
}

const MarketWatch: React.FC<MarketWatchProps> = ({
  onAddToWatchlist,
  onRemoveFromWatchlist,
  onBuy
}) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('watchlist');
  
  // Fetch market data
  const { data: marketData = [], isLoading: marketDataLoading, refetch: refetchMarketData } = useQuery({
    queryKey: ['marketData'],
    queryFn: getMarketData,
    refetchInterval: 60000 // Refetch every minute
  });
  // Fetch user's watchlist
  const { data: watchlist = [], isLoading: watchlistLoading } = useQuery({
    queryKey: ['watchlist', user?.id],
    queryFn: async () => {
      try {
        if (!user?.id) throw new Error("User ID is required");
        return await getWatchlist(user.id);
      } catch (error) {
        console.error('Error fetching watchlist:', error);
        throw error;
      }
    },
    enabled: !!user?.id
  });

  // Fetch market news from API
  const { data: marketNews = [], isLoading: marketNewsLoading } = useQuery<MarketNews[]>({
    queryKey: ['marketNews'],
    queryFn: getMarketNews,
    staleTime: 300000, // 5 minutes
    retry: 3
  });
  
  // Format market data
  const formatMarketData = (data: any[]) => {
    if (!data || !Array.isArray(data)) return [];
    
    return data
      .filter(item => {
        if (!searchQuery) return true;
        
        const query = searchQuery.toLowerCase();
        return (
          item.symbol.toLowerCase().includes(query) ||
          item.name.toLowerCase().includes(query)
        );
      })
      .map(item => ({
        ...item,
        price: typeof item.price === 'number' ? item.price.toFixed(2) : item.price,
        changePercentage: typeof item.change === 'number' ? item.change.toFixed(2) : item.change
      }));
  };
  
  // Format watchlist data
  const formatWatchlistData = (data: any[], watchSymbols: string[]) => {
    if (!data || !Array.isArray(data) || !watchSymbols || !Array.isArray(watchSymbols)) return [];
    
    return data
      .filter(item => watchSymbols.includes(item.symbol))
      .map(item => ({
        ...item,
        price: typeof item.price === 'number' ? item.price.toFixed(2) : item.price,
        changePercentage: typeof item.change === 'number' ? item.change.toFixed(2) : item.change
      }));
  };
  
  // Format date for news items
  const formatNewsDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const isInWatchlist = (symbol: string) => watchlist.includes(symbol);
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const handleRefresh = () => {
    refetchMarketData();
  };
  
  const handleAddToWatchlist = (symbol: string) => {
    if (onAddToWatchlist) onAddToWatchlist(symbol);
  };
  
  const handleRemoveFromWatchlist = (symbol: string) => {
    if (onRemoveFromWatchlist) onRemoveFromWatchlist(symbol);
  };
  
  const handleBuy = (symbol: string) => {
    if (onBuy) onBuy(symbol);
  };
  
  if (marketDataLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Market Watch</CardTitle>
          <CardDescription>Loading market data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const formattedMarketData = formatMarketData(marketData);
  const formattedWatchlistData = formatWatchlistData(marketData, watchlist);
  
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Market Watch</CardTitle>
          <CardDescription>Real-time market insights</CardDescription>
        </div>
        <Button variant="outline" size="icon" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search symbol or name..."
                className="pl-8"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
          </div>
          
          <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
              <TabsTrigger value="market">Market</TabsTrigger>
            </TabsList>
            
            <TabsContent value="watchlist" className="pt-4">
              {formattedWatchlistData.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No stocks in your watchlist</p>
                  <Button size="sm" onClick={() => setActiveTab('market')}>
                    Discover Stocks
                  </Button>
                </div>
              ) : (
                <div className="overflow-auto max-h-[20rem]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Symbol</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Change</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formattedWatchlistData.map((stock) => (
                        <TableRow key={stock.symbol}>
                          <TableCell className="font-medium">{stock.symbol}</TableCell>
                          <TableCell>${stock.price}</TableCell>
                          <TableCell>
                            <div className={`flex items-center ${parseFloat(stock.changePercentage) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {parseFloat(stock.changePercentage) >= 0 ? (
                                <ArrowUpRight className="h-4 w-4 mr-1" />
                              ) : (
                                <ArrowDownRight className="h-4 w-4 mr-1" />
                              )}
                              {stock.changePercentage}%
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => handleRemoveFromWatchlist(stock.symbol)}>
                                <Star className="h-4 w-4 fill-current text-amber-400" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleBuy(stock.symbol)}>
                                <ArrowUpRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="market" className="pt-4">
              <div className="overflow-auto max-h-[20rem]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Change</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formattedMarketData.map((stock) => (
                      <TableRow key={stock.symbol}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{stock.symbol}</span>
                            <span className="text-xs text-muted-foreground">{stock.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>${stock.price}</TableCell>
                        <TableCell>
                          <div className={`flex items-center ${parseFloat(stock.changePercentage) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {parseFloat(stock.changePercentage) >= 0 ? (
                              <ArrowUpRight className="h-4 w-4 mr-1" />
                            ) : (
                              <ArrowDownRight className="h-4 w-4 mr-1" />
                            )}
                            {stock.changePercentage}%
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {isInWatchlist(stock.symbol) ? (
                              <Button variant="ghost" size="icon" onClick={() => handleRemoveFromWatchlist(stock.symbol)}>
                                <Star className="h-4 w-4 fill-current text-amber-400" />
                              </Button>
                            ) : (
                              <Button variant="ghost" size="icon" onClick={() => handleAddToWatchlist(stock.symbol)}>
                                <Star className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" onClick={() => handleBuy(stock.symbol)}>
                              <ArrowUpRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="pt-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium">Market News</h3>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                View All
              </Button>
            </div>
            <div className="space-y-3">
              {marketNewsLoading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : (
                marketNews.slice(0, 3).map((news) => (
                  <div key={news.id} className="flex justify-between border-b pb-2 last:border-0">
                    <div className="pr-2">
                      <p className="text-sm font-medium line-clamp-2">{news.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{news.source}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">{formatNewsDate(news.date)}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" asChild>
                      <a href={news.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketWatch;
