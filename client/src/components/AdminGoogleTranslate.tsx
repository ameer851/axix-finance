import React, { useEffect, useRef, useState } from 'react';
import { Globe } from 'lucide-react';
import './GoogleTranslate.css';

// Define Google Translate interface without conflicts
interface GoogleTranslateOptions {
  pageLanguage: string;
  includedLanguages: string;
  layout: number;
  autoDisplay: boolean;
  multilanguagePage: boolean;
}

interface GoogleTranslateElement {
  new (options: GoogleTranslateOptions, element: HTMLElement | null): void;
}

interface GoogleTranslateAPI {
  TranslateElement: GoogleTranslateElement;
}

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate: GoogleTranslateAPI;
    };
  }
}

const AdminGoogleTranslate: React.FC = () => {
  const googleTranslateRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [errorOccurred, setErrorOccurred] = useState(false);
  const [tryCount, setTryCount] = useState(0);
  
  useEffect(() => {
    // Skip if maximum tries reached
    if (tryCount >= 3) {
      setErrorOccurred(true);
      return;
    }
    
    // Declare cleanup function
    let scriptElement: HTMLScriptElement | null = null;
    let timeoutId: number | null = null;
    
    // Attempt to initialize Google Translate
    const initializeTranslate = () => {
      try {
        // Check if already initialized
        const existingWidget = document.querySelector('.goog-te-combo');
        if (existingWidget) {
          setIsLoaded(true);
          setIsScriptLoaded(true);
          return;
        }
        
        // Set up initialization callback with unique name for admin
        window.googleTranslateElementInit = () => {
          try {
            if (window.google?.translate && googleTranslateRef.current) {
              // Create the translate element with admin-specific options
              // Focused language set for admin interface
              const adminLanguages = 'en,es,fr,de,it,pt,ru,zh-CN,ja,ko,ar,hi,nl,pl,tr';
              
              // Use type assertion to bypass TypeScript checking for Google API
              const TranslateElement = window.google.translate.TranslateElement as any;
              new TranslateElement(
                {
                  pageLanguage: 'en',
                  includedLanguages: adminLanguages,
                  layout: 0, // SIMPLE layout
                  autoDisplay: false,
                  multilanguagePage: false
                },
                googleTranslateRef.current
              );
              setIsLoaded(true);
            }
          } catch (error) {
            console.error('Admin Google Translate initialization error:', error);
            setTryCount(prev => prev + 1);
            setErrorOccurred(true);
          }
        };
        
        // Create and add the script
        scriptElement = document.createElement('script');
        scriptElement.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        scriptElement.async = true;
        scriptElement.defer = true;
        
        // Set timeout to detect loading failures
        timeoutId = window.setTimeout(() => {
          setTryCount(prev => prev + 1);
          if (tryCount >= 2) {
            setErrorOccurred(true);
          }
        }, 5000);
        
        // Handle script load events
        scriptElement.onload = () => {
          if (timeoutId) window.clearTimeout(timeoutId);
          setIsScriptLoaded(true);
        };
        
        scriptElement.onerror = () => {
          if (timeoutId) window.clearTimeout(timeoutId);
          setTryCount(prev => prev + 1);
          if (tryCount >= 2) {
            setErrorOccurred(true);
          }
        };
        
        // Add script to DOM
        document.head.appendChild(scriptElement);
      } catch (error) {
        console.error('Admin Google Translate setup error:', error);
        setErrorOccurred(true);
      }
    };
    
    // Start initialization
    initializeTranslate();
    
    // Cleanup function
    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      if (scriptElement && scriptElement.parentNode) {
        scriptElement.parentNode.removeChild(scriptElement);
      }
    };
  }, [tryCount, googleTranslateRef]);

  return (
    <div className="flex items-center space-x-2 group admin-google-translate">
      <Globe className="h-4 w-4 text-gray-600 dark:text-gray-300 group-hover:text-blue-600 transition-colors" />
      <div 
        ref={googleTranslateRef}
        className="google-translate-container admin-translate"
      />
      {!isLoaded && isScriptLoaded && !errorOccurred && (
        <span className="text-xs text-gray-500 dark:text-gray-400 animate-pulse">
          Loading translator...
        </span>
      )}
      {!isScriptLoaded && !errorOccurred && (
        <span className="text-xs text-gray-500 dark:text-gray-400 animate-pulse">
          Connecting...
        </span>
      )}
      {errorOccurred && (
        <span className="text-xs text-red-500 dark:text-red-400">
          Translation unavailable
        </span>
      )}
      {isLoaded && !errorOccurred && (
        <span className="sr-only">
          Admin language selector loaded
        </span>
      )}
    </div>
  );
};

export default AdminGoogleTranslate;
