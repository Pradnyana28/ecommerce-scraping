import Sites, { ISitesWithCredentialsOptions } from "../interface/Sites";
import { Page } from "puppeteer";

interface ITokopedia extends ISitesWithCredentialsOptions { }

export default class Tokopedia extends Sites {
  constructor(options: Omit<ITokopedia, 'url'>) {
    super({
      ...options,
      url: 'https://tokopedia.com'
    } as ISitesWithCredentialsOptions);
  }

  async login(page: Page): Promise<void> {
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

      const userUsername = this.credentials.username ?? await this.ioInput('Please input your username: => ');
      await page.waitForSelector('input[id=email-phone]');
      await page.focus('input[id=email-phone]');
      await page.type('input[id=email-phone]', userUsername);
      await page.click('button[id=email-phone-submit]');
      // Wait for password field sliding down
      const userPassword = await this.ioInput('Please input your password: => ');
      await page.waitForSelector("input[id=password-input]");
      await page.focus('input[id=password-input]');
      await page.type('input[id=password-input]', userPassword);

      await page.click('button[data-unify=Button][type=submit]');

      this.takeScreenshot(page, 'credentials-finisedh');

      if (this.is2faEnabled) {
        await this.request2faCode(page);
      }
    }
  }

  async request2faCode(page: Page): Promise<void> {
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

  async storeHomepage(page: Page) {
    await page.goto('https://seller.tokopedia.com/home');
    await this.takeScreenshot(page, 'store-home');
  }

  async manageProductPage(page: Page) {
    await page.goto('https://seller.tokopedia.com/manage-product');
  }
}