// ecosystem.config.cjs
const { cwd } = require("process");

module.exports = {
  apps: [
    {
      name: 'PALMS-TIME',
      script: './node_modules/next/dist/bin/next',
      args: 'start',
      cwd: 'C:/code/PRAGMATIQ_QA/times-ai-web',
      instances: 2,
      exec_mode: 'cluster',
      merge_logs: true,
      autorestart: true,
      env: {
        NODE_ENV: 'production',
        PORT: 3500
      }
    }
  ]
};
