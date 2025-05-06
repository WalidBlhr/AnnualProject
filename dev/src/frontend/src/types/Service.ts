export interface Service {
  id: number;
  title: string;
  description: string;
  type: 'colis' | 'dog_walking' | 'shopping' | 'other';
  status: 'available' | 'booked' | 'completed';
  date_start: string;
  date_end: string;
  availability: {
    days: string[];
    time_slots: {
      start: string;
      end: string;
    }[];
  };
  provider: {
    id: number;
    firstname: string;
    lastname: string;
  };
  requester?: {
    id: number;
    firstname: string;
    lastname: string;
  };
}

export const SERVICE_TYPES = {
  colis: 'Récupération de colis',
  dog_walking: 'Sortie de chien',
  shopping: 'Courses',
  other: 'Autre'
};

export const SERVICE_STATUS = {
  available: 'Disponible',
  booked: 'Réservé',
  completed: 'Terminé'
};
