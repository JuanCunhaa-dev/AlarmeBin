import sharp from 'sharp'
import pngToIco from 'png-to-ico'
import { mkdir, writeFile } from 'node:fs/promises'

const svg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="118" fill="#0d0912"/>
  <circle cx="256" cy="270" r="142" fill="none" stroke="#a855f7" stroke-width="34"/>
  <path d="M256 185v92l64 42" fill="none" stroke="#f5e9ff" stroke-width="30" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M135 108L83 166M377 108l52 58" stroke="#c084fc" stroke-width="34" stroke-linecap="round"/>
</svg>`

await mkdir('build', { recursive: true })
await writeFile('build/icon.svg', svg)
const image = sharp(Buffer.from(svg)).resize(512, 512)
await image.png().toFile('build/icon.png')
await writeFile('build/icon.ico', await pngToIco('build/icon.png'))
