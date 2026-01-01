module.exports = {
  apps: [{
    name: 'scisocial-api',
    script: 'dist/main.js',
    cwd: '/var/www/scisocial/backend',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,

      // Database (update these values)
      DATABASE_HOST: 'localhost',
      DATABASE_PORT: 5432,
      DATABASE_USER: 'scisocial_prod',
      DATABASE_PASSWORD: 'CHANGE_THIS_SECURE_PASSWORD',
      DATABASE_NAME: 'sci_social_prod',

      // Redis
      REDIS_HOST: 'localhost',
      REDIS_PORT: 6379,

      // CORS
      CORS_ORIGIN: 'https://scisocial.pro,https://www.scisocial.pro,https://admin.scisocial.pro',

      // API Keys (update these)
      CROSSREF_API_EMAIL: 'your-email@example.com',
      ANTHROPIC_API_KEY: 'sk-ant-api03-xxxxxxxxxxxxx',
      ANTHROPIC_MODEL: 'claude-3-5-sonnet-20241022',

      // Email (update these)
      EMAIL_HOST: 'smtp.sendgrid.net',
      EMAIL_PORT: 587,
      EMAIL_SECURE: false,
      EMAIL_USER: 'apikey',
      EMAIL_PASSWORD: 'SG.xxxxxxxxxxxxx',
      EMAIL_FROM: 'noreply@scisocial.pro',
      EMAIL_FROM_NAME: 'SciSocial',

      // Weekly digest
      DIGEST_CRON_SCHEDULE: '0 9 * * 1',

      // File uploads
      MAX_FILE_SIZE: 52428800,
      ALLOWED_IMAGE_TYPES: 'image/jpeg,image/png,image/gif,image/webp',

      // Security
      JWT_SECRET: 'CHANGE_THIS_SUPER_SECRET_JWT_KEY_MIN_64_CHARS_RANDOM_STRING',
      JWT_EXPIRATION: '7d',

      // Rate limiting
      RATE_LIMIT_TTL: 60,
      RATE_LIMIT_MAX: 100,

      // Logging
      LOG_LEVEL: 'info',

      // Application URLs
      FRONTEND_URL: 'https://scisocial.pro',
      ADMIN_URL: 'https://admin.scisocial.pro',
      BACKEND_URL: 'https://api.scisocial.pro'
    },
    error_file: '/var/log/scisocial-api-error.log',
    out_file: '/var/log/scisocial-api-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    max_memory_restart: '1G',
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s'
  }]
}
