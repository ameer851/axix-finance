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

// Mock market data
const mockMarketData = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: '185.92', change: '2.45', changePercentage: '1.32' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', price: '412.65', change: '5.78', changePercentage: '1.40' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: '174.23', change: '-1.32', changePercentage: '-0.75' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: '182.50', change: '3.25', changePercentage: '1.78' },
  { symbol: 'TSLA', name: 'Tesla, Inc.', price: '177.35', change: '-4.20', changePercentage: '-2.31' },
  { symbol: 'META', name: 'Meta Platforms, Inc.', price: '478.22', change: '6.75', changePercentage: '1.41' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', price: '924.67', change: '15.32', changePercentage: '1.66' },
  { symbol: 'BRK.B', name: 'Berkshire Hathaway Inc.', price: '412.78', change: '-2.15', changePercentage: '-0.52' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', price: '198.45', change: '1.23', changePercentage: '0.62' },
  { symbol: 'V', name: 'Visa Inc.', price: '278.90', change: '3.45', changePercentage: '1.24' }
];

// Mock watchlist
const mockWatchlist = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'];

// Mock market news
const mockMarketNews = [
  {
    id: '1',
    title: 'Fed signals potential interest rate cut later this year',
    source: 'Financial Times',
    date: '2025-05-12T08:30:00Z',
    url: 'https://example.com/news/1'
  },
  {
    id: '2',
    title: 'Tech stocks rally as inflation concerns ease',
    source: 'Wall Street Journal',
    date: '2025-05-12T07:15:00Z',
    url: 'https://example.com/news/2'
  },
  {
    id: '3',
    title: 'Oil prices drop amid increased production',
    source: 'Bloomberg',
    date: '2025-05-11T22:45:00Z',
    url: 'https://example.com/news/3'
  },
  {
    id: '4',
    title: 'Retail sales exceed expectations in April',
    source: 'CNBC',
    date: '2025-05-11T16:20:00Z',
    url: 'https://example.com/news/4'
  },
  {
    id: '5',
    title: 'New AI regulations proposed by EU commission',
    source: 'Reuters',
    date: '2025-05-11T14:10:00Z',
    url: 'https://example.com/news/5'
  }
];

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
  const { data: marketData = mockMarketData, isLoading: marketDataLoading, refetch: refetchMarketData } = useQuery({
    queryKey: ['marketData'],
    queryFn: async () => {
      try {
        // In a real app, this would be an API call
        // For now, we'll use mock data
        return mockMarketData;
      } catch (error) {
        console.error('Error fetching market data:', error);
        throw error;
      }
    }
  });
  
  // Fetch watchlist
  const { data: watchlist = mockWatchlist, isLoading: watchlistLoading } = useQuery({
    queryKey: ['watchlist', user?.id],
    queryFn: async () => {
      try {
        // In a real app, this would be an API call
        // For now, we'll use mock data
        return mockWatchlist;
      } catch (error) {
        console.error('Error fetching watchlist:', error);
        throw error;
      }
    },
    enabled: !!user?.id
  });
  
  // Fetch market news
  const { data: marketNews = mockMarketNews, isLoading: marketNewsLoading } = useQuery({
    queryKey: ['marketNews'],
    queryFn: async () => {
      try {
        // In a real app, this would be an API call
        // For now, we'll use mock data
        return mockMarketNews;
      } catch (error) {
        console.error('Error fetching market news:', error);
        throw error;
      }
    }
  });
  
  // Format currency
  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(typeof value === 'string' ? parseFloat(value) : value);
  };
  
  // Format percentage
  const formatPercentage = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return `${numValue >= 0 ? '+' : ''}${numValue.toFixed(2)}%`;
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHrs < 24) {
      return `${diffHrs} ${diffHrs === 1 ? 'hour' : 'hours'} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };
  
  // Filter market data based on search query
  const filteredMarketData = marketData.filter(item => 
    item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Get watchlist data
  const watchlistData = marketData.filter(item => watchlist.includes(item.symbol));
  
  // Get top gainers
  const topGainers = [...marketData]
    .sort((a, b) => parseFloat(b.changePercentage) - parseFloat(a.changePercentage))
    .slice(0, 5);
  
  // Get top losers
  const topLosers = [...marketData]
    .sort((a, b) => parseFloat(a.changePercentage) - parseFloat(b.changePercentage))
    .slice(0, 5);
  
  // Check if a symbol is in watchlist
  const isInWatchlist = (symbol: string) => watchlist.includes(symbol);
  
  // Handle add/remove from watchlist
  const handleWatchlistToggle = (symbol: string) => {
    if (isInWatchlist(symbol)) {
      onRemoveFromWatchlist?.(symbol);
    } else {
      onAddToWatchlist?.(symbol);
    }
  };
  
  if (marketDataLoading || watchlistLoading || marketNewsLoading) {
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
  
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Market Watch</CardTitle>
          <CardDescription>Track market trends and your watchlist</CardDescription>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => refetchMarketData()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="watchlist" onValueChange={setActiveTab} value={activeTab}>
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
            <TabsTrigger value="market">Market</TabsTrigger>
            <TabsTrigger value="movers">Top Movers</TabsTrigger>
            <TabsTrigger value="news">News</TabsTrigger>
          </TabsList>
          
          {/* Watchlist Tab */}
          <TabsContent value="watchlist">
            {watchlistData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <p className="text-muted-foreground mb-4">Your watchlist is empty</p>
                <Button variant="outline" onClick={() => setActiveTab('market')}>
                  <Star className="h-4 w-4 mr-2" />
                  Add symbols to your watchlist
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Change</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {watchlistData.map((item) => (
                    <TableRow key={item.symbol}>
                      <TableCell className="font-medium">{item.symbol}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                      <TableCell className={`text-right ${
                        parseFloat(item.changePercentage) >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {formatPercentage(item.changePercentage)}
                        {parseFloat(item.changePercentage) >= 0 
                          ? <ArrowUpRight className="inline h-4 w-4 ml-1" /> 
                          : <ArrowDownRight className="inline h-4 w-4 ml-1" />
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleWatchlistToggle(item.symbol)}
                          >
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => onBuy?.(item.symbol)}
                          >
                            Buy
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
          
          {/* Market Tab */}
          <TabsContent value="market">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by symbol or company name"
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Change</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMarketData.map((item) => (
                  <TableRow key={item.symbol}>
                    <TableCell className="font-medium">{item.symbol}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                    <TableCell className={`text-right ${
                      parseFloat(item.changePercentage) >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {formatPercentage(item.changePercentage)}
                      {parseFloat(item.changePercentage) >= 0 
                        ? <ArrowUpRight className="inline h-4 w-4 ml-1" /> 
                        : <ArrowDownRight className="inline h-4 w-4 ml-1" />
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleWatchlistToggle(item.symbol)}
                        >
                          <Star className={`h-4 w-4 ${
                            isInWatchlist(item.symbol) ? 'fill-yellow-400 text-yellow-400' : ''
                          }`} />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onBuy?.(item.symbol)}
                        >
                          Buy
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
          
          {/* Top Movers Tab */}
          <TabsContent value="movers">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Gainers */}
              <div>
                <h3 className="text-lg font-medium mb-4">Top Gainers</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Change</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topGainers.map((item) => (
                      <TableRow key={item.symbol}>
                        <TableCell className="font-medium">{item.symbol}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                        <TableCell className="text-right text-green-500">
                          {formatPercentage(item.changePercentage)}
                          <ArrowUpRight className="inline h-4 w-4 ml-1" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Top Losers */}
              <div>
                <h3 className="text-lg font-medium mb-4">Top Losers</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Change</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topLosers.map((item) => (
                      <TableRow key={item.symbol}>
                        <TableCell className="font-medium">{item.symbol}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                        <TableCell className="text-right text-red-500">
                          {formatPercentage(item.changePercentage)}
                          <ArrowDownRight className="inline h-4 w-4 ml-1" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
          
          {/* News Tab */}
          <TabsContent value="news">
            <div className="space-y-4">
              {marketNews.map((news) => (
                <Card key={news.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h4 className="font-medium">{news.title}</h4>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <span className="mr-2">{news.source}</span>
                          <span>•</span>
                          <span className="ml-2">{formatDate(news.date)}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={news.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default MarketWatch;
