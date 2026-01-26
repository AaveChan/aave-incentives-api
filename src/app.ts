import 'dotenv/config';

import { apiReference } from '@scalar/express-api-reference';
import cors from 'cors';
import express, { Application, Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import { createLogger } from './config/logger.js';
import { requestMonitor } from './middlewares/request-monitor.middleware.js';
import { router as aciAddressesRoute } from './routes/aci-addresses.route.js';
import { router as providersStatusRoute } from './routes/health.route.js';
import { router as incentivesRoutes } from './routes/incentives.route.js';
import { router as pingRoute } from './routes/ping.route.js';
import { createStatusRoute } from './routes/status.route.js';
import { router as wrapperTokensRoute } from './routes/wrapper-tokens.js';
import { ApiErrorResponse } from './types/index.js';

// -----------------------------------------------------------------------------
// Config
// -----------------------------------------------------------------------------

const PORT = process.env.PORT || 8000;

const logger = createLogger('Server');
const app: Application = express();

// -----------------------------------------------------------------------------
// Middleware
// -----------------------------------------------------------------------------

app.use(cors());
app.use(requestMonitor);

// Static files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.resolve(__dirname, '../public')));

// Explicit root route (index.html is already served by default)
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// -----------------------------------------------------------------------------
// API Routes
// -----------------------------------------------------------------------------

app.use('/ping', pingRoute);
app.use('/incentives', incentivesRoutes);
app.use('/aci-addresses', aciAddressesRoute);
app.use('/health', providersStatusRoute);

// Wrapper tokens
app.use('/wrapper-tokens', wrapperTokensRoute);

// -----------------------------------------------------------------------------
// Pages
// -----------------------------------------------------------------------------

// API Docs
app.use(
  '/docs',
  apiReference({
    url: '/openapi.yaml',
    hideModels: true,
    theme: 'deepSpace',
    showToolbar: 'localhost',
    metaData: {
      title: 'API Docs',
    },
  }),
);

// Status page
app.use('/status', createStatusRoute());

// -----------------------------------------------------------------------------
// Fallback / Errors
// -----------------------------------------------------------------------------

const apiErrorResponse: ApiErrorResponse = {
  success: false,
  error: {
    message: 'Not Found',
    code: 'NOT_FOUND',
  },
};

app.use((_req: Request, res: Response): void => {
  res.status(404).json(apiErrorResponse);
});

// -----------------------------------------------------------------------------
// Bootstrap
// -----------------------------------------------------------------------------

app.listen(PORT, () => {
  logger.info(`Server is running on ${PORT}...`);
});

export default app;
