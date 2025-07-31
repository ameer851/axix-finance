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

const GoogleTranslate: React.FC = () => {
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
    
    // Remove any existing Google Translate elements
    const existingScript = document.getElementById('google-translate-script');
    if (existingScript) {
      existingScript.remove();
    }
    
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
        
        // Set up initialization callback
        window.googleTranslateElementInit = () => {
          try {
            if (window.google?.translate && googleTranslateRef.current) {
              // Create the translate element with simplified options
              // Group languages by popularity/geography for better organization
              const topLanguages = 'en,es,fr,de,it,pt,ru,zh-CN,ja,ko,ar,hi'; // Most used languages first
              const europeanLanguages = 'nl,pl,tr,sv,cs,el,hu,ro,uk,bg,ca,da,et,fi,ga,hr,lt,lv,mt,sk,sl';
              const asianLanguages = 'th,vi,zh-TW,bn,fa,fil,iw,ms,ta,ur,uz';
              const otherLanguages = 'af,sw,is,mk,no,sq,sr,gl,hy,ka,kk,ky,lo,mi,mn,mr,my,ne,si,tl,az,am,eu,be,km,jw,lb';
              
              const allLanguages = [topLanguages, europeanLanguages, asianLanguages, otherLanguages].join(',');
              
              // Use type assertion to bypass TypeScript checking for Google API
              const TranslateElement = window.google.translate.TranslateElement as any;
              new TranslateElement(
                {
                  pageLanguage: 'en',
                  includedLanguages: allLanguages,
                  layout: 0, // SIMPLE layout
                  autoDisplay: false,
                  multilanguagePage: false
                },
                googleTranslateRef.current
              );
              setIsLoaded(true);
            }
          } catch (error) {
            // Handle initialization error
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
          // If this was the last try, mark as error
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
          // If this was the last try, mark as error
          if (tryCount >= 2) {
            setErrorOccurred(true);
          }
        };
        
        // Add script to DOM
        document.head.appendChild(scriptElement);
      } catch (error) {
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
    <div className="flex items-center space-x-2 group client-google-translate">
      <Globe className="h-4 w-4 text-gray-600 dark:text-gray-300 group-hover:text-primary transition-colors" />
      <div 
        ref={googleTranslateRef}
        className="google-translate-container"
      />
      {!isLoaded && isScriptLoaded && !errorOccurred && (
        <span className="text-xs text-gray-500 dark:text-gray-400 animate-pulse">
          Initializing...
        </span>
      )}
      {!isScriptLoaded && !errorOccurred && (
        <span className="text-xs text-gray-500 dark:text-gray-400 animate-pulse">
          Loading...
        </span>
      )}
      {errorOccurred && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Translate
        </span>
      )}
      {isLoaded && !errorOccurred && (
        <span className="sr-only">
          Language selector loaded
        </span>
      )}
    </div>
  );
};

export default GoogleTranslate;
