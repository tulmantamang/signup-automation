# Signup Automation – Authorized Partner

Automated end-to-end test for the signup flow at https://authorized-partner.vercel.app/

Built with Playwright and TypeScript using a page object model structure.

---

## Project Structure

```
signup_automation/
├── fixtures/
│   └── signupFixtures.ts           custom test fixtures
├── pages/
│   ├── BasePage.ts                 shared helpers (dropdowns, checkboxes, etc.)
│   ├── AccountPage.ts              step 1 – personal details + OTP
│   ├── AgencyDetailsPage.ts        step 2 – agency info
│   ├── ProfessionalExperiencePage.ts   step 3 – experience
│   └── VerificationPreferencesPage.ts  step 4 – verification + file upload
├── tests/
│   ├── signup.spec.ts              main test
│   ├── gmail-otp.ts                reads OTP from Gmail inbox
│   ├── gmail-setup.js              one-time Gmail auth setup
│   └── sample.pdf                  file used in upload step
├── utils/
│   ├── testData.ts                 generates unique email/phone per run
│   └── networkRouting.ts           route mocks for non-critical API calls
├── credentials.json                Google OAuth credentials (not in repo)
├── token.json                      Gmail auth token (not in repo)
├── playwright.config.ts
├── tsconfig.json
└── README.md
```

---

## What gets tested

The script goes through all four steps of the registration form without any manual input:

1. Fill in personal details and submit
2. Receive OTP on Gmail — script fetches it automatically
3. Enter OTP and verify
4. Fill agency details and select country
5. Fill professional experience, select years, check service boxes
6. Fill verification info, select preferred country, check institution types, upload a PDF
7. Submit the form and take a screenshot

---

## Prerequisites

- Node.js v18 or higher
- npm
- A Gmail account to receive the OTP
- Google Cloud OAuth credentials (see setup below)

---

## Installation

```bash
git clone <your-repo-url>
cd signup_automation
npm install
npx playwright install chromium
```

---

## Gmail Setup (run once)

The test reads the OTP from Gmail automatically using the Gmail API. You need to do this setup once before running the test for the first time.

**Step 1 – Create Google Cloud credentials**

- Go to https://console.cloud.google.com
- Create a new project (any name)
- Go to APIs & Services → Library → search Gmail API → Enable it
- Go to APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID
- Choose Desktop App → create → download the JSON
- Rename the downloaded file to `credentials.json` and place it in the project root

**Step 2 – Add yourself as a test user**

- Go to APIs & Services → OAuth consent screen → Audience
- Scroll to Test users → Add Users
- Enter your Gmail address and save

**Step 3 – Authorize**

```bash
node tests/gmail-setup.js
```

It will print a URL. Open it in your browser, log in with your Gmail account, click Allow, copy the code it shows, paste it in the terminal and press Enter. A `token.json` file gets saved automatically.

That's it. You won't need to do this again unless you delete `token.json`.

---

## Running the test

```bash
npx playwright test --headed
```

Runs with the browser visible. The test fills everything automatically including the OTP.

To run without a browser window:

```bash
npx playwright test
```

After the test finishes, a screenshot is saved as `test_report.png` in the project root.

---

## Test data used

| Field | Value |
|---|---|
| First Name | Tulman |
| Last Name | Tamang |
| Email | tulmantamang9@gmail.com |
| Phone | Random 10-digit number per run |
| Password | Reliance@123 |
| Agency Name | Tulman Agency |
| Role | QA Tester |
| Agency Email | tulman@agency.com |
| Agency Website | www.tulmanagency.com |
| Address | 123 Kathmandu Street |
| Country | Nepal |
| Students/year | 10 |
| Focus Area | Engineering |
| Success Metrics | 90 |
| Years Experience | 1-3 years |
| Business Reg No | TU-12345 |
| Certification | ISO 9001 Certified |
| Preferred Country | Australia |
| File Upload | sample.pdf |

Phone is randomly generated each run so there are no duplicate account errors.

---

## Environment

| Item | Version |
|---|---|
| Node.js | v18+ |
| Playwright | 1.40+ |
| TypeScript | 5.x |
| Browser | Chromium |
| OS | Windows 11 |

---


## Notes

- `credentials.json` and `token.json` are not committed to the repo since they contain sensitive keys. You need to generate your own using the Gmail setup steps above.
- After OTP is verified, some API calls are mocked so the remaining steps don't fail due to missing auth tokens. Only the account creation and OTP verification hit the real backend.
- The script checks Gmail every 5 seconds and gives up after 2 minutes if no OTP arrives. In practice it usually comes within 10-20 seconds.
- Occasionally after OTP verification the app shows an error screen. The script handles this on its own and continues to the next step without any manual help.