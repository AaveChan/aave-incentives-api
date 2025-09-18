import { Request, Response, Router } from 'express';

const router = Router();

router.get('/', (req: Request, res: Response): void => {
  const users = ['Nicki', 'Ariana', 'Lana', 'Miley'];
  res.status(200).send(users);
});

export { router };
