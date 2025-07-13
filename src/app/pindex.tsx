import React from "react"
import { createRoot } from "react-dom/client"

import Popout from "@/app/popout"

const rootElement = document.getElementById("root")
if (!rootElement) {
  const root = document.createElement("div")
  root.id = "root"
  document.body.appendChild(root)
}

const root = createRoot(rootElement ?? document.getElementById("root")!)
root.render(
  <React.StrictMode>
    <Popout />
  </React.StrictMode>
)
