import puppeteer from 'puppeteer';

export default async (): Promise<puppeteer.Browser> => {
  try {
    const browser = await puppeteer.launch({
      headless: false,
      args: ["--disable-setuid-sandbox"],
      'ignoreHTTPSErrors': true
    });
    return browser;
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
}