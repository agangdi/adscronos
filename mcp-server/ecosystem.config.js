module.exports = {
  apps: [
    {
      name: 'x402-mcp-server',
      script: 'dist/index.js',
      cwd: '/data/adscronos/mcp-server',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/mcp-error.log',
      out_file: './logs/mcp-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    }
  ]
};
