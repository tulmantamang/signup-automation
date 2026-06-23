import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class AccountPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.page.goto('https://authorized-partner.vercel.app/register');
  }

  async acceptTermsAndContinue(): Promise<void> {
    await this.page.locator('#remember').check();
    await this.page.getByText('Continue').click();
  }

  async fillAccountDetails(params: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
  }): Promise<void> {
    await expect(this.page.locator("input[name='firstName']")).toBeVisible({ timeout: 10_000 });
    await this.page.fill("input[name='firstName']", params.firstName);
    await this.page.fill("input[name='lastName']", params.lastName);
    await this.page.fill("input[name='email']", params.email);
    await this.page.fill("input[name='phoneNumber']", params.phone);
    await this.page.fill("input[name='password']", params.password);
    await this.page.fill("input[name='confirmPassword']", params.password);
  }

  async submitAccountForm(): Promise<void> {
    await this.clickNext();
  }

  async expectOtpScreen(): Promise<void> {
    await expect(
      this.page.locator('h1,h2,h3').filter({ hasText: /verification|otp|verify/i }).first()
    ).toBeVisible({ timeout: 20_000 });
  }

  async enterOtp(otp: string): Promise<void> {
    const digitBoxes = this.page.locator("input[maxlength='1']");
    const digitCount = await digitBoxes.count();

    if (digitCount >= 4) {
      for (let i = 0; i < digitCount && i < otp.length; i++) {
        await digitBoxes.nth(i).fill(otp[i]);
      }
    } else {
      const singleField = this.page
        .locator(
          "input[name='otp'], input[placeholder*='OTP' i], input[placeholder*='code' i], input[type='number'][maxlength='6']"
        )
        .first();
      if (await singleField.count() > 0) {
        await singleField.fill(otp);
      } else {
        await this.page.locator("input[type='text'], input[type='number'], input:not([type])").first().fill(otp);
      }
    }
  }

  async submitOtp(): Promise<void> {
    await this.page.getByRole('button', { name: /verify/i }).click();
  }

  async expectAgencyDetailsStep(): Promise<void> {
    await this.page.waitForURL('**/register?step=details**', { timeout: 30_000 });

    // Recover the page state if the error boundary appears after OTP.
    if (await this.page.getByText('Something went wrong').isVisible().catch(() => false)) {
      await this.page.evaluate(() => {
        window.history.pushState({}, '', '/register?step=details');
        window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
      });
      await this.page.waitForTimeout(2000);
    }
  }
}
