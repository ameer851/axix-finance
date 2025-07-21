import React from 'react';

// Example images (replace with your own as needed)
import img1 from '@/assets/images/Tesla.png';
import img2 from '@/assets/images/Tesla2.jpg';
import img3 from '@/assets/images/Starlink.jpg';
import img4 from '@/assets/images/tesla3.jpg';

const images = [img1, img2, img3, img4];

const WinPrizesSection: React.FC = () => {
  return (
    <section className="py-16 bg-white dark:bg-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-secondary dark:text-white sm:text-4xl mb-4">
            Win Prizes with Axix Finance
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Early payment helps increase your chance of winning. Register, credit your account, and you could win exciting prizes!
          </p>
        </div>
        <div className="flex flex-col items-center mb-8">
          <span className="text-5xl font-bold text-primary mb-2">93%</span>
          <span className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-2">Chances of Winning</span>
          <div className="w-full max-w-xl h-3 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-primary" style={{ width: '93%' }}></div>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-2">Most people believe that success is difficult, but it's easy with Axix Finance.</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-10">
          {images.map((src, i) => (
            <div key={i} className="rounded-xl overflow-hidden shadow-md bg-white flex items-center justify-center p-3">
              <img src={src} alt={`Prize ${i+1}`} className="object-contain h-32 w-full bg-white" style={{backgroundColor: 'white'}} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WinPrizesSection;
