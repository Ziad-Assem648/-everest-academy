import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

const darkColors = {
  bg: "#0B0712",
  bgCard: "#130B1F",
  bgInput: "#1A0E28",
  bgSoft: "#130B1F",
  heroBg: "#0B0712",
  sectionBg: "#0E0818",
  sectionAltBg: "#130B1F",
  blue: "#6E3BF2",
  primary: "#6E3BF2",
  primaryEnd: "#B88BFF",
  gold: "#6E3BF2",
  goldLight: "rgba(110,59,242,0.12)",
  accent: "#B88BFF",
  text: "#E9D8FF",
  textMuted: "#B0A0C8",
  textSoft: "#C8B5E8",
  border: "#2A1248",
  borderLight: "#3D1A6E",
  shadow: "rgba(110,59,242,0.15)",
  heroText: "#B8A5D8",
  error: "#ef4444",
};

const lightColors = {
  bg: "#F8F6FF",
  bgCard: "#FFFFFF",
  bgInput: "#F1ECFF",
  bgSoft: "#F1ECFF",
  heroBg: "#F0ECFF",
  sectionBg: "#F8F6FF",
  sectionAltBg: "#F1ECFF",
  blue: "#6E3BF2",
  primary: "#6E3BF2",
  primaryEnd: "#B88BFF",
  gold: "#6E3BF2",
  goldLight: "rgba(110,59,242,0.08)",
  accent: "#B88BFF",
  text: "#1A1230",
  textMuted: "#6E5A8E",
  textSoft: "#7F68A0",
  border: "#D8CCFF",
  borderLight: "#E9D8FF",
  shadow: "rgba(110,59,242,0.08)",
  heroText: "#5F547A",
  error: "#dc2626",
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("everest_theme");
    if (saved) return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("everest_theme", theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  const colors = theme === "dark" ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
