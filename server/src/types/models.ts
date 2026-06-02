export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'canceled';

export interface Vehicle {
  id: number;
  brand: string;
  model: string;
  category: string;
  pricePerDayCents: number;
  isAvailable: boolean;
  imageUrl: string | null;
}

export interface Reservation {
  id: number;
  vehicleId: number;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  startDate: string;
  endDate: string;
  totalAmountCents: number;
  depositAmountCents: number;
  paymentStatus: PaymentStatus;
  stripePaymentIntentId: string;
  stripeEventLastId: string | null;
  createdAt: string;
}
