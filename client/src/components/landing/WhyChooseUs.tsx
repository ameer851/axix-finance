import React from 'react';
import {
  Shield,
  TrendingUp,
  Zap,
  Globe,
  Clock,
  HeartHandshake
} from 'lucide-react';

const WhyChooseUs: React.FC = () => {
  const benefits = [
    {
      icon: <Shield className="h-10 w-10 text-primary-600" />,
      title: "Secure & Regulated",
      description: "Your investments are protected with industry-leading security. We're regulated by top financial authorities including the FCA (UK) and IIROC (Canada).",
    },
    {
      icon: <TrendingUp className="h-10 w-10 text-primary-600" />,
      title: "High Returns",
      description: "Our competitive investment plans offer high daily yields, ranging from 2% to 7.5% daily, with short to medium-term durations to maximize your profits.",
    },
    {
      icon: <Zap className="h-10 w-10 text-primary-600" />,
      title: "Fast Processing",
      description: "Experience quick transaction processing with minimal waiting. Deposits are credited promptly, and withdrawals are processed within 24 hours.",
    },
    {
      icon: <Globe className="h-10 w-10 text-primary-600" />,
      title: "Global Access",
      description: "Invest from anywhere in the world with our multi-cryptocurrency platform. We support Bitcoin, Ethereum, Bitcoin Cash, USDT, and BNB.",
    },
    {
      icon: <Clock className="h-10 w-10 text-primary-600" />,
      title: "Flexible Terms",
      description: "Choose from various investment durations (3 to 30 days) and minimum investments starting from just $50, giving you control over your financial future.",
    },
    {
      icon: <HeartHandshake className="h-10 w-10 text-primary-600" />,
      title: "Generous Referrals",
      description: "Earn 10% commission on all investments made by your referrals, creating an additional passive income stream while helping others invest wisely.",
    }
  ];

  return (
    <section id="why-choose-us" className="py-12 sm:py-16 lg:py-20 bg-white dark:bg-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-secondary dark:text-white mb-4">
            Why Choose Axix Finance
          </h2>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Discover the advantages that thousands of investors worldwide have already experienced with our premium investment platform.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {benefits.map((benefit, index) => (
            <div 
              key={index}
              className="bg-accent dark:bg-accent/20 rounded-xl p-4 sm:p-6 lg:p-8 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 group"
            >
              <div className="flex flex-col items-center text-center">
                <div className="mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                  {React.cloneElement(benefit.icon, { 
                    className: "h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-primary" 
                  })}
                </div>
                <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-secondary dark:text-white mb-2 sm:mb-3">
                  {benefit.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 sm:mt-10 lg:mt-12 text-center">
          <p className="text-gray-700 dark:text-gray-200 text-sm sm:text-base font-medium mb-4 sm:mb-6 max-w-3xl mx-auto">
            Join thousands of successful investors who have already discovered the Axix Finance advantage. Start your investment journey today.
          </p>
          <a 
            href="/register" 
            className="inline-block bg-primary hover:bg-primary/90 text-white font-medium py-2.5 px-5 sm:py-3 sm:px-6 lg:py-4 lg:px-8 rounded-md shadow-lg transition-all duration-300 hover:scale-105 text-sm sm:text-base lg:text-lg"
          >
            Start Investing Now
          </a>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;