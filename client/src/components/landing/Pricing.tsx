import React from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

const Pricing: React.FC = () => {
  const plans = [
    {
      name: "STARTER PLAN",
      description: "Perfect for beginners starting their investment journey.",
      price: "$50-$999",
      returnRate: "2% daily for 3 days",
      features: [
        "Principal included",
        "10% referral commission",
        "Quick 3-day investment cycle",
        "Secure investment platform",
        "Daily returns directly to your account"
      ],
      cta: "Get Started",
      href: "/register",
      highlighted: false
    },
    {
      name: "PREMIUM PLAN",
      description: "For serious investors looking for higher returns.",
      price: "$1000-$4999",
      returnRate: "3.5% daily for 7 days",
      features: [
        "Principal included",
        "10% referral commission",
        "Extended 7-day investment cycle",
        "Priority customer support",
        "Higher daily percentage returns"
      ],
      cta: "Invest Now",
      href: "/register",
      highlighted: true
    },
    {
      name: "DELUX PLAN",
      description: "For experienced investors seeking substantial returns.",
      price: "$5000-$19999",
      returnRate: "5% daily for 10 days",
      features: [
        "Principal included",
        "10% referral commission",
        "Premium 10-day investment cycle",
        "VIP customer support",
        "Superior daily percentage returns"
      ],
      cta: "Invest Now",
      href: "/register",
      highlighted: false
    },
    {
      name: "LUXURY PLAN",
      description: "Our premium plan for high-volume investors.",
      price: "$20000-UNLIMITED",
      returnRate: "7.5% daily for 30 days",
      features: [
        "Principal included",
        "10% referral commission",
        "Extended 30-day investment cycle",
        "Dedicated account manager",
        "Highest possible daily returns"
      ],
      cta: "Invest Now",
      href: "/register",
      highlighted: false
    }
  ];

  return (
    <div id="pricing" className="bg-accent dark:bg-accent">
      <div className="pt-12 sm:pt-16 lg:pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-secondary dark:text-white sm:text-4xl lg:text-5xl">
              Investment Plans
            </h2>
            <p className="mt-4 text-xl text-gray-700 dark:text-gray-300">
              Choose the investment plan that's right for you and start earning today.
            </p>
          </div>
        </div>
      </div>
      <div className="mt-8 pb-16 sm:mt-12 sm:pb-20 lg:pb-28">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          {/* Mobile: horizontal scroll, Desktop: grid */}
          <div className="mt-8 flex space-x-4 overflow-x-auto sm:mt-16 sm:space-x-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0 xl:grid-cols-4">
            {plans.map((plan, index) => (
              <div 
                key={index} 
                className={`min-w-[260px] max-w-xs flex-shrink-0 border ${plan.highlighted ? 'border-primary' : 'border-gray-200 dark:border-gray-700'} rounded-lg shadow-sm divide-y divide-gray-200 dark:divide-gray-700 ${plan.highlighted ? 'bg-primary/5' : 'bg-white dark:bg-secondary'} sm:min-w-0 sm:max-w-none`}
              >
                <div className="p-4 sm:p-6">
                  <h2 className="text-base sm:text-lg leading-6 font-bold text-primary dark:text-white">{plan.name}</h2>
                  <p className="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300">{plan.description}</p>
                  <p className="mt-4 sm:mt-6">
                    <span className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">{plan.price}</span>
                  </p>
                  <p className="mt-1 sm:mt-2">
                    <span className="text-base sm:text-lg font-semibold text-primary dark:text-primary-foreground">{plan.returnRate}</span>
                  </p>
                  <Link href={plan.href}>
                    <Button className="mt-4 sm:mt-8 block w-full text-xs sm:text-base py-2 sm:py-3">
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
                <div className="pt-4 sm:pt-6 pb-4 sm:pb-8 px-4 sm:px-6">
                  <h3 className="text-[10px] sm:text-xs font-medium text-gray-900 dark:text-white tracking-wide uppercase">Features</h3>
                  <ul className="mt-3 sm:mt-6 space-y-2 sm:space-y-4">
                    {plan.features.map((feature, featIndex) => (
                      <li key={featIndex} className="flex space-x-2 sm:space-x-3 items-center">
                        <Check className="flex-shrink-0 h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                        <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
