import { apiReference } from '@scalar/express-api-reference';
import cors from 'cors';
import express, { Application, Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import { createLogger } from './config/logger.js';
import { router as incentivesRoutes } from './routes/incentives.route.js';
import { router as pingRoute } from './routes/ping.route.js';

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

// app.use('/openapi', (_req: Request, res: Response): void => {
//   console.log('Serving OpenAPI specification');
//   res.status(200).json(OpenApiSpecification);
// });

app.use(
  '/docs',
  apiReference({
    url: '/openapi.yaml',
    hideModels: true,
    theme: 'deepSpace',
    showToolbar: 'localhost',
  }),
);

app.use('/', (_req: Request, res: Response): void => {
  res.status(400).send({ error: 'Not Found' });
});

app.listen(PORT, (): void => {
  logger.info(`Server is running on ${PORT}...`);
});

export default app;
