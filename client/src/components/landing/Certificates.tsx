import React from 'react';
import fcaCertificate from '@/assets/images/fca-certificate.jpg';
import iirocCertificate from '@/assets/images/iiroc-certificate.jpg';

const Certificates: React.FC = () => {
  return (
    <section className="py-16 bg-gray-50 dark:bg-neutral-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Regulatory Certifications</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Carax Finance is regulated by top financial authorities, ensuring your investments 
            are protected by the highest industry standards.
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row justify-center items-center gap-8">
          <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg shadow-lg max-w-md">
            <div className="h-[350px] overflow-hidden rounded-md mb-4">
              <img 
                src={fcaCertificate} 
                alt="Financial Conduct Authority (FCA) Certificate" 
                className="w-full h-full object-contain"
              />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white text-center">
              Financial Conduct Authority (FCA)
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-center mt-2">
              License No: 900988 | United Kingdom
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg shadow-lg max-w-md">
            <div className="h-[350px] overflow-hidden rounded-md mb-4">
              <img 
                src={iirocCertificate} 
                alt="Investment Industry Regulatory Organization of Canada (IIROC) Certificate" 
                className="w-full h-full object-contain"
              />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white text-center">
              Investment Industry Regulatory Organization of Canada (IIROC)
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-center mt-2">
              License No: 75296 | Canada
            </p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Our regulatory compliance ensures that your funds are securely managed and
            all operations adhere to international financial regulations, providing you
            with peace of mind for all your investments.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Certificates;