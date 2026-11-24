// Entry point: build the container, create the app, start listening.
// Keep this file thin — all wiring lives in container.ts, app logic in app.ts.

import { container } from './container.js';
import { createApp } from './http/app.js';
import { config } from './config.js';

const app = createApp({
  productService: container.productService,
  enquiryService: container.enquiryService,
  config: {
    corsOrigins: config.CORS_ORIGINS,
    nodeEnv: config.NODE_ENV,
  },
});

app.listen(config.PORT, '0.0.0.0', () => {
  console.info(`[server] Listening on http://localhost:${config.PORT}`);
  console.info(`[server] Health: http://localhost:${config.PORT}/health`);
  console.info(`[server] API:    http://localhost:${config.PORT}/api/v1`);
});
