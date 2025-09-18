import express, { Application, Request, Response } from 'express';

import { router as userRoutes } from './routes/user.routes';

const app: Application = express();

app.use('/users', userRoutes);

app.use('/', (req: Request, res: Response): void => {
  res.json({ message: "Miley, what's good?" });
});

export default app;
