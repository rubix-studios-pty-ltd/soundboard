import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from '@/app/popout/app'

const rootElement = document.getElementById('root')
if (!rootElement) {
  const root = document.createElement('div')
  root.id = 'root'
  document.body.appendChild(root)
}

const actualRootElement = rootElement ?? document.getElementById('root');

if (!actualRootElement) {
  throw new Error('Root element not found');
}

const root = createRoot(actualRootElement);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
)
