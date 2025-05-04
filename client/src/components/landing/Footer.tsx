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
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8 xl:col-span-1">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                <Landmark className="h-5 w-5" />
              </div>
              <span className="ml-2 text-xl font-bold bg-gradient-to-r from-primary to-amber-600 bg-clip-text text-transparent">Carax Finance</span>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-base">
              Empowering investors worldwide with premium investment opportunities and consistent returns.
            </p>
            <div className="space-y-3">
              <div className="flex items-center">
                <PhoneCall className="h-5 w-5 text-primary mr-2" />
                <span className="text-gray-600 dark:text-gray-300">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center">
                <Mail className="h-5 w-5 text-primary mr-2" />
                <span className="text-gray-600 dark:text-gray-300">support@caraxfinance.com</span>
              </div>
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-primary mr-2 mt-1" />
                <span className="text-gray-600 dark:text-gray-300">11 Rue d'Aguesseau<br />75008 Paris, France</span>
              </div>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-primary hover:text-primary/80">
                <span className="sr-only">Facebook</span>
                <Facebook className="h-6 w-6" />
              </a>
              <a href="#" className="text-primary hover:text-primary/80">
                <span className="sr-only">Twitter</span>
                <Twitter className="h-6 w-6" />
              </a>
              <a href="#" className="text-primary hover:text-primary/80">
                <span className="sr-only">Instagram</span>
                <Instagram className="h-6 w-6" />
              </a>
              <a href="#" className="text-primary hover:text-primary/80">
                <span className="sr-only">LinkedIn</span>
                <Linkedin className="h-6 w-6" />
              </a>
            </div>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              {footerSections.slice(0, 2).map((section, index) => (
                <div key={index} className={index === 1 ? "mt-12 md:mt-0" : ""}>
                  <h3 className="text-sm font-semibold text-primary tracking-wider uppercase">
                    {section.title}
                  </h3>
                  <ul className="mt-4 space-y-4">
                    {section.links.map((link, linkIndex) => (
                      <li key={linkIndex}>
                        <a href={link.href} className="text-base text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary">
                          {link.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-8">
              {footerSections.slice(2).map((section, index) => (
                <div key={index} className={index === 1 ? "mt-12 md:mt-0" : ""}>
                  <h3 className="text-sm font-semibold text-primary tracking-wider uppercase">
                    {section.title}
                  </h3>
                  <ul className="mt-4 space-y-4">
                    {section.links.map((link, linkIndex) => (
                      <li key={linkIndex}>
                        <a href={link.href} className="text-base text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary">
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
        <div className="mt-12 border-t border-gray-200 dark:border-gray-700 pt-8">
          <p className="text-base text-gray-500 dark:text-gray-400 xl:text-center">
            &copy; {new Date().getFullYear()} Carax Finance. All rights reserved. Investment involves risk. Past performance is not a guarantee of future returns.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
