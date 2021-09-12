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

  get elementIDs() {
    return {
      fields: {
        username: 'input[id=email-phone]',
        password: 'input[id=password-input]',
        '2faCode': 'input[autocomplete=one-time-code]'
      },
      buttons: {
        usernameSubmit: 'button[id=email-phone-submit]',
        loginSubmit: 'button[data-unify=Button][type=submit]',
        loginAction: 'button[data-testid=btnHeaderLogin]',
        request2faAction: 'div[data-unify=Card][aria-label=sms]'
      },
      section: {
        profileHeader: 'div[id=my-profile-header]'
      }
    }
  }

  async login(page: Page): Promise<void> {
    let signedIn = false;
    // Check after setting cookies if the login button still exist
    try {
      await page.waitForSelector(this.elementIDs.buttons.loginAction, {
        timeout: 2000
      });
    } catch (err) {
      signedIn = true;
    }

    if (!signedIn) {
      // Click login action button at the top right of the page
      await page.click(this.elementIDs.buttons.loginAction);

      const userUsername = this.credentials?.username ?? await this.ioInput('Please input your username: => ');
      const userPassword = await this.ioInput('Please input your password: => ');

      await this.type(page, this.elementIDs.fields.username, userUsername);
      await page.click(this.elementIDs.buttons.usernameSubmit);
      await this.type(page, this.elementIDs.fields.password, userPassword);
      await page.click(this.elementIDs.buttons.loginSubmit);

      this.takeScreenshot(page, 'credentials-finisedh');

      if (this.is2faEnabled) {
        await this.request2faCode(page);
      }
    }
  }

  async request2faCode(page: Page): Promise<void> {
    await page.waitForSelector(this.elementIDs.buttons.request2faAction);
    // SMS proofing screen
    this.takeScreenshot(page, '2fa-request');

    await page.click(this.elementIDs.buttons.request2faAction);
    const tfaCode = await this.ioInput('Please enter the 2fa code => ');
    await this.type(page, this.elementIDs.fields['2faCode'], tfaCode);

    await page.waitForNavigation();
    await page.waitForSelector(this.elementIDs.section.profileHeader);

    // Save the cookies
    this.saveCookies(page);
  }

  async storeHomepage(page: Page) {
    await page.goto('https://seller.tokopedia.com/home');
    await this.takeScreenshot(page, 'store-home');
  }

  async manageProductPage(page: Page) {
    await page.goto('https://seller.tokopedia.com/manage-product');
  }
}