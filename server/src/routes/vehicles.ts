import { Router } from 'express';
import { pool } from '../config/db';
import type { Vehicle } from '../types/models';

const router = Router();

router.get('/', async (_req, res) => {
  const [rows] = await pool.execute(
    `SELECT id, brand, model, category, price_per_day_cents, is_available, image_url
     FROM vehicles
     WHERE is_available = ?
     ORDER BY price_per_day_cents ASC`,
    [1],
  );

  const vehicles = (rows as Array<Record<string, unknown>>).map((row): Vehicle => ({
    id: Number(row.id),
    brand: String(row.brand),
    model: String(row.model),
    category: String(row.category),
    pricePerDayCents: Number(row.price_per_day_cents),
    isAvailable: Boolean(row.is_available),
    imageUrl: row.image_url === null ? null : String(row.image_url),
  }));

  return res.json({ vehicles });
});

export const vehiclesRouter = router;
