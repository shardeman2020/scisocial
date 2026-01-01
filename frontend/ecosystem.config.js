module.exports = {
  apps: [{
    name: 'scisocial-frontend',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/scisocial/frontend',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      NEXT_PUBLIC_API_URL: 'https://api.scisocial.pro',
      NEXT_PUBLIC_APP_NAME: 'SciSocial',
      NEXT_PUBLIC_ENV: 'production',
      NEXT_PUBLIC_BRANDING_URL: 'https://scisocial.pro',
      NEXT_PUBLIC_ENABLE_SEMANTIC_SEARCH: true,
      NEXT_PUBLIC_ENABLE_HYBRID_SEARCH: true,
      NEXT_PUBLIC_ENABLE_AI_SUMMARIES: true,
      NEXT_PUBLIC_ENABLE_WEEKLY_DIGEST: true
    },
    error_file: '/var/log/scisocial-frontend-error.log',
    out_file: '/var/log/scisocial-frontend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    max_memory_restart: '1G',
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s'
  }]
}
