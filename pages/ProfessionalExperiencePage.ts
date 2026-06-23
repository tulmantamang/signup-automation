import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

const DEFAULT_YEARS_LABELS = [
  '1-3 years',
  '1 - 3 years',
  '1-3',
  '1',
  'Less than 3',
  '2 years',
  '0-2 years',
];

export class ProfessionalExperiencePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async fillExperienceMetrics(params: {
    studentsRecruitedAnnually: string;
    focusArea: string;
    successMetrics: string;
  }): Promise<void> {
    await expect(
      this.page.locator("input[name='number_of_students_recruited_annually']")
    ).toBeVisible({ timeout: 15_000 });

    await this.page.fill(
      "input[name='number_of_students_recruited_annually']",
      params.studentsRecruitedAnnually
    );

    await this.page.fill(
      "input[name='focus_area']",
      params.focusArea
    );

    // Number input.
    await this.page.fill(
      "input[name='success_metrics']",
      params.successMetrics
    );
  }

  /**
   * Select a years of experience option.
   */
  async selectYearsOfExperience(
    preferredLabels: string[] = DEFAULT_YEARS_LABELS
  ): Promise<void> {
    const combobox = this.page.locator('button[role="combobox"]').first();
    const popup = this.page.locator('[data-radix-popper-content-wrapper]');

    await combobox.click();
    await expect(popup).toBeVisible({ timeout: 5000 });

    const options = await popup.locator('div, span, li').allTextContents();

    console.log(
      'Years options:',
      options.map((t) => t.trim()).filter(Boolean).slice(0, 10)
    );

    for (const label of preferredLabels) {
      const opt = popup
        .locator('div, span, li')
        .filter({ hasText: new RegExp(`^${label}$`, 'i') })
        .first();

      if (await opt.count() > 0) {
        await opt.click();
        console.log(`Selected years: ${label}`);
        await this.page.waitForTimeout(300);
        return;
      }
    }

    const firstOpt = popup
      .locator('div, span, li')
      .filter({ hasText: /\w/ })
      .first();

    const firstText = await firstOpt.textContent();

    await firstOpt.click();

    console.log(`Selected years: ${firstText?.trim()}`);

    await this.page.waitForTimeout(300);
  }

  // Select all service offered options.

  async selectAllServicesOffered(): Promise<number> {
    const count = await this.checkAllVisibleCheckboxes();
    await this.page.waitForTimeout(500);
    return count;
  }

  async submit(): Promise<void> {
    await this.clickNext();

    await this.page.waitForURL(
      '**/register?step=verification**',
      { timeout: 15_000 }
    );
  }
}