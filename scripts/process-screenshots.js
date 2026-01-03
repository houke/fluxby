// Batch process screenshots: overlay each with osx-frame.svg and save as PNG in processed/
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_DIR = path.join(__dirname, '../apps/screenshots');
const FRAME_PATH = path.join(SRC_DIR, 'frame.svg');
const FRAME_WIDTH = 900;
const FRAME_HEIGHT = 600;
const FRAME_X = 20;
const FRAME_Y = 20;
const TOPBAR_HEIGHT = 56; // height of the top bar inside the frame

async function processScreenshot(screenshotPath, outPath) {
  // Resize screenshot to fit the inner content area (full width, height minus top bar)
  const contentHeight = FRAME_HEIGHT - TOPBAR_HEIGHT;
  const screenshotBuf = await sharp(screenshotPath)
    .resize(FRAME_WIDTH, contentHeight, { fit: 'cover', position: 'top' })
    .png()
    .toBuffer();

  // Build a transparent canvas for the frame's inner area, place screenshot at y = TOPBAR_HEIGHT
  const innerCanvas = await sharp({
    create: {
      width: FRAME_WIDTH,
      height: FRAME_HEIGHT,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: screenshotBuf, left: 0, top: TOPBAR_HEIGHT }])
    .png()
    .toBuffer();

  // Create mask SVG: rounded rect white, with top area blacked out so screenshot doesn't show behind top bar
  const maskSVG = `
    <svg width="${FRAME_WIDTH}" height="${FRAME_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="${FRAME_WIDTH}" height="${FRAME_HEIGHT}" rx="32" fill="white"/>
      <rect x="0" y="0" width="${FRAME_WIDTH}" height="${TOPBAR_HEIGHT}" fill="black"/>
    </svg>`;

  // Apply mask (dest-in) to clip sides and bottom to rounded corners, and hide top area
  const maskedInner = await sharp(innerCanvas)
    .composite([{ input: Buffer.from(maskSVG), blend: 'dest-in' }])
    .png()
    .toBuffer();

  // Prepare frame (SVG) as PNG
  const frame = sharp(FRAME_PATH)
    .resize(FRAME_WIDTH + 40, FRAME_HEIGHT + 40)
    .png();
  const frameBuffer = await frame.toBuffer();

  // Composite masked inner content onto larger canvas and overlay frame on top
  await sharp({
    create: {
      width: FRAME_WIDTH + 40,
      height: FRAME_HEIGHT + 40,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      { input: maskedInner, left: FRAME_X, top: FRAME_Y },
      { input: frameBuffer, left: 0, top: 0 },
    ])
    .png()
    .toFile(outPath);
}

async function main() {
  let files = fs
    .readdirSync(SRC_DIR)
    .filter((f) => f.endsWith('.png') && !f.includes('processed'))
    .sort();
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const srcPath = path.join(SRC_DIR, file);
    // overwrite original screenshot with processed output
    const outPath = srcPath;
    console.log(`Processing ${file} -> ${path.basename(outPath)}`);
    await processScreenshot(srcPath, outPath);
  }
  console.log('All screenshots processed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
