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
    <div id="features" className="py-8 sm:py-12 lg:py-16 bg-white dark:bg-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center lg:text-center">
          <h2 className="text-sm sm:text-base text-primary font-semibold tracking-wide uppercase">Why Choose Us</h2>
          <p className="mt-2 text-2xl sm:text-3xl lg:text-4xl leading-8 font-extrabold tracking-tight text-secondary dark:text-white">
            Premium Investment Features
          </p>
          <p className="mt-4 max-w-2xl text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300 mx-auto">
            Our investment platform offers unique advantages designed to maximize your returns and financial growth.
          </p>
        </div>

        <div className="mt-8 sm:mt-10 lg:mt-16">
          <dl className="space-y-6 sm:space-y-8 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 lg:gap-8 xl:gap-10">
            {features.map((feature, index) => (
              <div key={index} className="relative bg-accent dark:bg-accent/20 p-4 sm:p-6 lg:p-8 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105 group">
                <dt>
                  <div className="flex items-center justify-center h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-primary text-white mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                    {React.cloneElement(feature.icon as React.ReactElement, {
                      className: "h-5 w-5 sm:h-6 sm:w-6"
                    })}
                  </div>
                  <p className="text-base sm:text-lg lg:text-xl leading-6 font-bold text-secondary dark:text-white mb-2">{feature.title}</p>
                </dt>
                <dd className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
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
