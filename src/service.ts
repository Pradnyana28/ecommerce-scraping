import { Browser, Page, Target } from "puppeteer";
import fs from 'fs';
import path from 'path';
import readline from 'readline';

interface IScraperOptions {
  browser: Browser;
  url: string;
  is2faEnabled?: boolean;
}

interface IScraperWithCredentialsOptions extends IScraperOptions {
  credentials: {
    username: string;
    password: string;
  }
}

export default class Service {
  private browser: Browser;
  private url: string;
  private credentials: IScraperWithCredentialsOptions['credentials'];
  private is2faEnabled: boolean;

  private async takeScreenshot(page: Page, name: string) {
    await page.screenshot({ path: path.resolve(`./screenshots/${this.credentials.username}/${name}.jpg`) });
  }

  private async saveCookies(page: Page) {
    const cookies = await page.cookies();
    fs.writeFile(path.resolve(`./cookies/${this.credentials.username}-cookies.json`), JSON.stringify(cookies, null, 2), () => {
      console.log('Cookies saved!')
    });
  }

  private async ioInput(question: string): Promise<string> {
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

  private async request2faCode(page: Page) {
    await page.waitForSelector('div[data-unify=Card][aria-label=sms]');
    // SMS proofing screen
    this.takeScreenshot(page, '2fa-request');

    await page.click('div[data-unify=Card][aria-label=sms]');
    await page.waitForSelector('input[autocomplete=one-time-code]');

    const tfaCode = await this.ioInput('Please enter the 2fa code => ');
    await page.focus('input[autocomplete=one-time-code]');
    await page.type('input[autocomplete=one-time-code]', tfaCode);

    this.takeScreenshot(page, '2fa-filled');

    await page.waitForNavigation();
    await page.waitForSelector('div[id=my-profile-header]');

    // Save the cookies
    this.saveCookies(page);

    this.takeScreenshot(page, '2fa-finish-logged-in');
  }

  private prepareDirectory() {
    try {
      // prepare directory
      fs.mkdirSync(path.resolve(`./screenshots/${this.credentials.username}`));
    } catch (err: any) {
      // all setted up
    }
  }

  private async checkSession(): Promise<void> {
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

  private async login(page: Page) {
    let signedIn = false;
    // Check after setting cookies if the login button still exist
    try {
      await page.waitForSelector("button[data-testid=btnHeaderLogin]", {
        timeout: 2000
      });
    } catch (err) {
      signedIn = true;
    }

    if (!signedIn) {
      // Click login button at the top right of the page
      await page.click('button[data-testid=btnHeaderLogin]');

      await page.waitForSelector('input[id=email-phone]');
      await page.focus('input[id=email-phone]');
      await page.type('input[id=email-phone]', this.credentials.username);
      await page.click('button[id=email-phone-submit]');
      // Wait for password field sliding down
      await page.waitForSelector("input[id=password-input]");
      await page.focus('input[id=password-input]');
      await page.type('input[id=password-input]', this.credentials.password);

      await page.click('button[data-unify=Button][type=submit]');

      if (this.is2faEnabled) {
        await this.request2faCode(page);
      }
    }
  }

  constructor(options: IScraperWithCredentialsOptions) {
    this.browser = options.browser;
    this.url = options.url;
    this.credentials = options.credentials;
    this.is2faEnabled = options.is2faEnabled ?? false;
  }

  async boot() {
    this.prepareDirectory();

    await this.checkSession();

    let page = await this.browser.newPage();

    try {
      await page.goto(this.url);
      await page.waitForTimeout(1000);

      this.takeScreenshot(page, 'first-access');

      await this.login(page);

      return page;
    } catch (err) {
      console.log('The error', err);
      return undefined;
    }
  }
}

// fs.writeFileSync(path.resolve('./tokped.html'), pageContent);
// console.log('Page writed');
// console.log(pageTitle);

// let urls = await page.$$eval('section ol > li', links => {
//   // Make sure the book to be scraped is in stock
//   links = links.filter(link => link.querySelector('.instock.availability > i').textContent !== "In stock")
//   // Extract the links from the data
//   links = links.map(el => el.querySelector('h3 > a').href)
//   return links;
// });