import React from 'react';
import { Box, Typography, Container } from '@mui/material';
import BookingsList from '../../components/BookingsList/BookingsList';

const MyBookings: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box>
        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          Mes réservations
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Retrouvez ici toutes vos demandes de réservation de services
        </Typography>
        <BookingsList userRole="requester" />
      </Box>
    </Container>
  );
};

export default MyBookings;
