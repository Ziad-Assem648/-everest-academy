import React, { createContext, useContext, useState } from "react";

const LangContext = createContext();

export function LangProvider({ children }) {
  const [lang, setLang] = useState("ar");
  const toggle = () => setLang((l) => (l === "ar" ? "en" : "ar"));

  const t = (ar, en) => lang === "ar" ? ar : en;

  return <LangContext.Provider value={{ lang, setLang, toggle, t }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}
