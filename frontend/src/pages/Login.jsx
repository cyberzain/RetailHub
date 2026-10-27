import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../context/StoreContext";

export default function Login({ setTab }) {
  const { login, loading } = useAuth();
  const { showToast } = useStore();

  const [activePortal, setActivePortal] = useState("manager"); // 'manager' | 'sales'
  const [email, setEmail] = useState("manager@retailhub.com");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");

  const handlePortalSwitch = (portal) => {
    setActivePortal(portal);
    setError("");
    if (portal === "manager") {
      setEmail("manager@retailhub.com");
      setPassword("admin123");
    } else {
      setEmail("cashier@retailhub.com");
      setPassword("admin123");
    }
  };

  const handleDemoFill = (demoEmail, demoPass, portal) => {
    setActivePortal(portal);
    setEmail(demoEmail);
    setPassword(demoPass);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const res = await login(email, password);
    if (res.success) {
      showToast(`Welcome back, ${res.user.name}! (${res.user.role})`, "success");
      if (res.user.role === "Salesperson" || res.user.role === "Cashier") {
        setTab("pos");
      } else {
        setTab("dashboard");
      }
    } else {
      setError(res.error || "Authentication failed. Please check your credentials.");
      showToast(res.error || "Invalid login credentials", "error");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(circle at top right, #065f46, #091a14 75%)",
        padding: "20px"
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          background: "#ffffff",
          borderRadius: "20px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
          padding: "36px",
          boxSizing: "border-box"
        }}
      >
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div
            style={{
              margin: "0 auto 12px",
              width: "52px",
              height: "52px",
              fontSize: "24px",
              background: "linear-gradient(135deg, #059669, #10b981)",
              color: "#ffffff",
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 6px 16px rgba(5, 150, 105, 0.35)"
            }}
          >
            <i className="fa-solid fa-store"></i>
          </div>
          <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "800", color: "var(--text-main)" }}>
            Retail<span style={{ color: "var(--primary)" }}>Hub</span>
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: "13.5px", color: "var(--text-muted)" }}>
            Next-Gen Cloud Retail Management & POS
          </p>
        </div>

        {/* Portal Switcher */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            background: "#f1f5f9",
            borderRadius: "12px",
            padding: "4px",
            marginBottom: "20px",
            gap: "4px",
            border: "1px solid var(--border)"
          }}
        >
          <button
            type="button"
            onClick={() => handlePortalSwitch("manager")}
            style={{
              border: "none",
              padding: "10px",
              fontSize: "13px",
              fontWeight: "700",
              borderRadius: "9px",
              cursor: "pointer",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              background: activePortal === "manager" ? "#059669" : "transparent",
              color: activePortal === "manager" ? "#ffffff" : "var(--text-muted)",
              boxShadow: activePortal === "manager" ? "0 4px 10px rgba(5, 150, 105, 0.25)" : "none"
            }}
          >
            <i className="fa-solid fa-user-tie"></i>
            Manager Portal
          </button>
          <button
            type="button"
            onClick={() => handlePortalSwitch("sales")}
            style={{
              border: "none",
              padding: "10px",
              fontSize: "13px",
              fontWeight: "700",
              borderRadius: "9px",
              cursor: "pointer",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              background: activePortal === "sales" ? "#059669" : "transparent",
              color: activePortal === "sales" ? "#ffffff" : "var(--text-muted)",
              boxShadow: activePortal === "sales" ? "0 4px 10px rgba(5, 150, 105, 0.25)" : "none"
            }}
          >
            <i className="fa-solid fa-cash-register"></i>
            Salesperson Portal
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: "10px",
              background: "#fee2e2",
              border: "1px solid #fca5a5",
              color: "#991b1b",
              fontSize: "13px",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}
          >
            <i className="fa-solid fa-circle-exclamation"></i>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: "16px" }}>
            <label className="form-label" style={{ fontSize: "13px", fontWeight: "600" }}>
              Email or Username
            </label>
            <div className="input-group">
              <i className="fa-regular fa-envelope input-prefix"></i>
              <input
                type="text"
                className="form-control"
                placeholder="name@retailhub.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <label className="form-label" style={{ fontSize: "13px", fontWeight: "600", margin: 0 }}>
                Password
              </label>
              <span style={{ fontSize: "12px", color: "var(--primary)", cursor: "pointer", fontWeight: "600" }}>
                Forgot?
              </span>
            </div>
            <div className="input-group">
              <i className="fa-solid fa-lock input-prefix"></i>
              <input
                type={showPassword ? "text" : "password"}
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: "transparent",
                  border: "none",
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                  cursor: "pointer"
                }}
              >
                <i className={`fa-regular ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
              </button>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{ marginRight: "8px", accentColor: "var(--primary)" }}
            />
            <label htmlFor="remember" style={{ fontSize: "13px", color: "var(--text-muted)", cursor: "pointer" }}>
              Remember me on this terminal
            </label>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: "100%", padding: "12px", fontSize: "14px", fontWeight: "700" }}
          >
            {loading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: "8px" }}></i>
                Signing In...
              </>
            ) : (
              `Sign In as ${activePortal === "manager" ? "Manager" : "Salesperson"}`
            )}
          </button>
        </form>

        {/* 1-Click Demo Accounts */}
        <div style={{ marginTop: "24px", paddingTop: "18px", borderTop: "1px solid var(--border)" }}>
          <div style={{ fontSize: "11.5px", fontWeight: "700", color: "var(--text-muted)", marginBottom: "8px", textTransform: "uppercase" }}>
            ⚡ 1-Click Demo Accounts (Pass: admin123)
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            <button
              type="button"
              className="badge badge-success"
              onClick={() => handleDemoFill("owner@retailhub.com", "admin123", "manager")}
              style={{ cursor: "pointer", border: "none" }}
            >
              Owner (Zain K.)
            </button>
            <button
              type="button"
              className="badge badge-info"
              onClick={() => handleDemoFill("manager@retailhub.com", "admin123", "manager")}
              style={{ cursor: "pointer", border: "none" }}
            >
              Manager (Rahul V.)
            </button>
            <button
              type="button"
              className="badge badge-neutral"
              onClick={() => handleDemoFill("cashier@retailhub.com", "admin123", "sales")}
              style={{ cursor: "pointer", border: "none" }}
            >
              Sales (Anjali M.)
            </button>
            <button
              type="button"
              className="badge badge-neutral"
              onClick={() => handleDemoFill("sales@retailhub.com", "admin123", "sales")}
              style={{ cursor: "pointer", border: "none" }}
            >
              Sales (Vikram D.)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
