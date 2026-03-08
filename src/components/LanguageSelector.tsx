import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Globe, Search, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

declare global {
  interface Window {
    google: any;
    googleTranslateElementInit: () => void;
  }
}

interface LanguageSelectorProps {
  variant?: "compact" | "full";
}

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "af", name: "Afrikaans" },
  { code: "am", name: "Amharic" },
  { code: "ar", name: "Arabic" },
  { code: "bn", name: "Bengali" },
  { code: "cs", name: "Czech" },
  { code: "da", name: "Danish" },
  { code: "de", name: "German" },
  { code: "el", name: "Greek" },
  { code: "es", name: "Spanish" },
  { code: "fa", name: "Persian" },
  { code: "fi", name: "Finnish" },
  { code: "fr", name: "French" },
  { code: "ha", name: "Hausa" },
  { code: "he", name: "Hebrew" },
  { code: "hi", name: "Hindi" },
  { code: "hu", name: "Hungarian" },
  { code: "id", name: "Indonesian" },
  { code: "ig", name: "Igbo" },
  { code: "it", name: "Italian" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "ms", name: "Malay" },
  { code: "nl", name: "Dutch" },
  { code: "no", name: "Norwegian" },
  { code: "pl", name: "Polish" },
  { code: "pt", name: "Portuguese" },
  { code: "ro", name: "Romanian" },
  { code: "ru", name: "Russian" },
  { code: "sv", name: "Swedish" },
  { code: "sw", name: "Swahili" },
  { code: "th", name: "Thai" },
  { code: "tl", name: "Filipino" },
  { code: "tr", name: "Turkish" },
  { code: "uk", name: "Ukrainian" },
  { code: "ur", name: "Urdu" },
  { code: "vi", name: "Vietnamese" },
  { code: "yo", name: "Yoruba" },
  { code: "zh-CN", name: "Chinese (Simplified)" },
  { code: "zh-TW", name: "Chinese (Traditional)" },
  { code: "zu", name: "Zulu" },
];

const LanguageSelector = ({ variant = "compact" }: LanguageSelectorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");
  const statusRef = useRef<"loading" | "ready" | "failed">("loading");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState(() => {
    const browserLang = navigator.language || (navigator as any).userLanguage || "en";
    // Try exact match first (e.g. "zh-CN"), then base language (e.g. "fr" from "fr-FR")
    const exact = LANGUAGES.find((l) => l.code === browserLang);
    if (exact) return exact.code;
    const base = browserLang.split("-")[0];
    const partial = LANGUAGES.find((l) => l.code === base);
    return partial ? partial.code : "en";
  });
  const autoDetectedRef = useRef(false);

  const updateStatus = useCallback((newStatus: "loading" | "ready" | "failed") => {
    statusRef.current = newStatus;
    setStatus(newStatus);
  }, []);

  const filteredLanguages = useMemo(
    () => LANGUAGES.filter((l) => l.name.toLowerCase().includes(search.toLowerCase())),
    [search]
  );

  // Initialize hidden Google Translate widget
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
            includedLanguages: LANGUAGES.map((l) => l.code).join(","),
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
        script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
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

  const handleSelectLanguage = (langCode: string) => {
    setSelectedLang(langCode);
    setOpen(false);
    setSearch("");

    // Trigger Google Translate via the hidden <select>
    const combo = containerRef.current?.querySelector<HTMLSelectElement>(".goog-te-combo");
    if (combo) {
      combo.value = langCode;
      combo.dispatchEvent(new Event("change", { bubbles: true }));
    }
  };

  const currentLangName = LANGUAGES.find((l) => l.code === selectedLang)?.name ?? "English";

  return (
    <div className="flex items-center gap-2">
      {/* Hidden Google Translate widget */}
      <div ref={containerRef} className="hidden" aria-hidden="true" />

      {status === "ready" ? (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="justify-between gap-2 min-w-[180px]"
            >
              <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{currentLangName}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[240px] p-0" align="start">
            <div className="flex items-center border-b px-3 py-2">
              <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
              <Input
                placeholder="Search languages..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
              />
            </div>
            <ScrollArea className="h-[260px]">
              <div className="p-1">
                {filteredLanguages.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">No language found.</p>
                ) : (
                  filteredLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleSelectLanguage(lang.code)}
                      className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <Check
                        className={`mr-2 h-4 w-4 shrink-0 ${
                          selectedLang === lang.code ? "opacity-100" : "opacity-0"
                        }`}
                      />
                      {lang.name}
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      ) : (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground border border-border rounded-md px-3 py-1.5">
          <Globe className="h-4 w-4" />
          {status === "failed" ? (
            <button
              onClick={() => {
                updateStatus("loading");
                const oldScript = document.getElementById("google-translate-script");
                if (oldScript) oldScript.remove();
                const script = document.createElement("script");
                script.id = "google-translate-script";
                script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
                script.async = true;
                script.onerror = () => updateStatus("failed");
                script.onload = () => { script.dataset.loaded = "true"; };
                document.body.appendChild(script);
              }}
              className="underline hover:text-foreground transition-colors"
            >
              Translation failed — tap to retry
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
