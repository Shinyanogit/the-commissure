import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Four iPhone 17 Pro Max portrait screenshots.
const FULL_WIDTH = 5280;
const FULL_HEIGHT = 2868;
const SPLIT_WIDTH = 1320;
const NUM_SPLITS = 4;

async function waitForServer(url, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) return true;
    } catch (e) {
      // Server not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error('Server did not start in time');
}

async function capture() {
  console.log('Starting Vite dev server...');

  const viteProcess = spawn('npm', ['run', 'dev', '--', '--port', '5175'], {
    cwd: __dirname,
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: false
  });

  viteProcess.stdout.on('data', (data) => {
    console.log(`Vite: ${data}`);
  });

  viteProcess.stderr.on('data', (data) => {
    console.error(`Vite Error: ${data}`);
  });

  try {
    console.log('Waiting for server to start...');
    await waitForServer('http://localhost:5175');
    console.log('Server is ready!');

    const browser = await puppeteer.launch({
      executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Set viewport for the fixed production canvas.
    await page.setViewport({
      width: FULL_WIDTH + 64,
      height: FULL_HEIGHT + 64,
      deviceScaleFactor: 1
    });

    console.log('Loading page...');
    await page.goto('http://localhost:5175', { waitUntil: 'networkidle0' });

    // Wait for images to load
    await page.waitForSelector('img').catch(() => console.log('No img tags found, continuing...'));
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Capture the full review master.
    const generatedDir = path.join(__dirname, '..', 'generated', 'iphone');
    const fullImagePath = path.join(generatedDir, 'combined.png');
    await fs.mkdir(generatedDir, { recursive: true });

    const element = await page.$('.artboard');

    if (element) {
      await element.screenshot({
        path: fullImagePath,
        type: 'png'
      });
      console.log(`Full screenshot saved to: ${fullImagePath}`);
    } else {
      await page.screenshot({
        path: fullImagePath,
        type: 'png',
        clip: {
          x: 32,
          y: 32,
          width: FULL_WIDTH,
          height: FULL_HEIGHT
        }
      });
      console.log(`Full screenshot saved to: ${fullImagePath}`);
    }

    await browser.close();

    // Split into 4 images using sharp
    console.log(`Splitting into ${NUM_SPLITS} screenshots...`);

    const screenshotsDir = generatedDir;

    for (let i = 0; i < NUM_SPLITS; i++) {
      const outputFile = path.join(screenshotsDir, `iphone_17_pro_max_0${i + 1}.png`);
      await sharp(fullImagePath)
        .extract({
          left: i * SPLIT_WIDTH,
          top: 0,
          width: SPLIT_WIDTH,
          height: FULL_HEIGHT
        })
        .toFile(outputFile);
      console.log(`Created iphone_17_pro_max_0${i + 1}.png`);
    }

    console.log('Done! Screenshots saved to:', screenshotsDir);

  } finally {
    viteProcess.kill('SIGTERM');
  }
}

capture().catch(console.error);
