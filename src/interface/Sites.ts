import { Browser, Page, Target } from "puppeteer";
import fs from 'fs';
import path from 'path';
import readline from 'readline';

export interface ISites {
  browser: Browser;
  url: string;
  is2faEnabled?: boolean;
}

export interface IService extends ISites {
  takeScreenshot: (page: Page, name: string) => void;
  saveCookies: (page: Page) => void;
  ioInput: (question: string) => Promise<string>;
  login: (page: Page) => Promise<void>;
  request2faCode: (page: Page) => Promise<void>;
  checkSession: () => Promise<void>;
}

export interface ISitesWithCredentialsOptions extends ISites {
  credentials: {
    username: string;
    password: string;
  }
}

export default abstract class Sites {
  protected credentials: ISitesWithCredentialsOptions['credentials'];
  url: string;
  browser: Browser;
  is2faEnabled: boolean;

  constructor(options: ISitesWithCredentialsOptions) {
    this.browser = options.browser;
    this.credentials = options.credentials;
    this.is2faEnabled = options.is2faEnabled ?? false;
    this.url = options.url;

    this.prepareDirectory();
  }

  abstract login(page: Page): Promise<void>;
  abstract request2faCode(page: Page): Promise<void>;

  async checkSession(): Promise<void> {
    const signedInSession = fs.readFileSync(path.resolve(`./cookies/${this.credentials.username}-cookies.json`));

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
  }

  prepareDirectory() {
    try {
      // prepare directory
      fs.mkdirSync(path.resolve(`./screenshots/${this.credentials.username}`));
    } catch (err: any) {
      // all setted up
    }
  }

  async takeScreenshot(page: Page, name: string) {
    await page.screenshot({ path: path.resolve(`./screenshots/${this.credentials.username}/${name}.jpg`) });
  }

  async saveCookies(page: Page) {
    const cookies = await page.cookies();
    fs.writeFile(path.resolve(`./cookies/${this.credentials.username}-cookies.json`), JSON.stringify(cookies, null, 2), () => {
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
}