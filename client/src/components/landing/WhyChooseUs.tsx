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
    <section id="why-choose-us" className="py-16 bg-white dark:bg-neutral-800">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Why Choose Axix Finance
          </h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Discover the advantages that thousands of investors worldwide have already experienced with our premium investment platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {benefits.map((benefit, index) => (
            <div 
              key={index}
              className="bg-gray-50 dark:bg-neutral-700 rounded-lg p-5 md:p-6 shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="flex flex-col items-center text-center">
                <div className="mb-3 md:mb-4">
                  {React.cloneElement(benefit.icon, { className: "h-8 w-8 md:h-10 md:w-10 text-primary-600" })}
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {benefit.title}
                </h3>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-300">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-10 md:mt-12 text-center">
          <p className="text-gray-700 dark:text-gray-200 text-sm md:text-base font-medium mb-5 md:mb-6 max-w-3xl mx-auto px-4">
            Join thousands of successful investors who have already discovered the Carax Finance advantage. Start your investment journey today.
          </p>
          <a 
            href="/auth" 
            className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-5 md:py-3 md:px-6 rounded-md shadow transition-colors text-sm md:text-base"
          >
            Start Investing Now
          </a>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;