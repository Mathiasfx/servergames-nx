module.exports = {
  apps: [
    {
      name: 'nest-api',
      script: './start.sh',
      env: {
        DATABASE_URL:
          'mongodb+srv://servergames:servergames@cluster0.fs7ok5r.mongodb.net/server-games?ssl=true&retryWrites=true&w=majority&tlsAllowInvalidCertificates=true',
        NODE_ENV: 'production',
        PORT: 3007,
        NODE_TLS_REJECT_UNAUTHORIZED: '0',
      },
      env_production: {
        DATABASE_URL:
          'mongodb+srv://servergames:servergames@cluster0.fs7ok5r.mongodb.net/server-games?ssl=true&retryWrites=true&w=majority&tlsAllowInvalidCertificates=true',
        NODE_ENV: 'production',
        PORT: 3007,
        NODE_TLS_REJECT_UNAUTHORIZED: '0',
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      interpreter: '/bin/bash',
    },
  ],
};
