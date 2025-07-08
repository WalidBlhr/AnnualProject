import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Alert,
  Chip,
  Grid,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import { format, isAfter, isBefore, startOfDay } from 'date-fns';
import axios from 'axios';
import { API_URL } from '../../const';
import { Service, DAY_LABELS, TimeSlot } from '../../types/Service';

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
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Réinitialiser les valeurs quand le dialog s'ouvre
  useEffect(() => {
    if (open) {
      setSelectedDate(null);
      setSelectedTimeSlot(null);
      setNote('');
      setError('');
    }
  }, [open]);

  // Vérifier si une date est disponible
  const isDateAvailable = (date: Date): boolean => {
    const dayOfWeek = format(date, 'EEEE', { locale: fr }).toLowerCase();
    const dayKey = getDayKey(dayOfWeek);
    
    const startDate = startOfDay(new Date(service.date_start));
    const endDate = startOfDay(new Date(service.date_end));
    const checkDate = startOfDay(date);
    
    return (
      service.availability.days.includes(dayKey) &&
      !isBefore(checkDate, startDate) &&
      !isAfter(checkDate, endDate)
    );
  };

  // Convertir le nom du jour en français vers la clé anglaise
  const getDayKey = (dayName: string): keyof typeof DAY_LABELS => {
    const mapping: { [key: string]: keyof typeof DAY_LABELS } = {
      'lundi': 'monday',
      'mardi': 'tuesday',
      'mercredi': 'wednesday',
      'jeudi': 'thursday',
      'vendredi': 'friday',
      'samedi': 'saturday',
      'dimanche': 'sunday'
    };
    return mapping[dayName] || 'monday';
  };

  const handleDateChange = (date: Date | null) => {
    if (date && isDateAvailable(date)) {
      setSelectedDate(date);
      setSelectedTimeSlot(null); // Réinitialiser le créneau horaire
      setError('');
    } else if (date) {
      setError('Cette date n\'est pas disponible pour ce service');
    }
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTimeSlot) {
      setError('Veuillez sélectionner une date et un créneau horaire');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await axios.post(
        `${API_URL}/services/${service.id}/book`,
        {
          date: format(selectedDate, 'yyyy-MM-dd'),
          timeSlot: selectedTimeSlot,
          note: note.trim() || undefined,
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

  const shouldDisableDate = (date: Date): boolean => {
    return !isDateAvailable(date);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
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
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  {service.availability.days.map(day => (
                    <Chip 
                      key={day} 
                      label={DAY_LABELS[day]} 
                      size="small" 
                      variant="outlined" 
                    />
                  ))}
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Choisir une date
                </Typography>
                <DatePicker
                  label="Date de la prestation"
                  value={selectedDate}
                  onChange={handleDateChange}
                  shouldDisableDate={shouldDisableDate}
                  minDate={new Date(service.date_start)}
                  maxDate={new Date(service.date_end)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      margin: 'normal',
                    },
                  }}
                />

                {selectedDate && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Créneaux horaires disponibles
                    </Typography>
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Créneau horaire</InputLabel>
                      <Select
                        value={selectedTimeSlot ? `${selectedTimeSlot.start}-${selectedTimeSlot.end}` : ''}
                        onChange={(e) => {
                          const [start, end] = e.target.value.split('-');
                          setSelectedTimeSlot({ start, end });
                        }}
                        label="Créneau horaire"
                      >
                        {service.availability.timeSlots.map((slot, index) => (
                          <MenuItem key={index} value={`${slot.start}-${slot.end}`}>
                            {slot.start} - {slot.end}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                )}
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Note pour le prestataire (optionnel)"
                  multiline
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ajoutez des détails ou des instructions spéciales..."
                />
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
            disabled={!selectedDate || !selectedTimeSlot || loading}
          >
            {loading ? 'Réservation...' : 'Confirmer la réservation'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default BookService;