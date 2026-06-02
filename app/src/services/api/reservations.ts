import type {
  CreateReservationPayload,
  CreateReservationResponse,
  VehiclesResponse,
} from '../../types/api';
import { apiClient } from './client';

export const fetchVehicles = () => apiClient<VehiclesResponse>('/api/vehicles');

export const createReservation = (payload: CreateReservationPayload) =>
  apiClient<CreateReservationResponse>('/api/reservations', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
