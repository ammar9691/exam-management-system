// config/config.js

import dotenv from 'dotenv';

// Load environment variables from a .env file into process.env
dotenv.config();

export default {
  // General App Configurations
  app: {
    name: process.env.APP_NAME || 'MyApp',
    port: process.env.PORT || 3000,
    environment: process.env.NODE_ENV || 'development',
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret',  // JWT Secret key
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',       // JWT Expiration Time
    refreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d', // Refresh token expiration
  },

  // Password Reset Configuration
  passwordReset: {
    expiresIn: process.env.PASSWORD_RESET_EXPIRY || 10 * 60 * 1000, // Expiry time for password reset token (10 minutes)
  },

  // Security-related Settings
  security: {
    maxLoginAttempts: process.env.MAX_LOGIN_ATTEMPTS || 5,       // Max failed login attempts before locking the account
    lockTime: process.env.LOCK_TIME || 30 * 60 * 1000,           // Lock account for 30 minutes after max attempts
  },

  // Email Configuration (for password reset, verification, etc.)
  email: {
    service: process.env.EMAIL_SERVICE || 'smtp',
    host: process.env.EMAIL_HOST || 'smtp.example.com',
    port: process.env.EMAIL_PORT || 587,
    user: process.env.EMAIL_USER || 'your-email@example.com',
    pass: process.env.EMAIL_PASS || 'your-email-password',
    from: process.env.EMAIL_FROM || 'no-reply@yourdomain.com',  // Sender email address
  },

  // MongoDB Configuration
  db: {
    uri: process.env.DB_URI || 'mongodb://localhost:27017/myapp',  // MongoDB connection URI
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
    },
  },

  // Session Configuration (if session tracking is implemented)
  session: {
    secret: process.env.SESSION_SECRET || 'your_session_secret',  // Session secret
    resave: process.env.SESSION_RESAVE || false,                  // Whether to resave session
    saveUninitialized: process.env.SESSION_SAVE_UNINITIALIZED || true, // Save uninitialized sessions
    cookie: {
      httpOnly: process.env.SESSION_COOKIE_HTTPONLY || true,
      secure: process.env.SESSION_COOKIE_SECURE || false,          // Use secure cookies in production (set to true for HTTPS)
      maxAge: process.env.SESSION_COOKIE_MAX_AGE || 24 * 60 * 60 * 1000, // Session expiry time (24 hours)
    },
  },

  // Cloud Storage (e.g., AWS S3, Cloudinary, etc.)
  cloudStorage: {
    provider: process.env.CLOUD_STORAGE_PROVIDER || 'cloudinary', // e.g., 'aws', 'cloudinary', etc.
    cloudName: process.env.CLOUD_NAME || 'your-cloud-name',
    apiKey: process.env.CLOUD_API_KEY || 'your-api-key',
    apiSecret: process.env.CLOUD_API_SECRET || 'your-api-secret',
  },

  // File Upload Configurations (for profile images, documents, etc.)
  fileUpload: {
    maxSize: process.env.FILE_UPLOAD_MAX_SIZE || 10 * 1024 * 1024, // Max file size (default 10MB)
    allowedTypes: process.env.FILE_UPLOAD_ALLOWED_TYPES || ['image/jpeg', 'image/png', 'application/pdf'], // Allowed file types
  },

  // Logging Configuration
  logger: {
    level: process.env.LOG_LEVEL || 'info',      // Logging level (e.g., info, warn, error)
    format: process.env.LOG_FORMAT || 'combined', // Logging format (e.g., combined, dev)
  },

  // Stripe Configuration (if you're using Stripe for payments)
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || 'your-stripe-secret-key',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'your-stripe-publishable-key',
  },

  // Google OAuth Configuration (for Google login/signup)
  googleOAuth: {
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID || 'your-google-client-id',
    clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || 'your-google-client-secret',
    redirectUri: process.env.GOOGLE_OAUTH_REDIRECT_URI || 'your-google-redirect-uri',
  },

  // Email Verification Settings
  emailVerification: {
    expiresIn: process.env.EMAIL_VERIFICATION_EXPIRY || 24 * 60 * 60 * 1000, // Expiry time for email verification token (24 hours)
  },

  // 2FA Settings (if Two-Factor Authentication is implemented)
  twoFactorAuth: {
    enabled: process.env.TWO_FACTOR_AUTH_ENABLED || false,  // Enable 2FA for your app
    secretKey: process.env.TWO_FACTOR_AUTH_SECRET_KEY || 'your-2fa-secret-key', // Secret key for generating 2FA tokens
    expiresIn: process.env.TWO_FACTOR_AUTH_EXPIRES_IN || 5 * 60 * 1000,  // Expiry time for 2FA tokens (5 minutes)
  },

  // Rate Limiting Configuration (if you want to prevent brute force attacks)
  rateLimiting: {
    maxRequests: process.env.RATE_LIMIT_MAX_REQUESTS || 100,    // Max requests per hour
    windowMs: process.env.RATE_LIMIT_WINDOW_MS || 60 * 60 * 1000, // Time window in milliseconds (default is 1 hour)
  },

  // Feature Toggles (useful for A/B testing or feature rollout)
  featureToggles: {
    enableNewDashboard: process.env.ENABLE_NEW_DASHBOARD || false, // Whether to enable new dashboard
    enablePaymentGateway: process.env.ENABLE_PAYMENT_GATEWAY || true,  // Whether to enable the payment gateway
  },

  // Customizable User Roles (if using different roles for users)
  userRoles: {
    student: 'student',
    teacher: 'teacher',
    admin: 'admin',
  },

  // Environment-Specific Variables (can be used to differentiate between dev, staging, production, etc.)
  environments: {
    development: {
      baseUrl: 'http://localhost:3000',
    },
    staging: {
      baseUrl: 'https://staging.yourdomain.com',
    },
    production: {
      baseUrl: 'https://yourdomain.com',
    },
  },

  // Default Pagination Settings (for APIs that return paginated data)
  pagination: {
    limit: process.env.PAGINATION_LIMIT || 10,  // Default limit of items per page
    maxLimit: process.env.PAGINATION_MAX_LIMIT || 50, // Max allowed items per page
  },

  // Social Media Links
  socialLinks: {
    facebook: process.env.FACEBOOK_URL || 'https://facebook.com/yourprofile',
    twitter: process.env.TWITTER_URL || 'https://twitter.com/yourprofile',
    linkedin: process.env.LINKEDIN_URL || 'https://linkedin.com/yourprofile',
  },

  // Custom API Rate Limit Configuration (optional, for external APIs like Stripe, Google, etc.)
  externalApiRateLimit: {
    maxRequests: process.env.EXTERNAL_API_MAX_REQUESTS || 1000, // Max requests per day
    windowMs: process.env.EXTERNAL_API_WINDOW_MS || 24 * 60 * 60 * 1000, // 24 hours window
  },
};
