import puppeteer, { Browser, Page } from 'puppeteer';
import { logger } from '../utils/logger';
import { randomDelay } from '../utils/delay';

/**
 * Browser service for handling JS-rendered websites with Puppeteer
 */
class BrowserService {
  private browser: Browser | null = null;
  private userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
  ];

  /**
   * Initialize browser instance
   */
  async initialize(): Promise<void> {
    try {
      if (this.browser) return;

      logger.debug('Initializing Puppeteer browser...');
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--single-process',
        ],
      });

      logger.info('✓ Browser initialized');
    } catch (error) {
      logger.error('Failed to initialize browser', error);
      throw error;
    }
  }

  /**
   * Get a random user agent
   */
  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  /**
   * Fetch HTML from URL using browser (handles JS rendering)
   */
  async fetchPageHtml(url: string, retries: number = 3): Promise<string> {
    if (!this.browser) {
      await this.initialize();
    }

    let page: Page | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        logger.debug(`Fetching ${url} with browser (attempt ${attempt}/${retries})`);
        
        page = await this.browser!.newPage();
        
        // Set user agent
        await page.setUserAgent(this.getRandomUserAgent());
        
        // Set viewport and other headers
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setExtraHTTPHeaders({
          'Accept-Language': 'en-US,en;q=0.9',
        });

        // Navigate with timeout
        await page.goto(url, {
          waitUntil: 'networkidle2',
          timeout: 30000,
        });

        // Wait a bit for dynamic content
        await randomDelay(500, 1500);

        const html = await page.content();
        await page.close();

        logger.debug(`Successfully fetched ${url} with browser`);
        return html;

      } catch (error: any) {
        if (page) {
          try {
            await page.close();
          } catch (closeError) {
            logger.debug('Error closing page');
          }
        }

        if (attempt === retries) {
          const errorMessage = error?.message || 'Unknown error';
          logger.error(
            `Failed to fetch ${url} with browser after ${retries} attempts`,
            errorMessage
          );
          throw error;
        }

        // Wait before retry
        await randomDelay(2000, 5000);
      }
    }

    throw new Error(`Failed to fetch ${url} with browser`);
  }

  /**
   * Execute JavaScript in page context
   */
  async executeScript<T>(url: string, scriptFn: () => T): Promise<T> {
    if (!this.browser) {
      await this.initialize();
    }

    const page = await this.browser!.newPage();

    try {
      await page.setUserAgent(this.getRandomUserAgent());
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      await randomDelay(500, 1500);

      const result = await page.evaluate(() => {
        return (scriptFn as any)();
      });
      return result as T;

    } finally {
      await page.close();
    }
  }

  /**
   * Close browser
   */
  async close(): Promise<void> {
    if (this.browser) {
      try {
        await this.browser.close();
        this.browser = null;
        logger.info('✓ Browser closed');
      } catch (error) {
        logger.error('Error closing browser', error);
      }
    }
  }

  /**
   * Check if browser is running
   */
  isRunning(): boolean {
    return this.browser !== null;
  }
}

export const browserService = new BrowserService();
