import { expect }                      from '@playwright/test';
import { test }                         from '../fixtures/signupFixtures';
import { setupBackendPassthrough }      from '../utils/networkRouting';

test.describe('Authorized Partner — Signup Flow Automation', () => {

  test('should complete signup flow successfully', async ({
    page,
    accountPage,
    agencyDetailsPage,
    professionalExperiencePage,
    verificationPreferencesPage,
    testData,
    fetchOtp,
  }) => {

    // ── Terms ────────────────────────────────────────────────────────────────
    await test.step('Accept terms and continue', async () => {
      await setupBackendPassthrough(page);
      await accountPage.goto();

      // Assert the registration page loaded
      await expect(page).toHaveURL(/register/);
      await expect(page).toHaveTitle(/.+/);

      await accountPage.acceptTermsAndContinue();

      await expect(page.locator('#remember')).toBeChecked();
    });

    // ── Step 1: Account Details ───────────────────────────────────────────────
    await test.step('Fill account details and submit', async () => {
      await accountPage.fillAccountDetails({
        firstName: 'Tulman',
        lastName:  'Tamang',
        email:     testData.email,
        phone:     testData.phone,
        password:  testData.password,
      });

      await expect(page.locator("input[name='firstName']")).toHaveValue('Tulman');
      await expect(page.locator("input[name='lastName']")).toHaveValue('Tamang');
      await expect(page.locator("input[name='email']")).toHaveValue(testData.email);
      await expect(page.locator("input[name='phoneNumber']")).toHaveValue(testData.phone);

      const otpSentAt = Date.now();
      await accountPage.submitAccountForm();

      await accountPage.expectOtpScreen();
      await expect(
        page.locator('h1,h2,h3').filter({ hasText: /verification|otp|verify/i }).first()
      ).toBeVisible();

      // Fetch OTP from Gmail and assert it is a 6-digit code
      const otp = await fetchOtp(otpSentAt);
      expect(otp).toMatch(/^\d{6}$/);

      await accountPage.enterOtp(otp);
      await accountPage.submitOtp();

      // Assert we reached Step 2 after OTP verified
      await accountPage.expectAgencyDetailsStep();
      await expect(page).toHaveURL(/step=details/);
    });

    // ── Step 2: Agency Details ────────────────────────────────────────────────
    await test.step('Fill agency details and select country', async () => {
      await agencyDetailsPage.fillAgencyDetails({
        agencyName:    'Tulman Agency',
        roleInAgency:  'QA Tester',
        agencyEmail:   'tulman@agency.com',
        agencyWebsite: 'www.tulmanagency.com',
        agencyAddress: '123 Kathmandu Street',
      });

      await expect(page.locator("input[name='agency_name']")).toHaveValue('Tulman Agency');
      await expect(page.locator("input[name='role_in_agency']")).toHaveValue('QA Tester');
      await expect(page.locator("input[name='agency_email']")).toHaveValue('tulman@agency.com');
      await expect(page.locator("input[name='agency_website']")).toHaveValue('www.tulmanagency.com');
      await expect(page.locator("input[name='agency_address']")).toHaveValue('123 Kathmandu Street');

      await agencyDetailsPage.selectCountry(/^Nepal$/);

      await expect(page.locator('button[role="combobox"]').first()).toContainText('Nepal');

      await agencyDetailsPage.submit();

      await expect(page).toHaveURL(/step=professional/);
    });

    // ── Step 3: Professional Experience ──────────────────────────────────────
    await test.step('Fill professional experience and select services', async () => {
      await professionalExperiencePage.fillExperienceMetrics({
        studentsRecruitedAnnually: '10',
        focusArea:                 'Engineering',
        successMetrics:            '90',
      });

      await expect(
        page.locator("input[name='number_of_students_recruited_annually']")
      ).toHaveValue('10');
      await expect(page.locator("input[name='focus_area']")).toHaveValue('Engineering');
      await expect(page.locator("input[name='success_metrics']")).toHaveValue('90');

      await professionalExperiencePage.selectYearsOfExperience();

      await expect(
        page.locator('button[role="combobox"]').first()
      ).not.toContainText(/select your/i);

      const servicesChecked = await professionalExperiencePage.selectAllServicesOffered();

      expect(servicesChecked).toBeGreaterThan(0);
      const serviceCheckboxes = page.getByRole('checkbox');
      const cbCount           = await serviceCheckboxes.count();
      for (let i = 0; i < cbCount; i++) {
        await expect(serviceCheckboxes.nth(i)).toHaveAttribute('data-state', 'checked');
      }

      await professionalExperiencePage.submit();

      await expect(page).toHaveURL(/step=verification/);
    });

    // ── Step 4: Verification & Preferences ───────────────────────────────────
    await test.step('Fill verification details and submit', async () => {
      await verificationPreferencesPage.fillVerificationDetails({
        businessRegistrationNumber: 'TU-12345',
        certificationDetails:       'ISO 9001 Certified',
      });

      await expect(
        page.locator("input[name='business_registration_number']")
      ).toHaveValue('TU-12345');
      await expect(
        page.locator("input[name='certification_details']")
      ).toHaveValue('ISO 9001 Certified');

      await verificationPreferencesPage.selectPreferredCountry(/^Australia$/i);

      // Assert the countries combobox is visible and interactive
      await expect(page.locator('button[role="combobox"]').first()).toBeVisible();

      const institutionsChecked = await verificationPreferencesPage.selectAllInstitutionTypes();

      // Assert all institution type checkboxes were checked
      expect(institutionsChecked).toBeGreaterThan(0);
      const institutionCheckboxes = page.getByRole('checkbox');
      const instCount             = await institutionCheckboxes.count();
      for (let i = 0; i < instCount; i++) {
        await expect(institutionCheckboxes.nth(i)).toHaveAttribute('data-state', 'checked');
      }

      await verificationPreferencesPage.uploadDocument('sample.pdf');

      // Assert file input is not empty after upload
      await expect(page.locator("input[type='file']").first()).not.toBeEmpty();

      await verificationPreferencesPage.submit();

      // Assert successful submission — URL or page text confirms completion
      await page.waitForTimeout(2000);
      const currentUrl = page.url();
      const isSuccess  =
        currentUrl.includes('dashboard') ||
        currentUrl.includes('success')   ||
        currentUrl.includes('complete')  ||
        await page.getByText(/success|submitted|complete|thank/i).isVisible().catch(() => false);

      expect(
        isSuccess,
        `Submission did not reach a success state. Current URL: ${currentUrl}`
      ).toBeTruthy();
    });

    // ── Final screenshot ──────────────────────────────────────────────────────
    await page.screenshot({ path: 'test_report.png', fullPage: true });
  });

});