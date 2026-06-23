import { test } from '../fixtures/signupFixtures';
import { setupBackendPassthrough } from '../utils/networkRouting';

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
    console.log(`Email: ${testData.email}`);
    console.log(`Phone: ${testData.phone}`);
    await setupBackendPassthrough(page);
    
// Terms
    await accountPage.goto();
    await accountPage.acceptTermsAndContinue();

// Step 1: Account details
    await accountPage.fillAccountDetails({
      firstName: 'Tulman',
      lastName: 'Tamang',
      email: testData.email,
      phone: testData.phone,
      password: testData.password,
    });
    const otpSentAt = Date.now();
    await accountPage.submitAccountForm();

// Verify OTP
    await accountPage.expectOtpScreen();
    console.log('OTP screen loaded. Fetching OTP from Gmail...');
    const otp = await fetchOtp(otpSentAt);
    console.log(`OTP: ${otp}`);
    await accountPage.enterOtp(otp);
    await accountPage.submitOtp();
    await accountPage.expectAgencyDetailsStep();
    console.log('Reached details step');

    // Step 2: Agency details
    await agencyDetailsPage.fillAgencyDetails({
      agencyName: 'Tulman Agency',
      roleInAgency: 'QA Tester',
      agencyEmail: 'tulman@agency.com',
      agencyWebsite: 'www.tulmanagency.com',
      agencyAddress: '123 Kathmandu Street',
    });
    await agencyDetailsPage.selectCountry(/^Nepal$/);
    console.log('Selected Nepal');
    await agencyDetailsPage.submit();

    // Step 3: Professional experience
    await professionalExperiencePage.fillExperienceMetrics({
      studentsRecruitedAnnually: '10',
      focusArea: 'Engineering',
      successMetrics: '90',
    });
    await professionalExperiencePage.selectYearsOfExperience();
    const servicesChecked = await professionalExperiencePage.selectAllServicesOffered();
    console.log(`Services selected: ${servicesChecked}`);
    await professionalExperiencePage.submit();
    console.log('Reached verification step');

    // Step 4: Verification & preferences
    await verificationPreferencesPage.fillVerificationDetails({
      businessRegistrationNumber: 'TU-12345',
      certificationDetails: 'ISO 9001 Certified',
    });
    await verificationPreferencesPage.selectPreferredCountry(/^Australia$/i);
    console.log('Selected Australia');
    const institutionsChecked = await verificationPreferencesPage.selectAllInstitutionTypes();
    console.log(`Institution types selected: ${institutionsChecked}`);
    await verificationPreferencesPage.uploadDocument('sample.pdf');
    console.log('Document uploaded');
    await verificationPreferencesPage.submit();
    console.log('Form submitted');

    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test_report.png' });
    console.log('Test completed. Screenshot saved to test_report.png');
  });
});
