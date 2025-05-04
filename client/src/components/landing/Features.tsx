import React from 'react';
import { ChartLine, ShieldCheck, MoveUpLeft, Smartphone } from 'lucide-react';

const Features: React.FC = () => {
  const features = [
    {
      icon: <ChartLine className="h-6 w-6" aria-hidden="true" />,
      title: "Real-time analytics",
      description: "Track your portfolio performance with real-time data and advanced analytics for informed decision-making."
    },
    {
      icon: <ShieldCheck className="h-6 w-6" aria-hidden="true" />,
      title: "Enterprise-grade security",
      description: "Your financial data is protected with bank-level encryption and multi-factor authentication."
    },
    {
      icon: <MoveUpLeft className="h-6 w-6" aria-hidden="true" />,
      title: "Seamless transactions",
      description: "Deposit, withdraw, and transfer funds instantly with low fees and complete transparency."
    },
    {
      icon: <Smartphone className="h-6 w-6" aria-hidden="true" />,
      title: "Mobile-first design",
      description: "Manage your finances on the go with our responsive platform that works on any device."
    }
  ];

  return (
    <div id="features" className="py-12 bg-white dark:bg-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="text-base text-primary-600 dark:text-primary-400 font-semibold tracking-wide uppercase">Features</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            A better way to manage your finances
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-300 lg:mx-auto">
            Powerful tools designed for both individual investors and businesses.
          </p>
        </div>

        <div className="mt-10">
          <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
            {features.map((feature, index) => (
              <div key={index} className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                    {feature.icon}
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900 dark:text-white">{feature.title}</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500 dark:text-gray-300">
                  {feature.description}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
};

export default Features;
