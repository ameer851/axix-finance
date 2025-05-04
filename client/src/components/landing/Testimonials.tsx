import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const Testimonials: React.FC = () => {
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Small Business Owner",
      content: "Carax Finance has streamlined our company's financial operations. The dashboard provides insights that have helped us optimize cash flow and make better investment decisions.",
      initials: "SJ"
    },
    {
      name: "David Chen",
      role: "Investor",
      content: "As an active investor, I need real-time data and powerful analytics. Carax Finance delivers both with an intuitive interface that makes managing my portfolio effortless.",
      initials: "DC"
    },
    {
      name: "Maria Rodriguez",
      role: "Financial Advisor",
      content: "I recommend Carax Finance to all my clients. The security features, combined with the comprehensive reporting tools, provide everything needed for sound financial management.",
      initials: "MR"
    }
  ];

  return (
    <div id="testimonials" className="bg-white dark:bg-neutral-900 py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="text-base text-primary-600 dark:text-primary-400 font-semibold tracking-wide uppercase">Testimonials</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Trusted by investors worldwide
          </p>
        </div>
        <div className="mt-12">
          <div className="grid gap-8 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 dark:bg-neutral-800 rounded-xl p-8 shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0 mr-4">
                    <Avatar>
                      <AvatarFallback className="bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                        {testimonial.initials}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{testimonial.name}</h4>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300">"{testimonial.content}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Testimonials;
