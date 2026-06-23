import { Page, Locator, expect } from '@playwright/test';

/**
 * Base page helpers for common signup actions and custom UI components.
 */
export class BasePage {
  constructor(protected readonly page: Page) {}

  /**
   * Opens a Radix dropdown and selects the matching option.
   */
  async selectRadixOption(
    triggerLocator: Locator,
    optionText: string | RegExp
  ): Promise<void> {
    await triggerLocator.click();

    const popup = this.page.locator('[data-radix-popper-content-wrapper]');
    await expect(popup).toBeVisible({ timeout: 8000 });

    const option = popup
      .locator('div, span, li')
      .filter({ hasText: optionText })
      .first();

    await expect(option).toBeVisible({ timeout: 5000 });
    await option.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Check all visible checkboxes on the current step.
   */
  async checkAllVisibleCheckboxes(): Promise<number> {
    const checkboxes = this.page.getByRole('checkbox');
    const count = await checkboxes.count();

    for (let i = 0; i < count; i++) {
      const box = checkboxes.nth(i);
      const state = await box.getAttribute('data-state');

      if (state !== 'checked') {
        await box.click();
        await this.page.waitForTimeout(100);
      }
    }

    return count;
  }

  async clickNext(): Promise<void> {
    await this.page.getByRole('button', { name: /next/i }).click();
  }

  async clickSubmit(): Promise<void> {
    await this.page.getByRole('button', { name: /submit/i }).click();
  }
}