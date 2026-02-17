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
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");

  useEffect(() => {
    const containerId = `google-translate-${variant}-${Math.random().toString(36).slice(2, 8)}`;
    let timeoutId: ReturnType<typeof setTimeout>;
    let checkIntervalId: ReturnType<typeof setInterval>;

    const initWidget = () => {
      if (!containerRef.current || !window.google?.translate?.TranslateElement) return;
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
        // Check if the select element actually rendered
        checkIntervalId = setInterval(() => {
          const select = containerRef.current?.querySelector("select");
          if (select) {
            setStatus("ready");
            clearInterval(checkIntervalId);
          }
        }, 300);
      } catch (e) {
        console.warn("Google Translate init failed:", e);
        setStatus("failed");
      }
    };

    // Timeout: if widget doesn't render in 6s, show fallback
    timeoutId = setTimeout(() => {
      if (status === "loading") setStatus("failed");
      clearInterval(checkIntervalId);
    }, 6000);

    if (window.google?.translate?.TranslateElement) {
      initWidget();
    } else {
      const prevInit = window.googleTranslateElementInit;
      window.googleTranslateElementInit = () => {
        prevInit?.();
        initWidget();
      };

      if (!document.getElementById("google-translate-script")) {
        const script = document.createElement("script");
        script.id = "google-translate-script";
        script.src =
          "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
        script.async = true;
        script.onerror = () => setStatus("failed");
        document.body.appendChild(script);
      }
    }

    return () => {
      clearTimeout(timeoutId);
      clearInterval(checkIntervalId);
    };
  }, [variant]);

  return (
    <div className="flex items-center gap-2">
      {variant === "full" && status === "ready" && (
        <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
      )}
      <div
        ref={containerRef}
        className={`google-translate-container ${status === "ready" ? "" : "hidden"}`}
      />
      {status !== "ready" && (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground border border-border rounded-md px-3 py-1.5">
          <Globe className="h-4 w-4" />
          {status === "failed" ? (
            <span>Translation available after publish</span>
          ) : (
            <span>Loading…</span>
          )}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
