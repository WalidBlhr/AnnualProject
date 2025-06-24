import React, { useState } from 'react';
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
} from '@mui/material';
import axios from 'axios';
import { API_URL } from '../../const';

interface BookServiceProps {
  serviceId: number;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  availableDays: string[];
  timeSlots: { start: string; end: string }[];
}

const BookService: React.FC<BookServiceProps> = ({
  serviceId,
  open,
  onClose,
  onSuccess,
  availableDays,
  timeSlots,
}) => {
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = async () => {
    try {
      await axios.post(
        `${API_URL}/services/${serviceId}/book`,
        {
          day: selectedDay,
          timeSlot: selectedTimeSlot,
          note,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la réservation:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Réserver ce service</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Jour</InputLabel>
            <Select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              label="Jour"
            >
              {availableDays.map((day) => (
                <MenuItem key={day} value={day}>
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Horaire</InputLabel>
            <Select
              value={selectedTimeSlot}
              onChange={(e) => setSelectedTimeSlot(e.target.value)}
              label="Horaire"
            >
              {timeSlots.map((slot, index) => (
                <MenuItem key={index} value={`${slot.start}-${slot.end}`}>
                  {slot.start} - {slot.end}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Note pour le prestataire"
            multiline
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={!selectedDay || !selectedTimeSlot}
        >
          Réserver
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BookService;