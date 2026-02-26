"use client";

import { useI18n } from "@/i18n/context";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";

export default function Header() {
  const { locale, setLocale, t } = useI18n();
  const { state, dispatch } = useAppStore();

  const toggleTheme = () => {
    const next = state.theme === "light" ? "dark" : state.theme === "dark" ? "system" : "light";
    dispatch({ type: "SET_THEME", payload: next });
    if (next === "dark") document.documentElement.classList.add("dark");
    else if (next === "light") document.documentElement.classList.remove("dark");
    else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", prefersDark);
    }
  };

  return (
    <header className="h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center px-4 gap-4 z-50">
      <div className="flex items-center gap-2">
        <button
          onClick={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
          className="p-2 hover:bg-accent rounded-md lg:hidden"
          aria-label="Toggle sidebar"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <h1 className="text-base font-semibold hidden sm:block">{t.app.title}</h1>
        </div>
      </div>

      <p className="text-xs text-muted-foreground hidden md:block flex-1">
        {t.app.subtitle}
      </p>

      <div className="flex items-center gap-1 ml-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocale(locale === "tr" ? "en" : "tr")}
          className="text-xs font-medium px-2"
        >
          {locale === "tr" ? "EN" : "TR"}
        </Button>

        <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9">
          {state.theme === "dark" ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </Button>
      </div>
    </header>
  );
}
