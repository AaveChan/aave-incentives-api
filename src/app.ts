import cors from 'cors';
import express, { Application, Request, Response } from 'express';

import { router as incentivesRoutes } from './routes/incentives.route';
import { router as pingRoute } from './routes/ping.route';

const app: Application = express();

app.use(cors());

app.use('/incentives', incentivesRoutes);
app.use('/ping', pingRoute);

app.use('/', (_req: Request, res: Response): void => {
  res.status(400).send({ error: 'Not Found' });
});

export default app;
