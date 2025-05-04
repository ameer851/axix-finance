import React from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

const Pricing: React.FC = () => {
  const plans = [
    {
      name: "Basic",
      description: "Perfect for individuals getting started with financial management.",
      price: "$0",
      features: [
        "Personal dashboard",
        "Basic portfolio tracking",
        "Up to 5 transactions per month"
      ],
      cta: "Start for free",
      href: "/register",
      highlighted: false
    },
    {
      name: "Pro",
      description: "Ideal for active investors and small businesses.",
      price: "$29",
      features: [
        "All Basic features",
        "Advanced analytics",
        "Unlimited transactions",
        "Priority support"
      ],
      cta: "Start free trial",
      href: "/register",
      highlighted: true
    },
    {
      name: "Enterprise",
      description: "For organizations requiring custom solutions and dedicated support.",
      price: "$99",
      features: [
        "All Pro features",
        "Custom reporting",
        "Dedicated account manager",
        "API access & custom integrations"
      ],
      cta: "Contact sales",
      href: "/register",
      highlighted: false
    }
  ];

  return (
    <div id="pricing" className="bg-gray-100 dark:bg-neutral-800">
      <div className="pt-12 sm:pt-16 lg:pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl lg:text-5xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-300">
              No hidden fees. No surprises. Start with our free plan or upgrade for more features.
            </p>
          </div>
        </div>
      </div>
      <div className="mt-8 pb-16 sm:mt-12 sm:pb-20 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0 xl:grid-cols-3">
            {plans.map((plan, index) => (
              <div 
                key={index} 
                className={`border ${plan.highlighted ? 'border-primary-500' : 'border-gray-200 dark:border-gray-700'} rounded-lg shadow-sm divide-y divide-gray-200 dark:divide-gray-700`}
              >
                <div className="p-6">
                  <h2 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">{plan.name}</h2>
                  <p className="mt-4 text-sm text-gray-500 dark:text-gray-300">{plan.description}</p>
                  <p className="mt-8">
                    <span className="text-4xl font-extrabold text-gray-900 dark:text-white">{plan.price}</span>
                    <span className="text-base font-medium text-gray-500 dark:text-gray-300">/month</span>
                  </p>
                  <Link href={plan.href}>
                    <Button className="mt-8 block w-full bg-primary-600 hover:bg-primary-700">
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
                <div className="pt-6 pb-8 px-6">
                  <h3 className="text-xs font-medium text-gray-900 dark:text-white tracking-wide uppercase">What's included</h3>
                  <ul className="mt-6 space-y-4">
                    {plan.features.map((feature, featIndex) => (
                      <li key={featIndex} className="flex space-x-3">
                        <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                        <span className="text-sm text-gray-500 dark:text-gray-300">{feature}</span>
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
