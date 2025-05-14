import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  TrendingUp, 
  Download, 
  Share2, 
  Copy, 
  ExternalLink, 
  Image as ImageIcon,
  FileText,
  Mail,
  MessageSquare
} from 'lucide-react';
import { getMarketingMaterials, getMarketingStats } from '@/services/marketingService';
import { formatCurrency, formatDate } from '@/lib/utils';

const Marketing: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentTab, setCurrentTab] = useState('overview');
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  // Fetch marketing materials
  const { data: marketingMaterials = [], isLoading: materialsLoading } = useQuery({
    queryKey: ['marketing-materials', user?.id],
    queryFn: () => getMarketingMaterials(),
    staleTime: 600000 // 10 minutes
  });

  // Fetch marketing stats
  const { data: marketingStats, isLoading: statsLoading } = useQuery({
    queryKey: ['marketing-stats', user?.id],
    queryFn: () => getMarketingStats(user?.id),
    enabled: !!user?.id,
    staleTime: 300000 // 5 minutes
  });

  const copyToClipboard = (text: string, itemId: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedItem(itemId);
      toast({
        title: 'Copied!',
        description: 'Content copied to clipboard',
      });
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedItem(null), 2000);
    }).catch(err => {
      toast({
        title: 'Copy failed',
        description: 'Could not copy to clipboard',
        variant: 'destructive'
      });
    });
  };

  const downloadMaterial = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: 'Download Started',
      description: `Downloading ${filename}`,
    });
  };

  const shareContent = async (title: string, text: string, url: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url,
        });
        
        toast({
          title: 'Shared!',
          description: 'Content shared successfully',
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      copyToClipboard(url, 'share-url');
    }
  };

  const renderMaterialItem = (material: any) => {
    const materialId = `material-${material.id}`;
    
    return (
      <Card key={material.id} className="overflow-hidden">
        {material.thumbnailUrl && (
          <div className="relative h-48 bg-gray-100 dark:bg-gray-800">
            <img 
              src={material.thumbnailUrl} 
              alt={material.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <CardHeader className="pb-2">
          <CardTitle>{material.title}</CardTitle>
          <CardDescription>{material.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="outline">{material.type}</Badge>
            <Badge variant="outline">{material.format}</Badge>
            {material.tags.map((tag: string) => (
              <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
          </div>
          
          {material.embedCode && (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Embed Code</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => copyToClipboard(material.embedCode, `${materialId}-embed`)}
                >
                  {copiedItem === `${materialId}-embed` ? 'Copied!' : 'Copy'}
                </Button>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-md overflow-x-auto">
                <pre className="text-xs">{material.embedCode}</pre>
              </div>
            </div>
          )}
          
          {material.trackingLink && (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Tracking Link</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => copyToClipboard(material.trackingLink, `${materialId}-link`)}
                >
                  {copiedItem === `${materialId}-link` ? 'Copied!' : 'Copy'}
                </Button>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-md overflow-x-auto">
                <code className="text-xs break-all">{material.trackingLink}</code>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => downloadMaterial(material.downloadUrl, material.filename)}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => shareContent(
              material.title,
              material.description,
              material.shareUrl || material.downloadUrl
            )}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Marketing Center</CardTitle>
          <CardDescription>Access marketing materials and track your performance</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" onValueChange={setCurrentTab}>
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="overview">
                <TrendingUp className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="banners">
                <ImageIcon className="h-4 w-4 mr-2" />
                Banners & Images
              </TabsTrigger>
              <TabsTrigger value="content">
                <FileText className="h-4 w-4 mr-2" />
                Text & Email Templates
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              {/* Marketing Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center">
                      <MessageSquare className="h-8 w-8 text-primary mb-2" />
                      <h3 className="text-lg font-medium">Total Clicks</h3>
                      <p className="text-3xl font-bold">
                        {statsLoading ? (
                          <span className="animate-pulse">...</span>
                        ) : (
                          marketingStats?.totalClicks || 0
                        )}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center">
                      <Mail className="h-8 w-8 text-primary mb-2" />
                      <h3 className="text-lg font-medium">Conversions</h3>
                      <p className="text-3xl font-bold">
                        {statsLoading ? (
                          <span className="animate-pulse">...</span>
                        ) : (
                          marketingStats?.conversions || 0
                        )}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center">
                      <TrendingUp className="h-8 w-8 text-primary mb-2" />
                      <h3 className="text-lg font-medium">Conversion Rate</h3>
                      <p className="text-3xl font-bold">
                        {statsLoading ? (
                          <span className="animate-pulse">...</span>
                        ) : (
                          `${marketingStats?.conversionRate || 0}%`
                        )}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Marketing Tips */}
              <Card>
                <CardHeader>
                  <CardTitle>Marketing Tips</CardTitle>
                  <CardDescription>Best practices to maximize your marketing efforts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                      <span className="font-bold text-primary">1</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Use Your Unique Tracking Links</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Always use the provided tracking links to ensure your referrals are properly attributed to your account.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                      <span className="font-bold text-primary">2</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Target the Right Audience</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Focus on promoting to people who are interested in finance, investing, or cryptocurrency.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                      <span className="font-bold text-primary">3</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Be Transparent</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Always be honest about the platform and avoid making unrealistic promises about returns.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                      <span className="font-bold text-primary">4</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Use Multiple Channels</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Promote across different platforms like social media, email, blogs, and forums for maximum reach.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Featured Materials */}
              <div>
                <h3 className="text-lg font-medium mb-4">Featured Materials</h3>
                {materialsLoading ? (
                  <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {marketingMaterials
                      .filter((material: any) => material.featured)
                      .slice(0, 4)
                      .map((material: any) => renderMaterialItem(material))}
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="banners" className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Banner Images</h3>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download All
                </Button>
              </div>
              
              {materialsLoading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {marketingMaterials
                    .filter((material: any) => material.type === 'banner' || material.type === 'image')
                    .map((material: any) => renderMaterialItem(material))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="content" className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Text & Email Templates</h3>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download All
                </Button>
              </div>
              
              {materialsLoading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {marketingMaterials
                    .filter((material: any) => 
                      material.type === 'email' || 
                      material.type === 'text' || 
                      material.type === 'social'
                    )
                    .map((material: any) => renderMaterialItem(material))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Marketing;
