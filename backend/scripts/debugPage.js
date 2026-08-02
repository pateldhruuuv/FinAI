const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

// Local Chrome path on Windows
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function run() {
  console.log('Starting chrome headless debugging...');
  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1280, height: 800 });

    // Track console messages
    const logs = [];
    page.on('console', msg => {
      const logLine = `[Console ${msg.type()}] ${msg.text()}`;
      console.log(logLine);
      logs.push(logLine);
    });

    // Track page errors (runtime crashes)
    page.on('pageerror', err => {
      const errLine = `[Page Error] ${err.toString()}\nStack:\n${err.stack}`;
      console.error(errLine);
      logs.push(errLine);
    });

    // Track request failures
    page.on('requestfailed', request => {
      const failLine = `[Request Failed] ${request.url()}: ${request.failure() ? request.failure().errorText : 'failed'}`;
      console.log(failLine);
      logs.push(failLine);
    });

    // Track response errors (HTTP 4xx / 5xx)
    page.on('response', response => {
      if (response.status() >= 400) {
        const httpLine = `[HTTP Error ${response.status()}] ${response.url()}`;
        console.log(httpLine);
        logs.push(httpLine);
      }
    });

    // Go to domain root first to initialize localStorage
    console.log('Initializing local session...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });

    // Seed localstorage
    console.log('Seeding mock premium session...');
    await page.evaluate(() => {
      localStorage.setItem('token', 'mock-valid-jwt-token');
      localStorage.setItem('user', JSON.stringify({
        id: 'mock-user-123',
        name: 'Mock Premium Tester',
        email: 'tester@finpilot.com',
        isPremium: true,
        age: 35
      }));
    });

    // Navigate to the target page
    console.log('Navigating to http://localhost:3000/tax-optimizer...');
    await page.goto('http://localhost:3000/tax-optimizer', {
      waitUntil: 'networkidle2',
      timeout: 10000
    });

    // Wait a couple seconds for state updates
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Take screenshot to verify
    const screenshotPath = path.join(__dirname, 'screenshot.png');
    await page.screenshot({ path: screenshotPath });
    console.log(`Screenshot saved to ${screenshotPath}`);

    // Save logs
    const logPath = path.join(__dirname, 'console_output.txt');
    fs.writeFileSync(logPath, logs.join('\n'));
    console.log(`Logs saved to ${logPath}`);

  } catch (err) {
    console.error('Debug script failed:', err);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

run();
