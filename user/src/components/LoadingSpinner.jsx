import React from "react";

export default function LoadingSpinner({ size = 18, color = "currentColor", style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", animation: "ospin 0.7s linear infinite", ...style }}>
      <style>{`@keyframes ospin{to{transform:rotate(360deg)}}`}</style>
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="3" strokeLinecap="round" strokeDasharray="50 14" />
    </svg>
  );
}
