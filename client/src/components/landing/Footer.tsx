import React from 'react';
import { Link } from 'wouter';
import { 
  Facebook, 
  Twitter, 
  Instagram,
  Linkedin,
  Mail,
  PhoneCall,
  MapPin,
  Landmark
} from 'lucide-react';

const Footer: React.FC = () => {
  const footerSections = [
    {
      title: "Investment Plans",
      links: [
        { name: "Starter Plan", href: "#pricing" },
        { name: "Premium Plan", href: "#pricing" },
        { name: "Delux Plan", href: "#pricing" },
        { name: "Luxury Plan", href: "#pricing" }
      ]
    },
    {
      title: "Support",
      links: [
        { name: "Help Center", href: "#" },
        { name: "Contact Us", href: "#" },
        { name: "FAQs", href: "#" },
        { name: "Investment Guide", href: "#" }
      ]
    },
    {
      title: "Company",
      links: [
        { name: "About Us", href: "#" },
        { name: "Our Team", href: "#" },
        { name: "Testimonials", href: "#testimonials" },
        { name: "Careers", href: "#" }
      ]
    },
    {
      title: "Legal",
      links: [
        { name: "Privacy Policy", href: "#" },
        { name: "Terms of Service", href: "#" },
        { name: "Investment Terms", href: "#" },
        { name: "Disclaimers", href: "#" }
      ]
    }
  ];

  return (
    <footer className="bg-white dark:bg-secondary">
      <div className="max-w-7xl mx-auto py-8 sm:py-10 md:py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-4 sm:space-y-6 md:space-y-8 xl:col-span-1">
            <div className="flex items-center">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                <Landmark className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <span className="ml-2 text-lg sm:text-xl font-bold bg-gradient-to-r from-primary to-amber-600 bg-clip-text text-transparent">Axix Finance</span>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base leading-relaxed">
              Empowering investors worldwide with premium investment opportunities and consistent returns.
            </p>
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center">
                <PhoneCall className="h-4 w-4 sm:h-5 sm:w-5 text-primary mr-2 sm:mr-3 flex-shrink-0" />
                <span className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">+12709703891</span>
              </div>
              <div className="flex items-center">
                <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-primary mr-2 sm:mr-3 flex-shrink-0" />
                <span className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">support@axix-finance.co</span>
              </div>
              <div className="flex items-start">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary mr-2 sm:mr-3 mt-1 flex-shrink-0" />
                <span className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">Bastrop, Texas 78602, USA</span>
              </div>
            </div>
            <div className="flex space-x-4 sm:space-x-6">
              <a href="#" className="text-primary hover:text-primary/80 transition-colors" aria-label="Facebook" title="Facebook">
                <span className="sr-only">Facebook</span>
                <Facebook className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
              </a>
              <a href="#" className="text-primary hover:text-primary/80 transition-colors" aria-label="Twitter" title="Twitter">
                <span className="sr-only">Twitter</span>
                <Twitter className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
              </a>
              <a href="#" className="text-primary hover:text-primary/80 transition-colors" aria-label="Instagram" title="Instagram">
                <span className="sr-only">Instagram</span>
                <Instagram className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
              </a>
              <a href="#" className="text-primary hover:text-primary/80 transition-colors" aria-label="LinkedIn" title="LinkedIn">
                <span className="sr-only">LinkedIn</span>
                <Linkedin className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
              </a>
            </div>
          </div>
          <div className="mt-8 sm:mt-10 xl:mt-0 grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 xl:col-span-2">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
              {footerSections.slice(0, 2).map((section, index) => (
                <div key={index}>
                  <h3 className="text-sm sm:text-base font-semibold text-primary tracking-wider uppercase">
                    {section.title}
                  </h3>
                  <ul className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
                    {section.links.map((link, linkIndex) => (
                      <li key={linkIndex}>
                        <a href={link.href} className="text-sm sm:text-base text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors">
                          {link.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
              {footerSections.slice(2).map((section, index) => (
                <div key={index}>
                  <h3 className="text-sm sm:text-base font-semibold text-primary tracking-wider uppercase">
                    {section.title}
                  </h3>
                  <ul className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
                    {section.links.map((link, linkIndex) => (
                      <li key={linkIndex}>
                        <a href={link.href} className="text-sm sm:text-base text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors">
                          {link.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-8 sm:mt-10 border-t border-gray-200 dark:border-gray-700 pt-6 sm:pt-8">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center leading-relaxed">
            &copy; {new Date().getFullYear()} Axix Finance. All rights reserved. Investment involves risk. Past performance is not a guarantee of future returns.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
