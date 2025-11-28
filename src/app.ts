import { apiReference } from '@scalar/express-api-reference';
import cors from 'cors';
import express, { Application, Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import { createLogger } from './config/logger.js';
import { router as incentivesRoutes } from './routes/incentives.route.js';
import { router as pingRoute } from './routes/ping.route.js';
import { createStatusRoute } from './routes/status.route.js';
import { ApiErrorResponse } from './types/index.js';

const PORT: number = 5050;

const logger = createLogger('Server');

const app: Application = express();

app.use(cors());

// Serve static files from the 'public' directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.resolve(__dirname, '../public')));

// Not mandatory (cause index.html is served by default), but explicit route for clarity or if needed later
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use('/incentives', incentivesRoutes);
app.use('/ping', pingRoute);

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

app.use('/status', createStatusRoute());

const apiErrorResponse: ApiErrorResponse = {
  success: false,
  error: {
    message: 'Not Found',
    code: 'NOT_FOUND',
  },
};

app.use('/', (_req: Request, res: Response): void => {
  res.status(404).send(apiErrorResponse);
});

app.listen(PORT, (): void => {
  logger.info(`Server is running on ${PORT}...`);
});

export default app;
