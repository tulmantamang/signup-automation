import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class AgencyDetailsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async fillAgencyDetails(params: {
    agencyName: string;
    roleInAgency: string;
    agencyEmail: string;
    agencyWebsite: string;
    agencyAddress: string;
  }): Promise<void> {
    await expect(this.page.locator("input[name='agency_name']")).toBeVisible({ timeout: 15_000 });
    await this.page.fill("input[name='agency_name']", params.agencyName);
    await this.page.fill("input[name='role_in_agency']", params.roleInAgency);
    await this.page.fill("input[name='agency_email']", params.agencyEmail);
    await this.page.fill("input[name='agency_website']", params.agencyWebsite);
    await this.page.fill("input[name='agency_address']", params.agencyAddress);
  }

  async selectCountry(country: string | RegExp): Promise<void> {
    await this.selectRadixOption(this.page.locator('button[role="combobox"]').first(), country);
  }

  async submit(): Promise<void> {
    await this.clickNext();
  }
}
