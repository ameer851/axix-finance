import React, { useState } from 'react';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';

const VideoSection: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  const handlePlayVideo = () => {
    setShowVideo(true);
    setIsPlaying(true);
  };

  const handleVideoClick = () => {
    const video = document.getElementById('main-video') as HTMLVideoElement;
    if (video) {
      if (isPlaying) {
        video.pause();
        setIsPlaying(false);
      } else {
        video.play();
        setIsPlaying(true);
      }
    }
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

        <div className="relative rounded-xl overflow-hidden shadow-2xl mx-auto max-w-4xl">
          {!showVideo ? (
            <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700 cursor-pointer" onClick={handlePlayVideo}>
              <div className="text-center text-white">
                <div className="mb-6">
                  <div className="w-20 h-20 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-4 hover:bg-white/30 transition-colors">
                    <Play className="h-8 w-8 ml-1" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Watch Our Demo</h3>
                  <p className="text-white/80 mb-6">See how Axix Finance can transform your investment journey</p>
                </div>
                <Button 
                  className="bg-white text-blue-600 hover:bg-white/90 px-8 py-3"
                >
                  Watch Demo Video
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative aspect-video">
              <video
                id="main-video"
                className="w-full h-full object-cover cursor-pointer"
                controls
                autoPlay
                onClick={handleVideoClick}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              >
                <source src="/video/axixvid.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {!isPlaying && (
                  <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center">
                    <Play className="h-6 w-6 text-white ml-1" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoSection;