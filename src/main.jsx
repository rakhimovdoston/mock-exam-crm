import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import store from "./store";
import App from "./App";
import "./index.css";
import { BrowserRouter as Router } from "react-router-dom";
import { ConfigProvider } from "antd";

ReactDOM.createRoot(document.getElementById("root")).render(
  <ConfigProvider
    theme={{
      token: {
        colorPrimary: "#E31837",
        colorBgBase: "#f8f9fa",
        colorTextBase: "#212529",
        colorBorderBase: "#ced4da", // Chegaralar uchun asosiy rang
      },
    }}
  >
    <React.StrictMode>
      <Provider store={store}>
        <Router>
          <App />
        </Router>
      </Provider>
    </React.StrictMode>
  </ConfigProvider>
);
