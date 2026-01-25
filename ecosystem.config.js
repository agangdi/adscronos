module.exports = {
  apps: [
    {
      name: 'adscronos',
      script: 'npm',
      args: 'start',
      cwd: '/data/adscronos/',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/adscronos-error.log',
      out_file: './logs/adscronos-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    }
  ]
};
