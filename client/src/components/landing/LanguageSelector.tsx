import React, { useEffect, useRef } from 'react';
import './LanguageSelector.css';

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate: {
        TranslateElement: new (options: {
          pageLanguage: string;
          layout: number;
        }, element: string | HTMLElement) => void;
      };
    };
  }
}

const LanguageSelector: React.FC = () => {
  const translateDivRef = useRef<HTMLDivElement>(null);

  const googleTranslateElementInit = () => {
    if (window.google && translateDivRef.current) {
      new window.google.translate.TranslateElement({
        pageLanguage: 'en',
        layout: 2 // 2 corresponds to the horizontal layout
      }, translateDivRef.current);
    }
  };

  useEffect(() => {
    const scriptId = 'google-translate-script';
    if (document.getElementById(scriptId)) {
      googleTranslateElementInit();
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    
    window.googleTranslateElementInit = googleTranslateElementInit;
    
    document.body.appendChild(script);

    return () => {
      const widget = document.querySelector('.skiptranslate');
      if (widget) {
        widget.remove();
      }
      const banner = document.querySelector('.goog-te-banner-frame');
      if (banner) {
        banner.remove();
      }
    };
  }, []);

  return (
    <div id="google_translate_element" ref={translateDivRef} className="language-selector-container"></div>
  );
};

export default LanguageSelector;
