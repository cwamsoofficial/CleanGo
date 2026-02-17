import { useEffect, useRef, useState } from "react";
import { Globe } from "lucide-react";

declare global {
  interface Window {
    google: any;
    googleTranslateElementInit: () => void;
  }
}

interface LanguageSelectorProps {
  variant?: "compact" | "full";
}

const LanguageSelector = ({ variant = "compact" }: LanguageSelectorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [widgetReady, setWidgetReady] = useState(false);

  useEffect(() => {
    const containerId = `google-translate-${variant}-${Math.random().toString(36).slice(2, 8)}`;

    const initWidget = () => {
      if (!containerRef.current || !window.google?.translate?.TranslateElement) return;
      // Clear any previous widget content
      containerRef.current.innerHTML = "";
      containerRef.current.id = containerId;
      try {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: "en,ha,yo,ig,fr,ar,es,pt,de,zh-CN",
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
          },
          containerId
        );
        setWidgetReady(true);
      } catch (e) {
        console.warn("Google Translate init failed:", e);
      }
    };

    // If google translate is already loaded, init immediately
    if (window.google?.translate?.TranslateElement) {
      initWidget();
      return;
    }

    // Set up the global callback
    const prevInit = window.googleTranslateElementInit;
    window.googleTranslateElementInit = () => {
      prevInit?.();
      initWidget();
    };

    // Add script if not already present
    if (!document.getElementById("google-translate-script")) {
      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src =
        "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    }

    return () => {
      // Restore previous init if needed
      if (window.googleTranslateElementInit === initWidget) {
        window.googleTranslateElementInit = prevInit!;
      }
    };
  }, [variant]);

  return (
    <div className="flex items-center gap-2">
      {variant === "full" && (
        <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
      )}
      <div
        ref={containerRef}
        className="google-translate-container"
      />
      {!widgetReady && (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Globe className="h-4 w-4" />
          <span>Translate</span>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
