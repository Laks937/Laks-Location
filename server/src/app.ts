import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env';
import { adminRouter } from './routes/admin';
import { reservationsRouter } from './routes/reservations';
import { vehiclesRouter } from './routes/vehicles';
import { webhooksRouter } from './routes/webhooks';
import { errorHandler } from './middlewares/errorHandler';

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhooksRouter);

  app.use(express.json());

  app.use('/api/vehicles', vehiclesRouter);
  app.use('/api/reservations', reservationsRouter);
  app.use('/api/admin', adminRouter);

  app.use(errorHandler);

  return app;
};
