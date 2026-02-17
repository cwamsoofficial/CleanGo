import { useEffect, useRef } from "react";
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
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;

    const addScript = () => {
      if (document.getElementById("google-translate-script")) return;
      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src =
        "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    };

    window.googleTranslateElementInit = () => {
      if (!containerRef.current) return;
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: "en,ha,yo,ig,fr,ar,es,pt,de,zh-CN",
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false,
        },
        containerRef.current
      );
      initialized.current = true;
    };

    addScript();
  }, []);

  return (
    <div className="flex items-center gap-2">
      {variant === "full" && (
        <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
      )}
      <div
        ref={containerRef}
        className="google-translate-container"
      />
    </div>
  );
};

export default LanguageSelector;
