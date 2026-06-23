export interface SignupTestData {
  timestamp: number;
  email: string;
  phone: string;
  password: string;
}

/**
 * Generates unique test data for each signup run.
 */
export function generateSignupTestData(): SignupTestData {
  const timestamp = Date.now();
  const email = `tulmantamang9+${timestamp}@gmail.com`;
  const phone = `98${String(timestamp).slice(-8)}`;
  const password = 'Reliance@123';

  return { timestamp, email, phone, password };
}
