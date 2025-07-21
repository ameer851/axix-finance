import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Clock, Share2, Image as ImageIcon, FileText, Mail, MessageSquare, TrendingUp } from 'lucide-react';

const Marketing: React.FC = () => {
  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Share2 className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Marketing Materials</CardTitle>
          <CardDescription className="text-lg">
            Access professional marketing content to promote CaraxFinance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 max-w-md">
                <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-2xl font-semibold text-gray-700 mb-3">Coming Soon</h3>
                <p className="text-gray-500">
                  Our marketing materials library is currently being developed. Soon you'll have access to 
                  professional banners, images, and content to help you promote Axix Finance effectively.
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg text-center border border-purple-200">
              <ImageIcon className="h-10 w-10 text-purple-600 mx-auto mb-3" />
              <h4 className="font-semibold text-purple-800 mb-2">Banner Images</h4>
              <p className="text-sm text-purple-600">Professional banners in various sizes for websites and social media</p>
            </div>
            
            <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg text-center border border-green-200">
              <FileText className="h-10 w-10 text-green-600 mx-auto mb-3" />
              <h4 className="font-semibold text-green-800 mb-2">Content Templates</h4>
              <p className="text-sm text-green-600">Ready-to-use content templates for blogs and articles</p>
            </div>
            
            <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg text-center border border-blue-200">
              <Mail className="h-10 w-10 text-blue-600 mx-auto mb-3" />
              <h4 className="font-semibold text-blue-800 mb-2">Email Templates</h4>
              <p className="text-sm text-blue-600">Professional email templates for outreach campaigns</p>
            </div>
            
            <div className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg text-center border border-orange-200">
              <MessageSquare className="h-10 w-10 text-orange-600 mx-auto mb-3" />
              <h4 className="font-semibold text-orange-800 mb-2">Social Media Kit</h4>
              <p className="text-sm text-orange-600">Complete social media package with posts and stories</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="p-6 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-200">
              <TrendingUp className="h-8 w-8 text-indigo-600 mb-3" />
              <h4 className="font-semibold text-indigo-800 mb-2">Performance Analytics</h4>
              <p className="text-indigo-600">Track the performance of your marketing campaigns with detailed analytics</p>
            </div>
            
            <div className="p-6 bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg border border-pink-200">
              <Share2 className="h-8 w-8 text-pink-600 mb-3" />
              <h4 className="font-semibold text-pink-800 mb-2">Easy Sharing Tools</h4>
              <p className="text-pink-600">One-click sharing tools for all major social media platforms</p>
            </div>
          </div>
          
          <div className="mt-8 p-6 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
            <div className="text-center">
              <h4 className="text-xl font-semibold text-amber-800 mb-2">🎨 What's Coming</h4>
              <p className="text-amber-700 mb-4">
                We're creating a comprehensive marketing toolkit that will include:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white bg-opacity-60 p-3 rounded border border-amber-200">
                  <strong>Visual Assets:</strong> High-quality banners, logos, and infographics
                </div>
                <div className="bg-white bg-opacity-60 p-3 rounded border border-amber-200">
                  <strong>Content Library:</strong> Pre-written articles, social media posts, and email campaigns
                </div>
                <div className="bg-white bg-opacity-60 p-3 rounded border border-amber-200">
                  <strong>Analytics Dashboard:</strong> Real-time tracking of your marketing performance
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Marketing;
