import { Page } from "puppeteer";
import { ISitesObject } from "./interface/Sites";

interface IService extends ISitesObject {
  storeHomepage: (page: Page) => Promise<void>;
  manageProductPage: (page: Page) => Promise<void>;
}

export default class Service {
  private classInjector: IService;

  constructor(classInjector: IService) {
    this.classInjector = classInjector;
  }

  public async boot() {
    const CI = this.classInjector;
    await CI.checkSession();

    let page = await CI.browser.newPage();

    try {
      await page.goto(CI.url);
      await page.waitForTimeout(1000);
      await CI.login(page);
      return page;
    } catch (err) {
      console.log('The error', err);
      return undefined;
    }
  }

  public async storeDashboard(page: Page) {
    this.classInjector.storeHomepage(page);
  }

  public async allProducts() { }
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