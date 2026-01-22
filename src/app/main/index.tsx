import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from '@/app/main/app'

const rootElement = document.getElementById('root')
if (!rootElement) {
  const root = document.createElement('div')
  root.id = 'root'
  document.body.appendChild(root)
}

const root = createRoot(rootElement ?? document.getElementById('root')!)
root.render(
  <StrictMode>
    <App />
  </StrictMode>
)
