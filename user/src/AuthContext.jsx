import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();
const API = window.location.origin.includes("localhost") ? "http://localhost:5000/api" : "https://steadfast-energy-production-a9d1.up.railway.app/api";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const d = localStorage.getItem("everest_user");
      if (!d) return null;
      const u = JSON.parse(d);
      const st = localStorage.getItem("everest_session_token");
      if (st) u.session_token = st;
      return u;
    } catch { return null; }
  });

  // Heartbeat: ping server every 5 seconds to keep session alive
  useEffect(() => {
    if (!user?.id) return;
    const interval = setInterval(() => {
      fetch(`${API}/auth/heartbeat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id }),
      }).catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const login = (u, sessionToken) => {
    const userData = { ...u, session_token: sessionToken || u.session_token };
    setUser(userData);
    localStorage.setItem("everest_user", JSON.stringify(userData));
    localStorage.setItem("everest_session_token", userData.session_token);
  };

  const logout = () => {
    try {
      const u = JSON.parse(localStorage.getItem("everest_user"));
      if (u && u.id && u.session_token) {
        fetch(`${API}/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": u.id,
            "x-session-token": u.session_token,
          },
        }).catch(() => {});
      }
    } catch {}
    setUser(null);
    localStorage.removeItem("everest_user");
    localStorage.removeItem("everest_session_token");
  };

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
