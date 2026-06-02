import { Router } from 'express';
import { pool } from '../config/db';
import { env } from '../config/env';
import { stripe } from '../config/stripe';
import { HttpError } from '../utils/httpError';

const router = Router();

router.post('/stripe', async (req, res) => {
  const signature = req.headers['stripe-signature'];

  if (typeof signature !== 'string') {
    throw new HttpError('Stripe signature manquante.', 400);
  }

  let event: ReturnType<typeof stripe.webhooks.constructEvent>;

  try {
    // Security: webhook signé par Stripe. On vérifie la signature avec le raw body.
    event = stripe.webhooks.constructEvent(
      req.body as Buffer,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    throw new HttpError('Signature Stripe invalide.', 400);
  }

  const supportedStatuses: Record<string, 'paid' | 'failed' | 'canceled'> = {
    'payment_intent.succeeded': 'paid',
    'payment_intent.payment_failed': 'failed',
    'payment_intent.canceled': 'canceled',
  };

  const nextStatus = supportedStatuses[event.type];

  if (nextStatus) {
    const paymentIntent = event.data.object as { id?: string };

    if (typeof paymentIntent.id !== 'string') {
      return res.status(200).json({ received: true });
    }

    // Idempotence: on ignore les événements Stripe déjà traités via stripe_event_last_id.
    await pool.execute(
      `UPDATE reservations
       SET payment_status = ?, stripe_event_last_id = ?, updated_at = CURRENT_TIMESTAMP
       WHERE stripe_payment_intent_id = ?
         AND (stripe_event_last_id IS NULL OR stripe_event_last_id <> ?)`,
      [nextStatus, event.id, paymentIntent.id, event.id],
    );
  }

  return res.status(200).json({ received: true });
});

export const webhooksRouter = router;
