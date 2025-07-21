import React from 'react';
import fcaLicense from '../../assets/images/fca-license.png';
import iirocLicense from '../../assets/images/iiroc-license.png';

const Certificates: React.FC = () => {
  return (
    <section className="py-16 bg-gray-50 dark:bg-neutral-900" id="certificates">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Regulatory Licenses</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Axix Finance is fully regulated and licensed by top-tier financial authorities, 
            providing you with the security and peace of mind your investments deserve.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* FCA Section */}
          <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white text-center mb-6">
              Financial Conduct Authority (FCA)
            </h3>
            <div className="flex justify-center">
              <div className="w-full max-w-md">
                <div className="h-[350px] overflow-hidden rounded-md mb-4 border border-gray-200 dark:border-gray-700">
                  <img 
                    src={fcaLicense} 
                    alt="Financial Conduct Authority (FCA) License" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="text-center font-medium">License</p>
              </div>
            </div>
            <div className="mt-4 p-4 bg-gray-50 dark:bg-neutral-900 rounded-md">
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold">License Type:</span> Exclusive
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Regulated By:</span> CB Payments Ltd
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Email Address:</span> support@axix-finance.co
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Website:</span> Anniss.co
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Address:</span> 65 Avenue John F. Kennedy, 37200 Tours, France
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Effective Date:</span> 02-08-2023
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Expiry Date:</span> 01-09-2028
              </p>
              <p className="text-gray-700 dark:text-gray-300 mt-2">
                The FCA is a financial regulatory body in the United Kingdom, operating independently of the UK Government, financed by charging fees to members of the financial services industry.
              </p>
            </div>
          </div>

          {/* IIROC Section */}
          <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white text-center mb-6">
              Investment Industry Regulatory Organization of Canada (IIROC)
            </h3>
            <div className="flex justify-center">
              <div className="w-full max-w-md">
                <div className="h-[350px] overflow-hidden rounded-md mb-4 border border-gray-200 dark:border-gray-700">
                  <img 
                    src={iirocLicense} 
                    alt="Investment Industry Regulatory Organization of Canada (IIROC) License" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="text-center font-medium">License</p>
              </div>
            </div>
            <div className="mt-4 p-4 bg-gray-50 dark:bg-neutral-900 rounded-md">
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold">License Type:</span> Market Making (MM)
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Licensed Institution:</span> OANDA (Canada) Corporation ULC
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Email Address:</span> info@fxtrade.com
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Address:</span> 370 King Street West 2nd Floor, P.O. Box 19043 Toronto, Ontario, Canada, M5V 1J9
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Effective Date:</span> 01-02-2022
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Expiry Date:</span> 02-03-2026
              </p>
              <p className="text-gray-700 dark:text-gray-300 mt-2">
                IIROC oversees investment dealers and trading activity in Canada's debt and equity markets, ensuring fair and transparent capital markets.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-lg mt-8">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            What These Licenses Mean For You
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Fund Security</h4>
              <p className="text-gray-600 dark:text-gray-300">
                Your investments are protected by strict regulatory oversight and segregated account requirements.
              </p>
            </div>
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Compliance Guarantee</h4>
              <p className="text-gray-600 dark:text-gray-300">
                We adhere to international AML and KYC standards, ensuring transparent and legitimate operations.
              </p>
            </div>
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Dispute Resolution</h4>
              <p className="text-gray-600 dark:text-gray-300">
                Access to formal processes for addressing concerns, with regulatory bodies providing additional oversight.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Certificates;