import React from 'react';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

const VideoSection: React.FC = () => {
  const handleWatchDemo = () => {
    // You can add a link to an external video or demo here
    console.log('Demo video clicked');
  };

  return (
    <div id="video" className="py-16 bg-gray-50 dark:bg-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-secondary dark:text-white sm:text-4xl">
            Discover Axix Finance
          </h2>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Explore our innovative investment solutions and start growing your wealth today.
          </p>
        </div>

        <div className="relative rounded-xl overflow-hidden shadow-2xl mx-auto max-w-4xl bg-gradient-to-br from-blue-600 to-purple-700">
          <div className="aspect-video flex items-center justify-center">
            <div className="text-center text-white">
              <div className="mb-6">
                <div className="w-20 h-20 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-4">
                  <Play className="h-8 w-8 ml-1" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Watch Our Demo</h3>
                <p className="text-white/80 mb-6">See how Axix Finance can transform your investment journey</p>
              </div>
              <Button 
                onClick={handleWatchDemo}
                className="bg-white text-blue-600 hover:bg-white/90 px-8 py-3"
              >
                Watch Demo Video
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoSection;