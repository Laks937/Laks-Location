import { HttpError } from './httpError';

const MS_IN_DAY = 1000 * 60 * 60 * 24;

export const countRentalDays = (startDate: Date, endDate: Date): number => {
  const diff = endDate.getTime() - startDate.getTime();
  const days = Math.ceil(diff / MS_IN_DAY);

  if (days <= 0) {
    throw new HttpError('La date de fin doit être après la date de début.', 400);
  }

  return days;
};
