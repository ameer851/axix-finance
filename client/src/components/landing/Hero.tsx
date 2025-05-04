import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { TrendingUp, DollarSign, BarChart2, Users } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <div className="relative bg-white dark:bg-secondary overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="relative z-10 pb-8 bg-white dark:bg-secondary sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
          <svg
            className="hidden lg:block absolute right-0 inset-y-0 h-full w-48 text-white dark:text-secondary transform translate-x-1/2"
            fill="currentColor"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <polygon points="50,0 100,0 50,100 0,100" />
          </svg>

          <main className="pt-10 mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
            <div className="sm:text-center lg:text-left">
              <h1 className="text-4xl tracking-tight font-extrabold text-secondary dark:text-white sm:text-5xl md:text-6xl">
                <span className="block xl:inline">Invest with </span>{' '}
                <span className="block text-primary xl:inline bg-gradient-to-r from-primary to-amber-600 bg-clip-text text-transparent">Carax Finance</span>
              </h1>
              <p className="mt-3 text-base text-gray-600 dark:text-gray-300 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                Secure your financial future with our premium investment platform. Start earning daily returns on your investments with our professionally managed investment plans.
              </p>
              <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                <div className="rounded-md shadow">
                  <Link href="/register">
                    <Button className="w-full flex items-center justify-center px-8 py-3 text-base font-medium rounded-md text-white md:py-4 md:text-lg md:px-10">
                      Start Investing
                    </Button>
                  </Link>
                </div>
                <div className="mt-3 sm:mt-0 sm:ml-3">
                  <a href="#pricing">
                    <Button variant="outline" className="w-full flex items-center justify-center px-8 py-3 text-base font-medium rounded-md md:py-4 md:text-lg md:px-10">
                      View Plans
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
      <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
        <div className="h-56 w-full bg-gradient-to-br from-primary to-amber-700 flex items-center justify-center sm:h-72 md:h-96 lg:w-full lg:h-full">
          <div className="text-white text-center p-4 grid grid-cols-2 gap-6">
            <div className="flex flex-col items-center p-4 bg-white/10 rounded-lg backdrop-blur-sm">
              <TrendingUp className="w-12 h-12 mb-2" />
              <p className="text-lg font-medium">Daily Returns</p>
            </div>
            <div className="flex flex-col items-center p-4 bg-white/10 rounded-lg backdrop-blur-sm">
              <DollarSign className="w-12 h-12 mb-2" />
              <p className="text-lg font-medium">Up to 7.5% Daily</p>
            </div>
            <div className="flex flex-col items-center p-4 bg-white/10 rounded-lg backdrop-blur-sm">
              <BarChart2 className="w-12 h-12 mb-2" />
              <p className="text-lg font-medium">Multiple Plans</p>
            </div>
            <div className="flex flex-col items-center p-4 bg-white/10 rounded-lg backdrop-blur-sm">
              <Users className="w-12 h-12 mb-2" />
              <p className="text-lg font-medium">10% Referrals</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
