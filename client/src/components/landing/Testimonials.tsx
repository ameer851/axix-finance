import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Star } from 'lucide-react';

const Testimonials: React.FC = () => {
  const testimonials = [
    {
      name: "James Wilson",
      role: "Premium Investor",
      content: "I've been using Axix Finance for 6 months and have seen an incredible return on my investments. The Premium Plan gave me 3.5% daily returns consistently, and their customer service is exceptional.",
      initials: "JW",
      rating: 5
    },
    {
      name: "Rebecca Chen",
      role: "Luxury Plan Investor",
      content: "After trying several investment platforms, Axix Finance stands out with their transparency and consistent payouts. The Luxury Plan has helped me grow my capital significantly with 7.5% daily returns.",
      initials: "RC",
      rating: 5
    },
    {
      name: "Michael Okonkwo",
      role: "Starter Plan Investor",
      content: "I started with the Starter Plan to test the waters, and I was amazed by the results. The 2% daily returns came in on time, and I've since upgraded to the Delux Plan for even better returns.",
      initials: "MO",
      rating: 5
    },
    {
      name: "Sophia Martinez",
      role: "Delux Plan Investor",
      content: "The Delux Plan at Axix Finance has significantly boosted my investment portfolio. 5% daily for 10 days is an incredible return, and the principal being included makes it even better.",
      initials: "SM",
      rating: 5
    }
  ];

  const renderStars = (count: number) => {
    return Array(count).fill(0).map((_, i) => (
      <Star key={i} className="h-4 w-4 fill-amber-500 text-amber-500" />
    ));
  };

  return (
    <div id="testimonials" className="bg-accent dark:bg-accent/20 py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="text-base text-primary font-semibold tracking-wide uppercase">Success Stories</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-secondary dark:text-white sm:text-4xl">
            Our Investors Share Their Experience
          </p>          <p className="mt-4 max-w-2xl text-xl text-gray-600 dark:text-gray-300 lg:mx-auto">
            Join thousands of satisfied investors who are growing their wealth with Axix Finance.
          </p>
        </div>
        <div className="mt-12">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white dark:bg-secondary rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-800">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0 mr-4">
                    <Avatar className="h-12 w-12 border-2 border-primary">
                      <AvatarFallback className="bg-primary text-white">
                        {testimonial.initials}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div>
                    <h4 className="font-bold text-secondary dark:text-white">{testimonial.name}</h4>
                    <p className="text-primary text-sm font-medium">{testimonial.role}</p>
                    <div className="flex mt-1">
                      {renderStars(testimonial.rating)}
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300 italic">"{testimonial.content}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Testimonials;
