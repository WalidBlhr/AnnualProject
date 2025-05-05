export type TrocOfferStatus = 'open' | 'pending' | 'closed';

export const STATUS_LABELS: Record<TrocOfferStatus, string> = {
  open: 'Disponible',
  pending: 'En négociation',
  closed: 'Terminé'
};

export const STATUS_COLORS: Record<TrocOfferStatus, 'success' | 'warning' | 'error'> = {
  open: 'success',
  pending: 'warning',
  closed: 'error'
};