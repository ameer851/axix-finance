import React from 'react';
import LanguageDropdown from '../components/LanguageDropdown';

const TestTranslatePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Google Translate Test Page
        </h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Translation Widget Test
          </h2>
          <LanguageDropdown variant="default" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Test Content 1
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              This is some sample text to test the translation functionality. 
              When you select a language from the dropdown above, this content 
              should be translated automatically.
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              Welcome to our financial platform. We provide secure and reliable 
              investment opportunities for our clients worldwide.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Test Content 2
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              This page contains multiple sections of text to verify that the 
              Google Translate widget works correctly across different content areas.
            </p>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-300">
              <li>Dashboard navigation</li>
              <li>Investment portfolio</li>
              <li>Transaction history</li>
              <li>Account settings</li>
              <li>Security features</li>
            </ul>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Testing Instructions
          </h3>
          <ol className="list-decimal list-inside text-gray-600 dark:text-gray-300 space-y-2">
            <li>Click on the language dropdown above</li>
            <li>Scroll through the list of available languages</li>
            <li>Select a language other than English</li>
            <li>Verify that all text on this page gets translated</li>
            <li>Try selecting different languages to test multiple translations</li>
            <li>Check that the widget maintains its professional appearance</li>
          </ol>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
            Language Support
          </h3>
          <p className="text-blue-800 dark:text-blue-200">
            This Google Translate widget supports over 100 languages including:
            Spanish, French, German, Italian, Portuguese, Russian, Chinese, Japanese, 
            Korean, Arabic, Hindi, and many more.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestTranslatePage;
