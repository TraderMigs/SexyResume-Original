/**
 * Test user fixtures for E2E tests
 * Generates unique test users to avoid database conflicts
 */

export interface TestUser {
  email: string;
  password: string;
  fullName: string;
  timestamp: string;
}

/**
 * Generate a unique test user for each test run
 * Uses timestamp to ensure uniqueness and avoid conflicts
 */
export function generateTestUser(): TestUser {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 8);

  return {
    email: `test-${timestamp}-${randomId}@e2etest.com`,
    password: 'TestPassword123!',
    fullName: `Test User ${timestamp}`,
    timestamp: timestamp.toString(),
  };
}

/**
 * Get a consistent test user for idempotent tests
 * Warning: May cause conflicts if tests run in parallel
 */
export function getStaticTestUser(): TestUser {
  return {
    email: 'e2e-static@test.com',
    password: 'TestPassword123!',
    fullName: 'Static Test User',
    timestamp: '1234567890',
  };
}
