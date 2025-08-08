import { ChevronDown, Globe } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import "./LanguageDropdown.css";

// Suppress Google Translate console errors
const originalConsoleError = console.error;
console.error = (...args) => {
  const message = args.join(" ");
  // Suppress known Google Translate and Cloudflare cookie errors
  if (
    message.includes("translate.googleapis.com") ||
    message.includes("__cflb") ||
    message.includes("SameSite") ||
    message.includes("cross-site context") ||
    message.includes("CORS request did not succeed") ||
    message.includes("Admin stats") ||
    message.includes("Authentication required")
  ) {
    return; // Suppress these specific errors
  }
  originalConsoleError.apply(console, args);
};

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate: {
        TranslateElement: new (
          options: {
            pageLanguage: string;
            includedLanguages: string;
            layout: number;
            autoDisplay: boolean;
            multilanguagePage: boolean;
          },
          element: HTMLElement | null
        ) => void;
      };
    };
  }
}

interface LanguageDropdownProps {
  variant?: "default" | "navbar" | "client";
  showIcon?: boolean;
}

const LanguageDropdown: React.FC<LanguageDropdownProps> = ({
  variant = "default",
  showIcon = true,
}) => {
  const translateRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  // Comprehensive language list (100+ languages)
  const includedLanguages = [
    "en",
    "es",
    "fr",
    "de",
    "it",
    "pt",
    "ru",
    "ja",
    "ko",
    "zh-CN",
    "zh-TW",
    "ar",
    "hi",
    "th",
    "vi",
    "tr",
    "pl",
    "nl",
    "sv",
    "no",
    "da",
    "fi",
    "el",
    "he",
    "fa",
    "ur",
    "bn",
    "ta",
    "te",
    "ml",
    "kn",
    "gu",
    "pa",
    "or",
    "as",
    "ne",
    "si",
    "my",
    "km",
    "lo",
    "ka",
    "am",
    "sw",
    "zu",
    "af",
    "sq",
    "az",
    "be",
    "bg",
    "ca",
    "hr",
    "cs",
    "et",
    "tl",
    "gl",
    "hu",
    "is",
    "id",
    "ga",
    "lv",
    "lt",
    "mk",
    "ms",
    "mt",
    "ro",
    "sr",
    "sk",
    "sl",
    "uk",
    "cy",
    "eu",
    "hy",
    "kk",
    "ky",
    "lb",
    "mn",
    "uz",
    "yo",
    "ig",
    "ha",
    "mg",
    "sm",
    "gd",
    "mi",
    "haw",
    "ceb",
    "ny",
    "st",
    "sn",
    "xh",
    "fy",
    "hmn",
    "ku",
    "la",
    "co",
    "eo",
  ].join(",");

  useEffect(() => {
    // Prevent multiple initializations
    if (document.querySelector(".goog-te-combo")) {
      return;
    }

    const initializeTranslate = () => {
      if (
        window.google &&
        window.google.translate &&
        window.google.translate.TranslateElement &&
        translateRef.current
      ) {
        try {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: "en",
              includedLanguages: includedLanguages,
              layout: 0, // Use simple layout for better control
              autoDisplay: false,
              multilanguagePage: true,
            },
            translateRef.current
          );
        } catch (error) {
          console.warn("Failed to initialize Google Translate:", error);
          // Retry after a short delay
          setTimeout(() => {
            if (
              window.google &&
              window.google.translate &&
              window.google.translate.TranslateElement
            ) {
              try {
                new window.google.translate.TranslateElement(
                  {
                    pageLanguage: "en",
                    includedLanguages: includedLanguages,
                    layout: 0,
                    autoDisplay: false,
                    multilanguagePage: true,
                  },
                  translateRef.current
                );
              } catch (retryError) {
                console.error("Google Translate retry failed:", retryError);
              }
            }
          }, 1000);
        }

        setIsLoaded(true);

        // Apply custom styling after initialization
        setTimeout(() => {
          const combo = document.querySelector(
            ".goog-te-combo"
          ) as HTMLSelectElement;
          if (combo) {
            combo.className = `language-dropdown-select ${variant}`;
          }
        }, 100);
      }
    };

    window.googleTranslateElementInit = initializeTranslate;

    // Load Google Translate script with error handling
    const existingScript = document.getElementById("google-translate-script");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src =
        "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      script.onload = () => {
        setIsScriptLoaded(true);
        // Wait a bit for the script to fully initialize
        setTimeout(() => {
          initializeTranslate();
        }, 500);
      };
      script.onerror = (error) => {
        console.warn("Google Translate script failed to load:", error);
        setIsScriptLoaded(false);
      };
      document.head.appendChild(script);
    } else {
      setIsScriptLoaded(true);
      initializeTranslate();
    }

    // Intercept Google translate logging calls by overriding fetch to route to our proxy
    const originalFetch = window.fetch.bind(window);
    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      try {
        const urlString =
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.toString()
              : "";
        if (
          urlString.includes("https://translate.googleapis.com/element/log")
        ) {
          const u = new URL(urlString);
          const qs = u.search ? u.search.substring(1) : "";
          const proxied = qs
            ? `/api/translate-log?${qs}`
            : "/api/translate-log";
          return originalFetch(proxied, init);
        }
      } catch {}
      return originalFetch(input as any, init);
    };

    return () => {
      // Cleanup on unmount
      const widgets = document.querySelectorAll(".skiptranslate");
      widgets.forEach((widget) => widget.remove());
      // restore fetch
      // @ts-ignore
      if ((window.fetch as any).name !== originalFetch.name) {
        window.fetch = originalFetch as any;
      }
    };
  }, [variant, includedLanguages]);

  return (
    <div className={`language-dropdown-container ${variant}`}>
      {showIcon && <Globe className="language-dropdown-icon" size={16} />}
      <div ref={translateRef} className="language-dropdown-wrapper" />
      {!isLoaded && (
        <div className="language-dropdown-fallback">
          <select
            className={`language-dropdown-select ${variant}`}
            disabled
            aria-label="Language selector"
            title="Select Language"
          >
            <option>Select Language</option>
          </select>
          <ChevronDown className="language-dropdown-chevron" size={14} />
        </div>
      )}
    </div>
  );
};

export default LanguageDropdown;
