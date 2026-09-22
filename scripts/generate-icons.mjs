// Regenerates every PWA/touch/favicon icon from the one logo source,
// src/assets/gitbit-logo.png (512x512). Run after replacing it: npm run icons
//
// The maskable icon reuses the same art: its lime circle stays within 197px
// of the centre, inside the 80% safe zone (205px) that Android masks keep.
import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const source = path.join(root, 'src/assets/gitbit-logo.png')
const publicDir = path.join(root, 'public')

await mkdir(path.join(publicDir, 'icons'), { recursive: true })

// The header renders the mark at 28 CSS px; 84 covers a 3x screen. Shipping the
// 512px source there cost 24 KB on the critical path to draw a 28px square.
const appAsset = { out: 'gitbit-logo-84.png', size: 84 }

const targets = [
  { out: 'icons/icon-192.png', size: 192 },
  { out: 'icons/icon-512.png', size: 512 },
  { out: 'icons/icon-maskable-512.png', size: 512 },
  { out: 'apple-touch-icon.png', size: 180 },
  { out: 'favicon.png', size: 48 },
]

for (const { out, size } of targets) {
  await sharp(source).resize(size, size, { kernel: 'lanczos3' }).png().toFile(path.join(publicDir, out))
  console.log(`wrote ${out} (${size}x${size})`)
}

// Bundled rather than served from public/, so Vite hashes it and the service
// worker precaches it with everything else.
await sharp(source)
  .resize(appAsset.size, appAsset.size, { kernel: 'lanczos3' })
  .png({ compressionLevel: 9 })
  .toFile(path.join(root, 'src/assets', appAsset.out))
console.log(`wrote src/assets/${appAsset.out} (${appAsset.size}x${appAsset.size})`)
