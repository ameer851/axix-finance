import React from 'react';
import fcaLicense from '@/assets/images/fca-license.png';
import iirocLicense from '@/assets/images/iiroc-license.png';

const Certificates: React.FC = () => {
  return (
    <section className="py-16 bg-gray-50 dark:bg-neutral-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Regulatory Licenses</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Carax Finance is fully regulated and licensed by top-tier financial authorities, 
            providing you with the security and peace of mind your investments deserve.
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row justify-center items-center gap-8">
          <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg shadow-lg max-w-md">
            <div className="h-[400px] overflow-hidden rounded-md mb-4">
              <img 
                src={fcaLicense} 
                alt="Financial Conduct Authority (FCA) License" 
                className="w-full h-full object-contain"
              />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white text-center">
              Financial Conduct Authority (FCA)
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-center mt-2">
              License Type: Exclusive | CB Payments Ltd
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg shadow-lg max-w-md">
            <div className="h-[400px] overflow-hidden rounded-md mb-4">
              <img 
                src={iirocLicense} 
                alt="Investment Industry Regulatory Organization of Canada (IIROC) License" 
                className="w-full h-full object-contain"
              />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white text-center">
              Investment Industry Regulatory Organization of Canada (IIROC)
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-center mt-2">
              License Type: Market Making (MM) | OANDA Corporation
            </p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            These licenses demonstrate our commitment to maintaining the highest standards
            of financial conduct and investment protection. Our regulatory compliance
            ensures that your funds are securely managed and all operations adhere to 
            international financial regulations.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Certificates;