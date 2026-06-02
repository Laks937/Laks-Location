export interface Vehicle {
  id: number;
  brand: string;
  model: string;
  category: string;
  pricePerDayCents: number;
  isAvailable: boolean;
  imageUrl: string | null;
}

export interface VehiclesResponse {
  vehicles: Vehicle[];
}

export interface CreateReservationPayload {
  vehicleId: number;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  startDate: string;
  endDate: string;
}

export interface CreateReservationResponse {
  reservationId: number;
  paymentIntentId: string;
  paymentIntentClientSecret: string;
  depositAmountCents: number;
}
