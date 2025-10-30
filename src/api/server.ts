import app from '@/app';
import { createLogger } from '@/config/logger';

const PORT: number = 5050;

const logger = createLogger('Server');

app.listen(PORT, (): void => {
  logger.info(`Server is running on ${PORT}...`);
});
