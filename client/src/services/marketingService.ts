import { apiRequest } from '@/lib/queryClient';

// Mock data for development
const MOCK_MARKETING_MATERIALS = [
  {
    id: 1,
    title: 'Axix Finance Banner - 728x90',
    description: 'Standard banner for websites and blogs',
    type: 'banner',
    format: 'image',
    thumbnailUrl: 'https://via.placeholder.com/728x90?text=Axix+Finance+Banner',
    downloadUrl: 'https://via.placeholder.com/728x90?text=Axix+Finance+Banner',
    shareUrl: 'https://axix-finance.co/ref?id=fiona500&banner=1',
    embedCode: '<a href="https://axix-finance.co/ref?id=fiona500&banner=1"><img src="https://via.placeholder.com/728x90?text=Axix+Finance+Banner" alt="Axix Finance" /></a>',
    trackingLink: 'https://axix-finance.co/ref?id=fiona500&banner=1',
    filename: 'axix-banner-728x90.jpg',
    featured: true,
    tags: ['banner', 'website']
  },
  {
    id: 2,
    title: 'Axix Finance Banner - 300x250',
    description: 'Medium rectangle banner for websites',
    type: 'banner',
    format: 'image',
    thumbnailUrl: 'https://via.placeholder.com/300x250?text=Axix+Finance',
    downloadUrl: 'https://via.placeholder.com/300x250?text=Axix+Finance',
    shareUrl: 'https://axix-finance.co/ref?id=fiona500&banner=2',
    embedCode: '<a href="https://axix-finance.co/ref?id=fiona500&banner=2"><img src="https://via.placeholder.com/300x250?text=Axix+Finance" alt="Axix Finance" /></a>',
    trackingLink: 'https://axix-finance.co/ref?id=fiona500&banner=2',
    filename: 'axix-banner-300x250.jpg',
    featured: false,
    tags: ['banner', 'website']
  },
  {
    id: 3,
    title: 'Email Template - Welcome',
    description: 'Email template for welcoming new referrals',
    type: 'email',
    format: 'html',
    thumbnailUrl: 'https://via.placeholder.com/600x400?text=Email+Template',
    downloadUrl: 'https://via.placeholder.com/600x400?text=Email+Template',
    shareUrl: 'https://axix-finance.co/ref?id=fiona500&template=welcome',
    embedCode: null,
    trackingLink: 'https://axix-finance.co/ref?id=fiona500&template=welcome',
    filename: 'welcome-email-template.html',
    featured: true,
    tags: ['email', 'welcome']
  },
  {
    id: 4,
    title: 'Social Media Post - Investment Returns',
    description: 'Ready-to-use social media post about investment returns',
    type: 'social',
    format: 'text',
    thumbnailUrl: 'https://via.placeholder.com/600x400?text=Social+Media+Post',
    downloadUrl: 'https://via.placeholder.com/600x400?text=Social+Media+Post',
    shareUrl: 'https://axix-finance.co/ref?id=fiona500&post=returns',
    embedCode: null,
    trackingLink: 'https://axix-finance.co/ref?id=fiona500&post=returns',
    filename: 'investment-returns-post.txt',
    featured: false,
    tags: ['social', 'returns']
  },
  {
    id: 5,
    title: 'Axix Finance Logo',
    description: 'High-resolution logo for print and digital use',
    type: 'image',
    format: 'png',
    thumbnailUrl: 'https://via.placeholder.com/500x500?text=Axix+Finance+Logo',
    downloadUrl: 'https://via.placeholder.com/500x500?text=Axix+Finance+Logo',
    shareUrl: 'https://axix-finance.co/ref?id=fiona500&asset=logo',
    embedCode: null,
    trackingLink: 'https://axix-finance.co/ref?id=fiona500&asset=logo',
    filename: 'axix-logo.png',
    featured: true,
    tags: ['logo', 'branding']
  },
  {
    id: 6,
    title: 'Promotional Video',
    description: 'Short promotional video explaining Axix Finance benefits',
    type: 'video',
    format: 'mp4',
    thumbnailUrl: 'https://via.placeholder.com/600x400?text=Promo+Video',
    downloadUrl: 'https://via.placeholder.com/600x400?text=Promo+Video',
    shareUrl: 'https://axix-finance.co/ref?id=fiona500&video=promo',
    embedCode: '<iframe width="560" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>',
    trackingLink: 'https://axix-finance.co/ref?id=fiona500&video=promo',
    filename: 'axix-promo-video.mp4',
    featured: true,
    tags: ['video', 'promotion']
  }
];

const MOCK_MARKETING_STATS = {
  totalClicks: 1247,
  conversions: 38,
  conversionRate: 3.05,
  clicksToday: 42,
  clicksThisWeek: 312,
  clicksThisMonth: 1247,
  topReferringSites: [
    { site: 'facebook.com', clicks: 423 },
    { site: 'twitter.com', clicks: 289 },
    { site: 'youtube.com', clicks: 156 },
    { site: 'reddit.com', clicks: 98 },
    { site: 'instagram.com', clicks: 87 }
  ],
  clicksByCountry: [
    { country: 'United States', clicks: 534 },
    { country: 'United Kingdom', clicks: 213 },
    { country: 'Canada', clicks: 156 },
    { country: 'Australia', clicks: 98 },
    { country: 'Germany', clicks: 87 }
  ],
  lastUpdated: new Date().toISOString()
};

/**
 * Get marketing materials
 */
export async function getMarketingMaterials(): Promise<any[]> {
  try {
    // In a real app, this would make an API call
    // const response = await apiRequest('GET', '/api/marketing/materials');
    // return await response.json();
    
    // For development, return mock data
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(MOCK_MARKETING_MATERIALS);
      }, 500);
    });
  } catch (error: any) {
    console.error('Error fetching marketing materials:', error);
    
    if (error.status === 403) {
      throw new Error('You do not have permission to view marketing materials.');
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error('Cannot connect to server. Please check your internet connection and try again.');
    }
    
    throw new Error(error.message || 'Failed to fetch marketing materials. Please try again later.');
  }
}

/**
 * Get marketing statistics for a user
 */
export async function getMarketingStats(userId?: number | string): Promise<any> {
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  try {
    // In a real app, this would make an API call
    // const response = await apiRequest('GET', `/api/marketing/stats/${userId}`);
    // return await response.json();
    
    // For development, return mock data
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(MOCK_MARKETING_STATS);
      }, 500);
    });
  } catch (error: any) {
    console.error('Error fetching marketing stats:', error);
    
    if (error.status === 403) {
      throw new Error('You do not have permission to view marketing statistics.');
    } else if (error.status === 404) {
      throw new Error('User not found.');
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error('Cannot connect to server. Please check your internet connection and try again.');
    }
    
    throw new Error(error.message || 'Failed to fetch marketing statistics. Please try again later.');
  }
}

/**
 * Track marketing link click
 */
export async function trackMarketingClick(data: {
  userId?: number | string;
  linkId: string;
  source?: string;
  campaign?: string;
  medium?: string;
}): Promise<{
  success: boolean;
  clickId: string;
}> {
  try {
    // In a real app, this would make an API call
    // const response = await apiRequest('POST', '/api/marketing/track', data);
    // return await response.json();
    
    // For development, return mock success
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          clickId: `click-${Math.floor(Math.random() * 10000)}`
        });
      }, 300);
    });
  } catch (error: any) {
    console.error('Error tracking marketing click:', error);
    
    if (error.status === 400) {
      throw new Error(error.message || 'Invalid tracking data. Please check your inputs.');
    } else if (error.isOffline || error.isNetworkError) {
      // For tracking, we might want to queue this for later if offline
      console.warn('Offline: Click tracking will be attempted later');
      return {
        success: false,
        clickId: ''
      };
    }
    
    // For tracking, we don't want to throw errors to the user
    console.error('Failed to track click:', error.message);
    return {
      success: false,
      clickId: ''
    };
  }
}
