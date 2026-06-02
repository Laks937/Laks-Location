import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { z } from 'zod';
import { pool } from '../config/db';
import { env } from '../config/env';
import { requireAdminAuth, type AuthenticatedRequest } from '../middlewares/auth';
import { HttpError } from '../utils/httpError';

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

const router = Router();

router.post('/login', async (req, res) => {
  const body = loginSchema.parse(req.body);

  const [rows] = await pool.execute(
    `SELECT id, email, password_hash
     FROM admins
     WHERE email = ?
     LIMIT 1`,
    [body.email],
  );

  const admin = (rows as Array<Record<string, unknown>>)[0];

  if (!admin || typeof admin.password_hash !== 'string') {
    throw new HttpError('Identifiants invalides.', 401);
  }

  const isValid = await bcrypt.compare(body.password, admin.password_hash);

  if (!isValid) {
    throw new HttpError('Identifiants invalides.', 401);
  }

  // Security: JWT signé côté serveur uniquement, aucun secret exposé au client.
  const expiresIn = env.JWT_EXPIRES_IN as Exclude<SignOptions['expiresIn'], undefined>;
  const signOptions: SignOptions = {
    expiresIn,
  };

  const token = jwt.sign(
    {
      adminId: Number(admin.id),
      email: String(admin.email),
    },
    env.JWT_SECRET,
    signOptions,
  );

  return res.json({ token });
});

router.get('/reservations', requireAdminAuth, async (_req: AuthenticatedRequest, res) => {
  const [rows] = await pool.execute(
    `SELECT r.id, r.client_name, r.client_email, r.client_phone, r.start_date, r.end_date,
            r.total_amount_cents, r.deposit_amount_cents, r.payment_status, r.created_at,
            v.brand, v.model, v.category
     FROM reservations r
     INNER JOIN vehicles v ON v.id = r.vehicle_id
     ORDER BY r.created_at DESC`,
  );

  return res.json({ reservations: rows });
});

export const adminRouter = router;
