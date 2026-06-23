import { test as base } from '@playwright/test';
import * as path from 'path';
import { AccountPage } from '../pages/AccountPage';
import { AgencyDetailsPage } from '../pages/AgencyDetailsPage';
import { ProfessionalExperiencePage } from '../pages/ProfessionalExperiencePage';
import { VerificationPreferencesPage } from '../pages/VerificationPreferencesPage';
import { getOtpFromGmail } from '../tests/gmail-otp';
import { generateSignupTestData, SignupTestData } from '../utils/testData';

const CREDENTIALS_PATH = path.resolve(__dirname, '../credentials.json');
const TOKEN_PATH = path.resolve(__dirname, '../token.json');

type SignupFixtures = {
  accountPage: AccountPage;
  agencyDetailsPage: AgencyDetailsPage;
  professionalExperiencePage: ProfessionalExperiencePage;
  verificationPreferencesPage: VerificationPreferencesPage;
  testData: SignupTestData;
  fetchOtp: (afterTimestamp: number) => Promise<string>;
};

export const test = base.extend<SignupFixtures>({
  accountPage: async ({ page }, use) => {
    await use(new AccountPage(page));
  },

  agencyDetailsPage: async ({ page }, use) => {
    await use(new AgencyDetailsPage(page));
  },

  professionalExperiencePage: async ({ page }, use) => {
    await use(new ProfessionalExperiencePage(page));
  },

  verificationPreferencesPage: async ({ page }, use) => {
    await use(new VerificationPreferencesPage(page));
  },

  // Generate fresh test data for each run.
  testData: async ({}, use) => {
    await use(generateSignupTestData());
  },

  // Fetch OTP using the Gmail helper.
  fetchOtp: async ({}, use) => {
    await use((afterTimestamp: number) => getOtpFromGmail(CREDENTIALS_PATH, TOKEN_PATH, afterTimestamp));
  },
});

export { expect } from '@playwright/test';
