import { Browser, Page, Target } from "puppeteer";
import fs from 'fs';
import path from 'path';
import readline from 'readline';

export interface ISites {
  browser: Browser;
  url: string;
  is2faEnabled?: boolean;
  tenantName: string;
}

export interface ISitesObject extends ISites {
  takeScreenshot: (page: Page, name: string) => void;
  saveCookies: (page: Page) => void;
  ioInput: (question: string) => Promise<string>;
  login: (page: Page) => Promise<void>;
  request2faCode: (page: Page) => Promise<void>;
  checkSession: () => Promise<void>;
}

export interface ISitesWithCredentialsOptions extends ISites {
  credentials?: {
    username?: string;
  }
}

export default abstract class Sites {
  protected credentials: ISitesWithCredentialsOptions['credentials'];
  url: string;
  browser: Browser;
  is2faEnabled: boolean;
  tenantName: string;

  private cookiesPath() {
    return `./cookies/${this.url.replace('https://', '')}`;
  }

  private screenshotPath() {
    return `./screenshots/${this.url.replace('https://', '')}`;
  }

  private prepareDirectory() {
    try {
      // cookies
      fs.mkdirSync(path.resolve(this.cookiesPath()));
    } catch (err: any) {
      // all setted up
    }
    try {
      fs.mkdirSync(path.resolve(this.screenshotPath()));
    } catch (err: any) {
      // all setted up
    }
    try {
      fs.mkdirSync(path.resolve(`${this.screenshotPath()}/${this.tenantName}`));
    } catch (err: any) {
      // all setted up
    }
  }

  abstract login(page: Page): Promise<void>;
  abstract request2faCode(page: Page): Promise<void>;

  constructor(options: ISitesWithCredentialsOptions) {
    this.browser = options.browser;
    this.credentials = options.credentials;
    this.is2faEnabled = options.is2faEnabled ?? false;
    this.url = options.url;
    this.tenantName = options.tenantName;

    this.prepareDirectory();
  }

  async checkSession(): Promise<void> {
    try {
      const signedInSession = fs.readFileSync(path.resolve(`${this.cookiesPath()}/${this.tenantName}-cookies.json`));

      // Check if session exist
      if (signedInSession.length) {
        const cookies = JSON.parse(signedInSession.toString());

        // Set the cookies
        this.browser.on('targetchanged', async (target: Target) => {
          const targetPage = await target.page();
          if (targetPage) {
            await targetPage.setCookie(...cookies);
            // const client = await targetPage.target().createCDPSession();
            // await client?.send('Runtime.evaluate', {
            //   expression: `localStorage.setItem('hello', 'world')`,
            // });
          }
        });
      }
    } catch (err) {
      console.log('No session')
    }
  }

  async takeScreenshot(page: Page, name: string) {
    await page.screenshot({ path: path.resolve(`${this.screenshotPath()}/${this.tenantName}/${name}.jpg`) });
  }

  async saveCookies(page: Page) {
    const cookies = await page.cookies();
    fs.writeFile(path.resolve(`${this.cookiesPath()}/${this.tenantName}-cookies.json`), JSON.stringify(cookies, null, 2), () => {
      console.log('Cookies saved!')
    });
  }

  async ioInput(question: string): Promise<string> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((res) => {
      rl.question(question, async (input) => {
        res(input);
      });
    });
  }

  async type(page: Page, element: string, text: string) {
    await page.waitForSelector(element);
    await page.focus(element);
    await page.type(element, text);
  }
}