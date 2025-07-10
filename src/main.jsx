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
        colorPrimary: "#4CAF50", // Asosiy rang (yashil)
        colorSuccess: "#28a745", // Muvaffaqiyat rangi
        colorError: "#dc3545", // Xato rangi
        colorWarning: "#ffc107", // Ogohlantirish rangi
        colorInfo: "#17a2b8", // Ma'lumot rangi
        colorTextBase: "#212529", // Matnning asosiy rangi
        colorBgBase: "#f8f9fa", // Asosiy fon rangi
        colorBorderBase: "#ced4da", // Asosiy chegara rangi
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
