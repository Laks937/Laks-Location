import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../config/db';
import { env } from '../config/env';
import { stripe } from '../config/stripe';
import { countRentalDays } from '../utils/calc';
import { HttpError } from '../utils/httpError';

const reservationSchema = z
  .object({
    vehicleId: z.coerce.number().int().positive(),
    clientName: z.string().min(2).max(120),
    clientEmail: z.email(),
    clientPhone: z.string().min(8).max(30),
    startDate: z.iso.date(),
    endDate: z.iso.date(),
  })
  .strict();

const router = Router();

router.post('/', async (req, res) => {
  const body = reservationSchema.parse(req.body);

  const [vehicleRows] = await pool.execute(
    `SELECT id, price_per_day_cents, is_available
     FROM vehicles
     WHERE id = ?
     LIMIT 1`,
    [body.vehicleId],
  );

  const vehicle = (vehicleRows as Array<Record<string, unknown>>)[0];

  if (!vehicle || Number(vehicle.is_available) !== 1) {
    throw new HttpError('Véhicule indisponible.', 400);
  }

  const rentalDays = countRentalDays(new Date(body.startDate), new Date(body.endDate));
  const totalAmountCents = rentalDays * Number(vehicle.price_per_day_cents);
  const depositAmountCents = Math.round((totalAmountCents * env.DEPOSIT_PERCENT) / 100);

  if (depositAmountCents <= 0) {
    throw new HttpError('Montant d\'acompte invalide.', 400);
  }

  // Stripe: seul le client_secret du PaymentIntent est renvoyé au mobile, jamais de donnée carte.
  const paymentIntent = await stripe.paymentIntents.create({
    amount: depositAmountCents,
    currency: 'eur',
    automatic_payment_methods: { enabled: true },
    metadata: {
      vehicle_id: String(body.vehicleId),
      client_email: body.clientEmail,
    },
  });

  const [insertResult] = await pool.execute(
    `INSERT INTO reservations (
       vehicle_id,
       client_name,
       client_email,
       client_phone,
       start_date,
       end_date,
       total_amount_cents,
       deposit_amount_cents,
       payment_status,
       stripe_payment_intent_id,
       stripe_event_last_id
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
    [
      body.vehicleId,
      body.clientName,
      body.clientEmail,
      body.clientPhone,
      body.startDate,
      body.endDate,
      totalAmountCents,
      depositAmountCents,
      'pending',
      paymentIntent.id,
    ],
  );

  if (!paymentIntent.client_secret) {
    throw new HttpError('Échec de création du paiement.', 500);
  }

  const result = insertResult as { insertId: number };

  return res.status(201).json({
    reservationId: result.insertId,
    paymentIntentId: paymentIntent.id,
    paymentIntentClientSecret: paymentIntent.client_secret,
    depositAmountCents,
  });
});

export const reservationsRouter = router;
