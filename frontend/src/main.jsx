import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { StoreProvider } from "./context/StoreContext";

// Import core stylesheet system
import "../css/style.css";
import "../css/forms.css";
import "../css/dashboard.css";
import "../css/responsive.css";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <StoreProvider>
        <App />
      </StoreProvider>
    </AuthProvider>
  </React.StrictMode>
);
