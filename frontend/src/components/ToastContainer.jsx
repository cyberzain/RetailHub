import React from "react";
import { useStore } from "../context/StoreContext";

export default function ToastContainer() {
  const { toasts } = useStore();

  if (!toasts || toasts.length === 0) return null;

  const icons = {
    success: "fa-circle-check",
    error: "fa-circle-exclamation",
    warning: "fa-triangle-exclamation",
    info: "fa-circle-info"
  };

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type || "info"}`}>
          <i
            className={`fa-solid ${icons[t.type] || "fa-circle-info"}`}
            style={{
              fontSize: "16px",
              color:
                t.type === "success"
                  ? "#10b981"
                  : t.type === "error"
                  ? "#ef4444"
                  : t.type === "warning"
                  ? "#f59e0b"
                  : "#3b82f6"
            }}
          ></i>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
