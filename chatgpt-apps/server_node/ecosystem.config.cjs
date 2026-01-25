module.exports = {
  apps: [
    {
      name: 'mcp-server',
      script: 'npm',
      args: 'start',
      cwd: '/data/adscronos/chatgpt-apps/server_node',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/mcp-server-error.log',
      out_file: './logs/mcp-server-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    },
    // {
    //   name: 'balance-service',
    //   script: 'tsx',
    //   args: 'src/balance-service.ts',
    //   cwd: '/Users/just/workspace/aibkh/x402-chatgpt-app/chatgpt-apps/server_node',
    //   instances: 1,
    //   autorestart: true,
    //   watch: false,
    //   max_memory_restart: '512M',
    //   env: {
    //     NODE_ENV: 'production'
    //   },
    //   error_file: './logs/balance-service-error.log',
    //   out_file: './logs/balance-service-out.log',
    //   log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    //   merge_logs: true
    // },
    {
      name: 'faucet-service',
      script: 'npm',
      args: 'start:faucet',
      cwd: '/data/adscronos/chatgpt-apps/server_node',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/faucet-service-error.log',
      out_file: './logs/faucet-service-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    },
    // {
    //   name: 'news-service',
    //   script: 'tsx',
    //   args: 'src/news-service.ts',
    //   cwd: '/Users/just/workspace/aibkh/x402-chatgpt-app/chatgpt-apps/server_node',
    //   instances: 1,
    //   autorestart: true,
    //   watch: false,
    //   max_memory_restart: '512M',
    //   env: {
    //     NODE_ENV: 'production'
    //   },
    //   error_file: './logs/news-service-error.log',
    //   out_file: './logs/news-service-out.log',
    //   log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    //   merge_logs: true
    // }
  ]
};
