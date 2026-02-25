import { useEffect, useRef, useState, useCallback } from "react";
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
  const statusRef = useRef<"loading" | "ready" | "failed">("loading");

  // Keep ref in sync with state so timeouts/intervals can read the latest value
  const updateStatus = useCallback((newStatus: "loading" | "ready" | "failed") => {
    statusRef.current = newStatus;
    setStatus(newStatus);
  }, []);

  useEffect(() => {
    const containerId = `google-translate-${variant}-${Math.random().toString(36).slice(2, 8)}`;
    let timeoutId: ReturnType<typeof setTimeout>;
    let checkIntervalId: ReturnType<typeof setInterval>;
    let observer: MutationObserver | null = null;

    const markReadyIfRendered = () => {
      const hasWidget = Boolean(
        containerRef.current?.querySelector("select, .goog-te-combo, .goog-te-gadget, iframe")
      );
      if (hasWidget) {
        updateStatus("ready");
        return true;
      }
      return false;
    };

    const initWidget = () => {
      if (!containerRef.current || !window.google?.translate?.TranslateElement) return;
      containerRef.current.innerHTML = "";
      containerRef.current.id = containerId;

      try {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: "en,ha,yo,ig,fr,ar,es,pt,de,zh-CN,zh-TW,hi,bn,ur,sw,am,zu,af,nl,it,ru,ja,ko,tr,pl,vi,th,id,ms,tl,he,fa,uk,ro,el,cs,hu,sv,da,no,fi",
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
          },
          containerId
        );

        checkIntervalId = setInterval(() => {
          if (markReadyIfRendered()) clearInterval(checkIntervalId);
        }, 250);

        observer = new MutationObserver(() => {
          if (markReadyIfRendered() && observer) {
            observer.disconnect();
            observer = null;
          }
        });

        observer.observe(containerRef.current, { childList: true, subtree: true });
      } catch (e) {
        console.warn("Google Translate init failed:", e);
        updateStatus("failed");
      }
    };

    timeoutId = setTimeout(() => {
      if (statusRef.current === "loading") updateStatus("failed");
      clearInterval(checkIntervalId);
      observer?.disconnect();
    }, 10000);

    if (window.google?.translate?.TranslateElement) {
      initWidget();
    } else {
      const prevInit = window.googleTranslateElementInit;
      window.googleTranslateElementInit = () => {
        prevInit?.();
        initWidget();
      };

      const existingScript = document.getElementById("google-translate-script") as HTMLScriptElement | null;

      if (!existingScript) {
        const script = document.createElement("script");
        script.id = "google-translate-script";
        script.src =
          "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
        script.async = true;
        script.onerror = () => updateStatus("failed");
        script.onload = () => {
          script.dataset.loaded = "true";
        };
        document.body.appendChild(script);
      } else {
        existingScript.addEventListener("load", initWidget, { once: true });
        if (existingScript.dataset.loaded === "true") initWidget();
      }
    }

    return () => {
      clearTimeout(timeoutId);
      clearInterval(checkIntervalId);
      observer?.disconnect();
    };
  }, [variant, updateStatus]);

  return (
    <div className="flex items-center gap-2">
      {variant === "full" && status === "ready" && (
        <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
      )}
      <div
        ref={containerRef}
        className={`google-translate-container ${status === "ready" ? "" : "hidden"}`}
      />
      {status !== "ready" && variant === "full" && (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground border border-border rounded-md px-3 py-1.5">
          <Globe className="h-4 w-4" />
          {status === "failed" ? (
            <button
              onClick={() => {
                updateStatus("loading");
                // Remove old script and re-add
                const oldScript = document.getElementById("google-translate-script");
                if (oldScript) oldScript.remove();
                const script = document.createElement("script");
                script.id = "google-translate-script";
                script.src =
                  "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
                script.async = true;
                script.onerror = () => updateStatus("failed");
                script.onload = () => {
                  script.dataset.loaded = "true";
                };
                document.body.appendChild(script);
              }}
              className="underline hover:text-foreground transition-colors"
            >
              Translation failed to load — tap to retry
            </button>
          ) : (
            <span>Loading…</span>
          )}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;

