// Centralized Configuration for 3-Tier Architecture
const CONFIG = {
  // Tier 1: Authentication Backend
  AUTH_API_BASE: 'http://localhost:5001/api/auth',
  AUTH_HEALTH_URL: 'http://localhost:5001/health',

  // Tier 2: Core Application Backend
  CORE_API_BASE: 'http://localhost:5002/api/core',
  CORE_HEALTH_URL: 'http://localhost:5002/health',

  // Local Storage Keys
  STORAGE_TOKEN_KEY: 'tier3_auth_token',
  STORAGE_USER_KEY: 'tier3_user_data'
};
