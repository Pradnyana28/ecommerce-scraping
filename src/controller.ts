import Service from "./service";

export default async function controller(browserInstance: Promise<any>) {
  const browser = await browserInstance;

  const session = new Service({
    browser,
    url: 'https://tokopedia.com',
    is2faEnabled: true,
    credentials: {
      username: 'kadek.pradnyana@gmail.com',
      password: 'PrathnanDesign88!@'
    }
  });
  const page = await session.boot();

  if (page) {
    // do whatever you want
    console.log('START HACKING')
  }
}