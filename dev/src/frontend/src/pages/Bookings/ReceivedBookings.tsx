import React from 'react';
import { Box, Typography, Container } from '@mui/material';
import BookingsList from '../../components/BookingsList/BookingsList';

const ReceivedBookings: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box>
        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          Réservations reçues
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Gérez les demandes de réservation pour vos services
        </Typography>
        <BookingsList userRole="provider" />
      </Box>
    </Container>
  );
};

export default ReceivedBookings;
