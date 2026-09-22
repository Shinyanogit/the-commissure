import puppeteer from 'puppeteer'
import { spawn } from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const WIDTH = 2064
const HEIGHT = 2752

async function waitForServer(url, attempts = 30) {
  for (let index = 0; index < attempts; index += 1) {
    try {
      if ((await fetch(url)).ok) return
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
  throw new Error('Vite did not start in time')
}

async function capture() {
  const port = 5187
  const vite = spawn('npm', ['run', 'dev', '--', '--port', String(port)], {
    cwd: __dirname,
    stdio: 'ignore',
    shell: false,
  })
  try {
    await waitForServer(`http://localhost:${port}`)
    const browser = await puppeteer.launch({
      executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    const page = await browser.newPage()
    await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 })
    const output = path.join(__dirname, '..', 'generated', 'ipad')
    await fs.mkdir(output, { recursive: true })
    for (let index = 1; index <= 4; index += 1) {
      await page.goto(`http://localhost:${port}/ipad?screen=${index}`, { waitUntil: 'networkidle0' })
      await page.waitForSelector('img')
      await new Promise((resolve) => setTimeout(resolve, 600))
      const artboard = await page.$('.ipadArtboard')
      await artboard.screenshot({ path: path.join(output, `ipad_13_0${index}.png`), type: 'png' })
    }
    await browser.close()
  } finally {
    vite.kill('SIGTERM')
  }
}

capture().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
