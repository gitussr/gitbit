import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Latin-only subsets: GitBit's content is English, and the "latin" subset's
// unicode-range (U+2000-206F) already covers the em dashes/curly quotes used
// throughout the copy — no need to ship Cyrillic/Greek/Vietnamese/latin-ext glyphs.
import '@fontsource/manrope/latin-400.css'
import '@fontsource/manrope/latin-500.css'
import '@fontsource/manrope/latin-600.css'
import '@fontsource/manrope/latin-700.css'
import '@fontsource/ubuntu-mono/latin-400.css'
import '@fontsource/ubuntu-mono/latin-700.css'
import './index.css'
import { App } from './app/App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
