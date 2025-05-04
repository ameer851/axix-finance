import React from 'react';
import { TrendingUp, ShieldCheck, BadgeDollarSign, Clock, Award, Users } from 'lucide-react';

const Features: React.FC = () => {
  const features = [
    {
      icon: <TrendingUp className="h-6 w-6" aria-hidden="true" />,
      title: "High Daily Returns",
      description: "Earn up to 7.5% daily returns on your investments, with rates that outperform traditional financial instruments."
    },
    {
      icon: <ShieldCheck className="h-6 w-6" aria-hidden="true" />,
      title: "Secure Investments",
      description: "Your investments are protected with enterprise-grade security and managed by experienced financial professionals."
    },
    {
      icon: <BadgeDollarSign className="h-6 w-6" aria-hidden="true" />,
      title: "Principal Included",
      description: "Get back your principal investment along with profits at the end of each investment cycle."
    },
    {
      icon: <Clock className="h-6 w-6" aria-hidden="true" />,
      title: "Flexible Investment Terms",
      description: "Choose from multiple investment plans with terms ranging from 3 to 30 days to match your financial goals."
    },
    {
      icon: <Users className="h-6 w-6" aria-hidden="true" />,
      title: "Lucrative Referral Program",
      description: "Earn 10% commission on all investments made by your referrals, creating a passive income stream."
    },
    {
      icon: <Award className="h-6 w-6" aria-hidden="true" />,
      title: "Transparent Platform",
      description: "Monitor your investments in real-time with our comprehensive dashboard showing all transaction details."
    }
  ];

  return (
    <div id="features" className="py-12 bg-white dark:bg-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="text-base text-primary font-semibold tracking-wide uppercase">Why Choose Us</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-secondary dark:text-white sm:text-4xl">
            Premium Investment Features
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-600 dark:text-gray-300 lg:mx-auto">
            Our investment platform offers unique advantages designed to maximize your returns and financial growth.
          </p>
        </div>

        <div className="mt-10">
          <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-x-8 md:gap-y-10">
            {features.map((feature, index) => (
              <div key={index} className="relative bg-accent dark:bg-accent/20 p-6 rounded-lg transition-all hover:shadow-md">
                <dt>
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary text-white mb-4">
                    {feature.icon}
                  </div>
                  <p className="text-lg leading-6 font-bold text-secondary dark:text-white">{feature.title}</p>
                </dt>
                <dd className="mt-2 text-base text-gray-600 dark:text-gray-300">
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
