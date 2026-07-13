import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("everest_theme") || "light");
  const toggle = () => setTheme((t) => { const n = t === "light" ? "dark" : "light"; localStorage.setItem("everest_theme", n); return n; });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.body.setAttribute("data-theme", theme);
    document.body.style.transition = "background 0.3s ease, color 0.3s ease";
    document.body.style.background = theme === "dark" ? "#0f0f13" : "#f5f5f7";
    document.body.style.color = theme === "dark" ? "#e8e8ec" : "#111111";
  }, [theme]);

  const c = theme === "dark"
    ? {
        bg: "#0f0f13",
        bgSoft: "#1a1a24",
        bgCard: "#1e1e2e",
        bgInput: "#252538",
        text: "#e8e8ec",
        textSoft: "#9a9aae",
        textMuted: "#6a6a7e",
        border: "rgba(255,255,255,0.06)",
        borderLight: "rgba(255,255,255,0.1)",
        primary: "#d4af37",
        primarySoft: "rgba(212,175,55,0.1)",
        gold: "#d4af37",
        goldLight: "rgba(212,175,55,0.08)",
        shadow: "0 4px 20px rgba(0,0,0,0.3)",
        shadowLg: "0 10px 40px rgba(0,0,0,0.4)",
        navBg: "rgba(20,20,30,0.92)",
        backdrop: "rgba(0,0,0,0.5)",
        overlay: "rgba(0,0,0,0.6)",
        inputBg: "rgba(255,255,255,0.04)",
        inputBorder: "rgba(255,255,255,0.1)",
        heroBg: "#151515",
        heroText: "#b7b7b7",
        sectionBg: "#0b0b0f",
        sectionAltBg: "#111217",
        cardHover: "rgba(255,255,255,0.03)",
        success: "#22c55e",
        error: "#ef4444",
        warning: "#f59e0b",
        blue: "#2563ff",
        purple: "#a855f7",
        gradient: "linear-gradient(135deg, #1e1e2e, #0f0f13)",
      }
    : {
        bg: "#f5f5f7",
        bgSoft: "#ffffff",
        bgCard: "#ffffff",
        bgInput: "#f5f5f5",
        text: "#111111",
        textSoft: "#555555",
        textMuted: "#888888",
        border: "rgba(0,0,0,0.06)",
        borderLight: "rgba(0,0,0,0.1)",
        primary: "#d4af37",
        primarySoft: "rgba(212,175,55,0.1)",
        gold: "#d4af37",
        goldLight: "rgba(212,175,55,0.08)",
        shadow: "0 4px 20px rgba(0,0,0,0.04)",
        shadowLg: "0 10px 40px rgba(0,0,0,0.08)",
        navBg: "rgba(255,255,255,0.92)",
        backdrop: "rgba(0,0,0,0.3)",
        overlay: "rgba(255,255,255,0.8)",
        inputBg: "#ffffff",
        inputBorder: "rgba(0,0,0,0.08)",
        heroBg: "#f7f6f3",
        heroText: "#666666",
        sectionBg: "#ffffff",
        sectionAltBg: "#f9f9f9",
        cardHover: "rgba(0,0,0,0.02)",
        success: "#22c55e",
        error: "#ef4444",
        warning: "#f59e0b",
        blue: "#2563ff",
        purple: "#a855f7",
        gradient: "linear-gradient(135deg, #ffffff, #f5f5f7)",
      };

  return <ThemeContext.Provider value={{ theme, toggle, colors: c }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
