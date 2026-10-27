import React, { useState, useEffect } from "react";
import { formatCurrency, api } from "../services/api";

export default function AIInsights() {
  const [insights, setInsights] = useState(null);
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "Hello! I am your RetailHub AI business assistant. You can ask me about demand forecasting, stock reorder suggestions, slow-moving inventory, or margins."
    }
  ]);
  const [input, setInput] = useState("");

  useEffect(() => {
    const load = async () => {
      const data = await api.getAIInsights();
      setInsights(data);
    };
    load();
  }, []);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { sender: "user", text: userMsg }]);

    setTimeout(() => {
      let reply = "Based on your real-time sales velocity: Electronics and Audio represent your highest margin contributors (28%). Consider restocking items like iPhone 15 and Sony Headphones to maintain 100% order fulfillment.";
      const q = userMsg.toLowerCase();
      if (q.includes("reorder") || q.includes("stock")) {
        reply = `You have ${insights?.reorderAlerts?.length || 2} items reaching threshold levels. I recommend issuing purchase orders totaling ~$1,500 to avoid stockouts this weekend.`;
      } else if (q.includes("profit") || q.includes("revenue")) {
        reply = `7-Day forecasted revenue is approximately ${formatCurrency(insights?.estimatedRevenue || 3450)} with an 89% seasonal trend confidence score.`;
      }
      setMessages((prev) => [...prev, { sender: "ai", text: reply }]);
    }, 400);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* 7-Day Revenue Forecast */}
      {insights && (
        <div className="card" style={{ padding: "20px", background: "linear-gradient(135deg, #064e3b, #047857)", color: "#ffffff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span className="badge" style={{ background: "rgba(255,255,255,0.2)", color: "#a7f3d0", marginBottom: "8px" }}>
                AI Demand Prediction
              </span>
              <h2 style={{ margin: "4px 0", fontSize: "24px", color: "#ffffff" }}>
                {formatCurrency(insights.estimatedRevenue)}
              </h2>
              <p style={{ margin: 0, fontSize: "12.5px", color: "#d1fae5" }}>
                Predicted revenue for {insights.forecastPeriod} • {insights.growthConfidence}
              </p>
            </div>
            <i className="fa-solid fa-wand-magic-sparkles" style={{ fontSize: "36px", opacity: 0.8 }}></i>
          </div>
        </div>
      )}

      {/* Two Column: Smart Reorder Drafter & AI Chat */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* Reorder Alerts */}
        <div className="card" style={{ padding: "18px" }}>
          <h3 style={{ margin: "0 0 12px", fontSize: "15px", fontWeight: "700" }}>Smart Reorder Recommendations</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {insights?.reorderAlerts?.map((a) => (
              <div key={a.id} style={{ padding: "12px", borderRadius: "10px", background: "#f8fafc", border: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: "700", fontSize: "13px" }}>{a.name}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Current: {a.currentStock} | Min: {a.minStock}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span className="badge badge-warning">Order +{a.suggestedQty}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Copilot Chat */}
        <div className="card" style={{ padding: "18px", display: "flex", flexDirection: "column", height: "420px" }}>
          <h3 style={{ margin: "0 0 12px", fontSize: "15px", fontWeight: "700" }}>RetailHub AI Copilot Chat</h3>
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", paddingRight: "4px" }}>
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: m.sender === "user" ? "flex-end" : "flex-start",
                  maxWidth: "80%",
                  padding: "10px 14px",
                  borderRadius: "12px",
                  background: m.sender === "user" ? "var(--primary)" : "#f1f5f9",
                  color: m.sender === "user" ? "#ffffff" : "var(--text-main)",
                  fontSize: "12.5px",
                  lineHeight: 1.4
                }}
              >
                {m.text}
              </div>
            ))}
          </div>

          <form onSubmit={handleSend} style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
            <input
              type="text"
              className="form-control"
              placeholder="Ask AI assistant about inventory, sales, or margins..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{ fontSize: "12.5px" }}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: "8px 16px" }}>
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
