module.exports = {
  apps: [
    {
      name: "api",
      script: "src/server.js",
      node_args: "--env-file=.env",
      env: {
        NODE_ENV: "development",
        PORT: 3001,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3001,
      },
    },
    {
      name: "enrich",
      script: "gunicorn",
      args: "-b 127.0.0.1:5000 -w 2 main:app",
      cwd: "./python",
      interpreter: "none",
    },
  ],
};
