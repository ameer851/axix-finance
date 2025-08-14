import { Button } from "@/components/ui/button";
import { BarChart2, DollarSign, TrendingUp, Users } from "lucide-react";
import React from "react";
import { Link } from "wouter";
import TradingViewWidget from "./TradingViewWidget";

const Hero: React.FC = () => {
  return (
    <div className="relative bg-white dark:bg-secondary overflow-hidden">
      <div className="w-full">
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

          <main className="pt-10 sm:pt-16 md:pt-20 lg:pt-24 xl:pt-28 max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="sm:text-center lg:text-left">
              <h1 className="text-3xl tracking-tight font-extrabold text-secondary dark:text-white sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
                <span className="block xl:inline">Invest with </span>
                <span className="block text-primary xl:inline bg-gradient-to-r from-primary to-amber-600 bg-clip-text text-transparent">
                  Axix Finance
                </span>
              </h1>
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 sm:mt-4 sm:text-base sm:max-w-xl sm:mx-auto md:mt-6 md:text-lg lg:text-xl lg:mx-0 lg:max-w-2xl leading-relaxed">
                Secure your financial future with our premium investment
                platform. Start earning daily returns on your investments with
                our professionally managed investment plans.
              </p>

              {/* TradingView Widget - Now visible on all devices */}
              <div className="mt-6 mb-4 sm:mt-8 sm:mb-6">
                <TradingViewWidget />
              </div>

              <div className="mt-6 sm:mt-8 flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:justify-center lg:justify-start sm:space-x-4">
                <div className="rounded-xl shadow-lg">
                  <Link href="/register">
                    <Button className="w-full flex items-center justify-center px-6 py-3 text-sm font-semibold rounded-xl text-white bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 sm:px-8 sm:py-4 lg:px-10 lg:py-4 lg:text-base">
                      Start Investing
                    </Button>
                  </Link>
                </div>
                <div>
                  <a href="#pricing">
                    <Button
                      variant="outline"
                      className="w-full flex items-center justify-center px-6 py-3 text-sm font-semibold rounded-xl border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all duration-300 transform hover:scale-105 sm:px-8 sm:py-4 lg:px-10 lg:py-4 lg:text-base"
                    >
                      View Plans
                    </Button>
                  </a>
                </div>
              </div>

              {/* Key Stats - Mobile and Tablet */}
              <div className="lg:hidden mt-8 grid grid-cols-2 gap-3 max-w-xs mx-auto sm:max-w-sm sm:gap-4">
                <div className="bg-primary/10 rounded-lg p-3 text-center sm:p-4">
                  <div className="text-xl font-bold text-primary sm:text-2xl">
                    7.5%
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300 sm:text-sm">
                    Daily Returns
                  </div>
                </div>
                <div className="bg-primary/10 rounded-lg p-3 text-center sm:p-4">
                  <div className="text-xl font-bold text-primary sm:text-2xl">
                    10%
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300 sm:text-sm">
                    Referral Bonus
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Feature Cards - Below main content */}
      <div className="lg:hidden bg-gradient-to-br from-primary to-amber-700 py-8">
        <div className="max-w-md mx-auto px-4">
          <div className="text-white text-center grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center p-4 bg-white/15 rounded-xl backdrop-blur-md">
              <TrendingUp className="w-8 h-8 mb-2" />
              <h3 className="text-sm font-bold mb-1">Daily Returns</h3>
              <p className="text-xs opacity-90">Consistent</p>
            </div>
            <div className="flex flex-col items-center p-4 bg-white/15 rounded-xl backdrop-blur-md">
              <DollarSign className="w-8 h-8 mb-2" />
              <h3 className="text-sm font-bold mb-1">Up to 7.5%</h3>
              <p className="text-xs opacity-90">High returns</p>
            </div>
            <div className="flex flex-col items-center p-4 bg-white/15 rounded-xl backdrop-blur-md">
              <BarChart2 className="w-8 h-8 mb-2" />
              <h3 className="text-sm font-bold mb-1">Multiple Plans</h3>
              <p className="text-xs opacity-90">Flexible</p>
            </div>
            <div className="flex flex-col items-center p-4 bg-white/15 rounded-xl backdrop-blur-md">
              <Users className="w-8 h-8 mb-2" />
              <h3 className="text-sm font-bold mb-1">10% Referrals</h3>
              <p className="text-xs opacity-90">Earn more</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Feature Cards - Desktop Only */}
      <div className="hidden lg:block lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
        <div className="h-full w-full bg-gradient-to-br from-primary via-primary to-amber-700 flex items-center justify-center relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-black/5"></div>

          <div className="relative text-white text-center p-6 grid grid-cols-2 gap-6 max-w-lg mx-auto">
            <div className="flex flex-col items-center p-6 bg-white/15 rounded-2xl backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
              <TrendingUp className="w-12 h-12 xl:w-16 xl:h-16 mb-4" />
              <h3 className="text-lg xl:text-xl font-bold mb-2">
                Daily Returns
              </h3>
              <p className="text-sm xl:text-base opacity-90">
                Consistent profits
              </p>
            </div>
            <div className="flex flex-col items-center p-6 bg-white/15 rounded-2xl backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
              <DollarSign className="w-12 h-12 xl:w-16 xl:h-16 mb-4" />
              <h3 className="text-lg xl:text-xl font-bold mb-2">
                Up to 7.5% Daily
              </h3>
              <p className="text-sm xl:text-base opacity-90">High returns</p>
            </div>
            <div className="flex flex-col items-center p-6 bg-white/15 rounded-2xl backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
              <BarChart2 className="w-12 h-12 xl:w-16 xl:h-16 mb-4" />
              <h3 className="text-lg xl:text-xl font-bold mb-2">
                Multiple Plans
              </h3>
              <p className="text-sm xl:text-base opacity-90">
                Flexible options
              </p>
            </div>
            <div className="flex flex-col items-center p-6 bg-white/15 rounded-2xl backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
              <Users className="w-12 h-12 xl:w-16 xl:h-16 mb-4" />
              <h3 className="text-lg xl:text-xl font-bold mb-2">
                10% Referrals
              </h3>
              <p className="text-sm xl:text-base opacity-90">Earn more</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
