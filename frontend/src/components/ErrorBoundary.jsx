import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("RetailHub caught render error:", error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.clear();
    } catch (_) {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#091a14",
            color: "#ffffff",
            fontFamily: "Inter, sans-serif",
            padding: "24px",
            textAlign: "center"
          }}
        >
          <div
            style={{
              background: "#10261f",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "16px",
              padding: "36px",
              maxWidth: "520px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)"
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "rgba(239, 68, 68, 0.2)",
                color: "#ef4444",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                margin: "0 auto 16px"
              }}
            >
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <h2 style={{ fontSize: "20px", fontWeight: "800", marginBottom: "8px" }}>
              Something went wrong loading the view
            </h2>
            <p style={{ fontSize: "13px", color: "#9ab3a6", marginBottom: "20px", lineHeight: "1.5" }}>
              {this.state.error?.message || "An unexpected error occurred. Click below to refresh your local cache and resume."}
            </p>
            <button
              onClick={this.handleReset}
              style={{
                background: "linear-gradient(90deg, #059669, #10b981)",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "12px 24px",
                fontSize: "14px",
                fontWeight: "700",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(5, 150, 105, 0.4)"
              }}
            >
              <i className="fa-solid fa-rotate-right" style={{ marginRight: "8px" }}></i>
              Reset Local Cache & Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
