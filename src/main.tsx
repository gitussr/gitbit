import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Latin-only subsets: GitBit's content is English, and the "latin" subset's
// unicode-range (U+2000-206F) already covers the em dashes/curly quotes used
// throughout the copy — no need to ship Cyrillic/Greek/Vietnamese/latin-ext glyphs.
// 400/600/700 only. Nothing asks for 500 any more — it was serving two
// elements, and each weight is a 14 KB file fetched in the first-paint
// window (Section 25).
import '@fontsource/manrope/latin-400.css'
import '@fontsource/manrope/latin-600.css'
import '@fontsource/manrope/latin-700.css'
import '@fontsource/cascadia-code/latin-400.css'
import '@fontsource/cascadia-code/latin-700.css'
import './index.css'
import { App } from './app/App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
