/**
 * Test environment setup.
 *
 * DATABASE_URL and REDIS_URL are set by CI (GitHub Actions service containers).
 * All other vars use test-safe defaults.
 */

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret-at-least-32-characters-long";
process.env.JWT_ACCESS_TTL = "2h";
process.env.TOKEN_ROTATION_MINUTES = "100";
process.env.SESSION_TTL_DAYS = "60";
process.env.GOOGLE_CLIENT_ID = "test-google-client-id";
process.env.GOOGLE_CLIENT_SECRET = "test-google-client-secret";
process.env.GOOGLE_CALLBACK_URL =
  "http://localhost:3021/v1/auth/google/callback";
process.env.CORS_ORIGIN = "http://localhost:3020";
process.env.API_PORT = "3021";
process.env.PUBLIC_API_URL = "http://localhost:3021";
process.env.WEB_URL = "http://localhost:3020";
process.env.BILLING_ENABLED = "false";
process.env.THROTTLE_DISABLED = "true";
