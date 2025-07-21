import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
  const faqItems = [
    {
      question: "How do Axix Finance investment plans work?",
      answer: "Axix Finance offers several investment plans with different returns and durations. You can start by depositing crypto to our wallet addresses, selecting a plan that matches your investment goals. Your principal and returns are paid out at the end of the investment term. All investments are securely managed with transparency and reliability."
    },
    {
      question: "What are the minimum and maximum investment amounts?",
      answer: "Our STARTER PLAN begins at just $50 and goes up to $999. PREMIUM PLAN ranges from $1,000 to $4,999. DELUX PLAN accepts $5,000 to $19,999, and our LUXURY PLAN is for investments of $20,000 and above. Each plan offers different returns and durations to suit various investment needs."
    },
    {
      question: "How are returns calculated and paid out?",
      answer: "Returns are calculated based on the daily percentage rates specified in each plan. For example, our STARTER PLAN offers 2% daily for 3 days, totaling 6% returns plus your principal. Returns are automatically credited to your account balance at the end of the investment term and are available for withdrawal or reinvestment."
    },
    {
      question: "Is there a referral program?",
      answer: "Yes, we offer a generous 10% referral commission across all our plans. When someone you refer makes an investment, you automatically receive 10% of their investment amount as a commission, which is immediately credited to your account balance."
    },
    {
      question: "What cryptocurrencies do you accept for investments?",
      answer: "We currently accept Bitcoin (BTC), Bitcoin Cash (BCH), Ethereum (ETH), USDT (TRC20), and BNB (BEP20). Each cryptocurrency has a dedicated wallet address where you can send funds to make investments. More crypto options may be added in the future."
    },
    {
      question: "How secure are investments with Axix Finance?",
      answer: "Axix Finance implements industry-standard security protocols to protect your investments. We are regulated by the Financial Conduct Authority (UK) and the Investment Industry Regulatory Organization of Canada, ensuring compliance with strict financial regulations and standards."
    },
    {
      question: "How quickly are withdrawals processed?",
      answer: "Withdrawal requests are typically processed within 24 hours. The exact time may vary depending on network conditions and the cryptocurrency you're withdrawing. Minimum withdrawal amount is $50."
    }
  ];

  return (
    <section id="faq" className="py-12 bg-gray-50 dark:bg-neutral-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Got questions about investing with Carax Finance? Find answers to the most common questions below.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left font-medium text-gray-900 dark:text-white">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 dark:text-gray-300">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQ;