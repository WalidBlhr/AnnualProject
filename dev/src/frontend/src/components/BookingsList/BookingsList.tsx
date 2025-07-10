import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { format } from 'date-fns';
import axios from 'axios';
import { API_URL } from '../../const';
import { Booking, DAY_LABELS, BOOKING_STATUS } from '../../types/Service';

interface BookingsListProps {
  userRole?: 'requester' | 'provider'; // Pour filtrer les réservations
}

const BookingsList: React.FC<BookingsListProps> = ({ userRole = 'requester' }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    booking: Booking | null;
    action: 'accept' | 'cancel';
  }>({ open: false, booking: null, action: 'accept' });

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.get(`${API_URL}/bookings`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setBookings(response.data.data || []);
    } catch (error: any) {
      setError('Erreur lors du chargement des réservations');
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (bookingId: number, action: 'accept' | 'cancel') => {
    setActionLoading(bookingId);
    setError('');

    try {
      await axios.put(
        `${API_URL}/bookings/${bookingId}/${action}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      
      // Rafraîchir la liste
      await fetchBookings();
      setConfirmDialog({ open: false, booking: null, action: 'accept' });
    } catch (error: any) {
      setError(
        error.response?.data?.message || 
        `Erreur lors de l'${action === 'accept' ? 'acceptation' : 'annulation'} de la réservation`
      );
    } finally {
      setActionLoading(null);
    }
  };

  const openConfirmDialog = (booking: Booking, action: 'accept' | 'cancel') => {
    setConfirmDialog({ open: true, booking, action });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'accepted': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const canAccept = (booking: Booking) => {
    return userRole === 'provider' && booking.status === 'pending';
  };

  const canCancel = (booking: Booking) => {
    return booking.status !== 'cancelled';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        {userRole === 'provider' ? 'Réservations reçues' : 'Mes réservations'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {bookings.length === 0 ? (
        <Alert severity="info">
          {userRole === 'provider' 
            ? 'Aucune réservation reçue pour le moment'
            : 'Vous n\'avez aucune réservation pour le moment'
          }
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {bookings.map((booking) => (
            <Grid item xs={12} md={6} lg={4} key={booking.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {booking.service.title}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>
                      {userRole === 'provider' ? 'Demandeur' : 'Prestataire'} :
                    </strong><br />
                    {userRole === 'provider' 
                      ? `${booking.requester.firstname} ${booking.requester.lastname}`
                      : `${booking.service.provider.firstname} ${booking.service.provider.lastname}`
                    }
                  </Typography>

                  <Typography variant="body2" gutterBottom>
                    <strong>Jour :</strong> {DAY_LABELS[booking.day]}
                  </Typography>

                  <Typography variant="body2" gutterBottom>
                    <strong>Créneau :</strong> {booking.time_slot}
                  </Typography>

                  <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                    <Chip 
                      label={BOOKING_STATUS[booking.status]} 
                      color={getStatusColor(booking.status)}
                      size="small"
                    />
                    
                    <Typography variant="caption" color="text.secondary">
                      {format(new Date(booking.created_at), 'dd/MM/yyyy')}
                    </Typography>
                  </Box>

                  <Box mt={2} display="flex" gap={1}>
                    {canAccept(booking) && (
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        onClick={() => openConfirmDialog(booking, 'accept')}
                        disabled={actionLoading === booking.id}
                      >
                        Accepter
                      </Button>
                    )}
                    
                    {canCancel(booking) && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => openConfirmDialog(booking, 'cancel')}
                        disabled={actionLoading === booking.id}
                      >
                        Annuler
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialog de confirmation */}
      <Dialog 
        open={confirmDialog.open} 
        onClose={() => setConfirmDialog({ open: false, booking: null, action: 'accept' })}
      >
        <DialogTitle>
          Confirmer l'{confirmDialog.action === 'accept' ? 'acceptation' : 'annulation'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir {confirmDialog.action === 'accept' ? 'accepter' : 'annuler'} 
            cette réservation pour "{confirmDialog.booking?.service.title}" ?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setConfirmDialog({ open: false, booking: null, action: 'accept' })}
            disabled={actionLoading !== null}
          >
            Annuler
          </Button>
          <Button
            onClick={() => confirmDialog.booking && handleAction(confirmDialog.booking.id, confirmDialog.action)}
            variant="contained"
            color={confirmDialog.action === 'accept' ? 'success' : 'error'}
            disabled={actionLoading !== null}
          >
            {actionLoading !== null ? <CircularProgress size={20} /> : 'Confirmer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BookingsList;
