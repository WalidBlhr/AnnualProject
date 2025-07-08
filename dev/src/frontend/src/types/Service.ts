export interface TimeSlot {
  start: string; // Format HH:MM
  end: string;   // Format HH:MM
}

export interface ServiceBooking {
  id: number;
  date: string; // Format YYYY-MM-DD
  timeSlot: TimeSlot;
  note?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}

export interface Service {
  id: number;
  title: string;
  description: string;
  type: 'colis' | 'dog_walking' | 'shopping' | 'cleaning' | 'gardening' | 'other';
  status: 'available' | 'booked' | 'completed' | 'paused';
  date_start: string; // Date de début de disponibilité
  date_end: string;   // Date de fin de disponibilité
  recurring: boolean; // Si le service est récurrent
  availability: {
    days: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[];
    timeSlots: TimeSlot[];
  };
  location?: string; // Localisation du service
  price?: number;    // Prix du service (optionnel)
  provider: {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
  };
  requester?: {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
  };
  booking?: ServiceBooking; // Détails de la réservation actuelle
  created_at: string;
  updated_at: string;
}

export const SERVICE_TYPES = {
  colis: 'Récupération de colis',
  dog_walking: 'Sortie de chien',
  shopping: 'Courses',
  cleaning: 'Ménage',
  gardening: 'Jardinage',
  other: 'Autre'
};

export const SERVICE_STATUS = {
  available: 'Disponible',
  booked: 'Réservé',
  completed: 'Terminé',
  paused: 'En pause'
};

export const DAY_LABELS = {
  monday: 'Lundi',
  tuesday: 'Mardi',
  wednesday: 'Mercredi',
  thursday: 'Jeudi',
  friday: 'Vendredi',
  saturday: 'Samedi',
  sunday: 'Dimanche'
};

export const BOOKING_STATUS = {
  pending: 'En attente',
  confirmed: 'Confirmé',
  completed: 'Terminé',
  cancelled: 'Annulé'
};
