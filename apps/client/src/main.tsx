import React from "react"
import ReactDOM from "react-dom/client"

import App from "./app"
import "./globals.css"
import "./sentry"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
