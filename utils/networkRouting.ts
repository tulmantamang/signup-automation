import { Page } from '@playwright/test';

/**
 * Setup API routes used in the signup test.
 */
export async function setupBackendPassthrough(
  page: Page,
  backendOrigin = 'https://stage.cloudedu.com.au'
): Promise<void> {
  await page.route(`${backendOrigin}/**`, async (route) => {
    const method = route.request().method();
    const url = route.request().url();

    if (method !== 'GET') {
      console.log(`PASS [${method}]: ${url}`);
      await route.continue();
      return;
    }

    const isLookupEndpoint =
      url.includes('/api/country') ||
      url.includes('/api/region') ||
      url.includes('/api/institution') ||
      url.includes('/api/service') ||
      url.includes('/api/validate-mobile');

    if (isLookupEndpoint) {
      console.log(`PASS [GET]: ${url}`);
      await route.continue();
      return;
    }

    console.log(`MOCK [GET]: ${url}`);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ detail: 'success', data: {}, results: [] }),
    });
  });
}
