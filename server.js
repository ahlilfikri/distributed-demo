const express = require('express');
const os = require('node:os');

const app = express();
const node = process.env.NODE_NAME || 'local';
app.disable('x-powered-by');
app.get('/health', (_req, res) => res.json({ status: 'ok', node }));
app.get('/', (_req, res) => {
  console.log(`${new Date().toISOString()} request handled by ${node}`);
  res.set('Cache-Control', 'no-store').json({
    node,
    hostname: os.hostname(),
    timestamp: new Date().toISOString(),
    message: `Request diproses oleh ${node}`,
  });
});
const server = app.listen(3000, '0.0.0.0', () => console.log(`${node} listening on :3000`));
process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5000).unref();
});
