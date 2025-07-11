import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Alert,
  Grid,
} from '@mui/material';
import { format } from 'date-fns';
import axios from 'axios';
import { API_URL } from '../../const';
import { Service, DAY_LABELS } from '../../types/Service';

interface BookServiceProps {
  service: Service;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const BookService: React.FC<BookServiceProps> = ({
  service,
  open,
  onClose,
  onSuccess,
}) => {
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Créer un mapping inverse pour convertir les labels français en clés anglaises
  const FRENCH_TO_ENGLISH_DAYS: Record<string, string> = {
    'Lundi': 'monday',
    'Mardi': 'tuesday',
    'Mercredi': 'wednesday',
    'Jeudi': 'thursday',
    'Vendredi': 'friday',
    'Samedi': 'saturday',
    'Dimanche': 'sunday'
  };

  // Convertir les jours français en clés anglaises
  const availableDaysInEnglish = service.availability.days.map(frenchDay => 
    FRENCH_TO_ENGLISH_DAYS[frenchDay] || frenchDay
  );

  // Réinitialiser les valeurs quand le dialog s'ouvre
  useEffect(() => {
    if (open) {
      setSelectedDay('');
      setSelectedTimeSlot('');
      setError('');
      // Debug
      console.log('Service availability days:', service.availability.days);
      console.log('DAY_LABELS:', DAY_LABELS);
      console.log('Available days in English:', availableDaysInEnglish);
      console.log('Time slots disponibles:', service.availability.time_slots);
    }
  }, [open, service.id]); // Utiliser service.id au lieu de service.availability.days et availableDaysInEnglish

  const handleSubmit = async () => {
    if (!selectedDay || !selectedTimeSlot) {
      setError('Veuillez sélectionner un jour et un créneau horaire');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await axios.post(
        `${API_URL}/bookings`,
        {
          service_id: service.id,
          day: selectedDay,
          time_slot: selectedTimeSlot,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      
      onSuccess();
      onClose();
    } catch (error: any) {
      setError(
        error.response?.data?.message || 
        'Erreur lors de la réservation. Veuillez réessayer.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Réserver le service : {service.title}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Informations du service
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {service.description}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Période disponible :</strong><br />
                Du {format(new Date(service.date_start), 'dd/MM/yyyy')} au {format(new Date(service.date_end), 'dd/MM/yyyy')}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Jours disponibles :</strong>
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {availableDaysInEnglish.map((day) => (
                  <Typography key={day} variant="body2" sx={{ 
                    bgcolor: 'primary.light', 
                    color: 'white', 
                    px: 1, 
                    py: 0.5, 
                    borderRadius: 1,
                    fontSize: '0.75rem'
                  }}>
                    {DAY_LABELS[day as keyof typeof DAY_LABELS]}
                  </Typography>
                ))}
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Choisir un jour
              </Typography>
              <FormControl fullWidth margin="normal">
                <InputLabel>Jour de la semaine</InputLabel>
                <Select
                  value={selectedDay}
                  onChange={(e) => {
                    const selectedValue = e.target.value as string;
                    console.log('Jour sélectionné:', selectedValue);
                    setSelectedDay(selectedValue);
                    setSelectedTimeSlot(''); // Réinitialiser le créneau
                  }}
                  label="Jour de la semaine"
                  displayEmpty={false}
                >
                  {availableDaysInEnglish.map((day) => (
                    <MenuItem key={day} value={day}>
                      {DAY_LABELS[day as keyof typeof DAY_LABELS]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {selectedDay && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Créneaux horaires disponibles
                  </Typography>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Créneau horaire</InputLabel>
                    <Select
                      value={selectedTimeSlot}
                      onChange={(e) => setSelectedTimeSlot(e.target.value)}
                      label="Créneau horaire"
                    >
                      {service.availability.time_slots.map((slot, index) => (
                        <MenuItem key={index} value={`${slot.start}-${slot.end}`}>
                          {slot.start} - {slot.end}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              )}
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Annuler
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={!selectedDay || !selectedTimeSlot || loading}
        >
          {loading ? 'Réservation...' : 'Confirmer la réservation'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BookService;