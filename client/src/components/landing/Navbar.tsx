import React, { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Menu, X, Landmark } from 'lucide-react';

const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white dark:bg-secondary shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                <Landmark className="h-5 w-5" />
              </div>
              <span className="ml-2 text-xl font-bold bg-gradient-to-r from-primary to-amber-600 bg-clip-text text-transparent">Carax Finance</span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <a href="#features" className="border-transparent text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary hover:border-primary inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                Features
              </a>
              <a href="#pricing" className="border-transparent text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary hover:border-primary inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                Investment Plans
              </a>
              <a href="#testimonials" className="border-transparent text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary hover:border-primary inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                Testimonials
              </a>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <div className="flex space-x-4">
              <Link href="/login">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button className="text-white bg-primary hover:bg-primary/90">
                  Start Investing
                </Button>
              </Link>
            </div>
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded="false"
              className="text-primary"
            >
              <span className="sr-only">Open main menu</span>
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden">
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
          
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xs bg-white dark:bg-secondary shadow-lg">
            <div className="flex items-center justify-between px-4 pt-4">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                  <Landmark className="h-5 w-5" />
                </div>
                <span className="ml-2 text-xl font-bold bg-gradient-to-r from-primary to-amber-600 bg-clip-text text-transparent">Carax Finance</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a
                href="#features"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:text-primary hover:bg-primary/5 dark:hover:text-primary dark:hover:bg-primary/10"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </a>
              <a
                href="#pricing"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:text-primary hover:bg-primary/5 dark:hover:text-primary dark:hover:bg-primary/10"
                onClick={() => setMobileMenuOpen(false)}
              >
                Investment Plans
              </a>
              <a
                href="#testimonials"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:text-primary hover:bg-primary/5 dark:hover:text-primary dark:hover:bg-primary/10"
                onClick={() => setMobileMenuOpen(false)}
              >
                Testimonials
              </a>
              <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex space-y-2 flex-col mt-3 px-2">
                  <Link href="/login">
                    <Button variant="outline" className="w-full justify-center border-primary text-primary hover:bg-primary/10">
                      Login
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button className="w-full justify-center text-white bg-primary hover:bg-primary/90">
                      Start Investing
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
