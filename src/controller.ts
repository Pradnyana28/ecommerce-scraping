import Tokopedia from "./tokopedia/Tokopedia";
import Service from "./service";

export default async function controller(browserInstance: Promise<any>) {
  const browser = await browserInstance;

  const tokped = new Tokopedia({
    browser,
    is2faEnabled: true,
    credentials: {
      username: 'kadek.pradnyana@gmail.com'
    },
    tenantName: 'my-tenant'
  });
  const session = new Service(tokped);
  const page = await session.boot();

  if (page) {
    // do whatever you want
    console.log('START HACKING')
    await session.storeDashboard(page);
  }
}