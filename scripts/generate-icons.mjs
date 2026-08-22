// Regenerates PWA/touch icons from public/icon.svg and public/icon-maskable.svg.
// Run after editing either source SVG: npm run icons
import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const publicDir = path.join(root, 'public')
const iconsDir = path.join(publicDir, 'icons')

await mkdir(iconsDir, { recursive: true })

const targets = [
  { src: 'icon.svg', out: 'icons/icon-192.png', size: 192 },
  { src: 'icon.svg', out: 'icons/icon-512.png', size: 512 },
  { src: 'icon-maskable.svg', out: 'icons/icon-maskable-512.png', size: 512 },
  { src: 'icon.svg', out: 'apple-touch-icon.png', size: 180 },
]

for (const { src, out, size } of targets) {
  const input = path.join(publicDir, src)
  const output = path.join(publicDir, out)
  await sharp(input, { density: 384 }).resize(size, size).png().toFile(output)
  console.log(`wrote ${out} (${size}x${size})`)
}
