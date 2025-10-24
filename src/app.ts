import express, { Application, Request, Response } from 'express';

import { router as incentivesRoutes } from './routes/incentives.route';

const app: Application = express();

app.use('/incentives', incentivesRoutes);

app.use('/', (_req: Request, res: Response): void => {
  res.status(400).send({ error: 'Not Found' });
});

export default app;
