import { Page, expect } from '@playwright/test';
import * as path from 'path';
import { BasePage } from './BasePage';

export class VerificationPreferencesPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async fillVerificationDetails(params: {
    businessRegistrationNumber: string;
    certificationDetails: string;
  }): Promise<void> {
    await expect(
      this.page.locator("input[name='business_registration_number']")
    ).toBeVisible({ timeout: 15_000 });
    await this.page.fill(
      "input[name='business_registration_number']",
      params.businessRegistrationNumber
    );
    await this.page.fill("input[name='certification_details']", params.certificationDetails);
  }

  async selectPreferredCountry(country: string | RegExp): Promise<void> {
    const combobox = this.page.locator('button[role="combobox"]').first();
    await combobox.click();
    await this.page.waitForTimeout(800);

    const popup = this.page.locator('[data-radix-popper-content-wrapper]');
    if (await popup.isVisible()) {
      const option = popup.locator('div, span, li').filter({ hasText: country }).first();
      if (await option.count() > 0) {
        await option.click();
      } else {
        await popup.locator('div, span, li').filter({ hasText: /\w/ }).first().click();
      }
    }
    await this.page.waitForTimeout(300);
  }

  // Select institution types.
  async selectAllInstitutionTypes(): Promise<number> {
    const count = await this.checkAllVisibleCheckboxes();
    await this.page.waitForTimeout(300);
    return count;
  }

  async uploadDocument(fileName = 'sample.pdf'): Promise<void> {
    const filePath = path.resolve(__dirname, '..', 'tests', fileName);
    await this.page.locator("input[type='file']").first().setInputFiles(filePath);
    await this.page.waitForTimeout(500);
  }

  async submit(): Promise<void> {
    await this.clickSubmit();
  }
}
