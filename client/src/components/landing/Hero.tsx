import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

const Hero: React.FC = () => {
  return (
    <div className="relative bg-white dark:bg-neutral-900 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="relative z-10 pb-8 bg-white dark:bg-neutral-900 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
          <svg
            className="hidden lg:block absolute right-0 inset-y-0 h-full w-48 text-white dark:text-neutral-900 transform translate-x-1/2"
            fill="currentColor"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <polygon points="50,0 100,0 50,100 0,100" />
          </svg>

          <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
            <div className="sm:text-center lg:text-left">
              <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
                <span className="block xl:inline">Modern finance</span>{' '}
                <span className="block text-primary-600 dark:text-primary-400 xl:inline">for everyone</span>
              </h1>
              <p className="mt-3 text-base text-gray-500 dark:text-gray-300 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                Take control of your financial future with our secure, user-friendly platform. Track investments, manage transactions, and achieve your financial goals.
              </p>
              <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                <div className="rounded-md shadow">
                  <Link href="/register">
                    <Button className="w-full flex items-center justify-center px-8 py-3 text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 md:py-4 md:text-lg md:px-10">
                      Get Started
                    </Button>
                  </Link>
                </div>
                <div className="mt-3 sm:mt-0 sm:ml-3">
                  <a href="#features">
                    <Button variant="outline" className="w-full flex items-center justify-center px-8 py-3 text-base font-medium rounded-md text-primary-700 bg-primary-100 dark:bg-primary-900 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-800 md:py-4 md:text-lg md:px-10">
                      Learn More
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
      <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
        <div className="h-56 w-full bg-gradient-to-r from-primary-400 to-primary-600 flex items-center justify-center sm:h-72 md:h-96 lg:w-full lg:h-full">
          <div className="text-white text-center p-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-48 h-48 mx-auto opacity-75" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="3" y1="9" x2="21" y2="9"></line>
              <line x1="9" y1="21" x2="9" y2="9"></line>
              <path d="M14 16a2 2 0 0 0-2-2c-1.5 0-2 .5-2 2s.5 2 2 2a2 2 0 0 0 2-2z"></path>
            </svg>
            <p className="text-xl font-medium mt-4">Financial Dashboard</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
