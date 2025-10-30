import cors from 'cors';
import express, { Application, Request, Response } from 'express';

import { createLogger } from '../src/config/logger';
import { router as incentivesRoutes } from '../src/routes/incentives.route';
import { router as pingRoute } from '../src/routes/ping.route';

const PORT: number = 5050;

const logger = createLogger('Server');

const app: Application = express();

app.use(cors());

app.use('/incentives', incentivesRoutes);
app.use('/ping', pingRoute);

app.use('/', (_req: Request, res: Response): void => {
  res.status(400).send({ error: 'Not Found' });
});

app.listen(PORT, (): void => {
  logger.info(`Server is running on ${PORT}...`);
});

export default app;
