#!/usr/bin/env node

import sharp from 'sharp';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

const icons = [
  { input: 'pwa-512x512.svg', output: 'pwa-512x512.png', size: 512 },
  { input: 'pwa-192x192.svg', output: 'pwa-192x192.png', size: 192 },
  { input: 'pwa-512x512.svg', output: 'apple-touch-icon.png', size: 180 },
  { input: 'pwa-512x512.svg', output: 'apple-touch-icon-180x180.png', size: 180 },
  { input: 'pwa-192x192.svg', output: 'apple-touch-icon-152x152.png', size: 152 },
  { input: 'pwa-192x192.svg', output: 'apple-touch-icon-120x120.png', size: 120 },
];

async function generateIcons() {
  console.log('Generating PNG icons from SVG...\n');

  for (const { input, output, size } of icons) {
    const inputPath = join(publicDir, input);
    const outputPath = join(publicDir, output);

    try {
      const svgBuffer = readFileSync(inputPath);

      await sharp(svgBuffer).resize(size, size).png().toFile(outputPath);

      console.log(`${output} (${size}x${size})`);
    } catch (error) {
      console.error(`Failed to generate ${output}:`, error.message);
    }
  }

  console.log('\nDone! PNG icons generated in public/');
}

generateIcons();
