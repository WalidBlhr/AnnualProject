import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
  Grid,
  Chip,
  Divider,
  Box,
  Alert,
  Snackbar,
  Select,
  MenuItem,
} from '@mui/material';
import axios from 'axios';
import jwtDecode from 'jwt-decode';
import { Service, SERVICE_TYPES, SERVICE_STATUS } from '../../types/Service';
import BookService from '../../components/BookService/BookService';
import { API_URL } from '../../const';

const ServiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [service, setService] = useState<Service | null>(null);
  const [alert, setAlert] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);

  useEffect(() => {
    // Vérification stricte de l'id
    if (!id || isNaN(parseInt(id))) {
      navigate('/services');
      return;
    }
    fetchServiceDetails();
  }, [id, navigate]);

  const fetchServiceDetails = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/services/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!data) {
        throw new Error('Service not found');
      }
      setService(data);
    } catch (error) {
      showAlert('Erreur lors du chargement du service', 'error');
      navigate('/services');
    }
  };

  const isProvider = () => {
    const token = localStorage.getItem('token');
    if (!token || !service?.provider) return false;
    const decoded = jwtDecode<{ userId: number }>(token);
    return decoded.userId === service.provider.id;
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await axios.put(
        `${API_URL}/services/${id}`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      setService(prev => prev ? { ...prev, status: newStatus as Service['status'] } : null);
      showAlert('Statut mis à jour avec succès', 'success');
    } catch (error: any) {
      showAlert('Erreur lors de la mise à jour du statut', 'error');
    }
  };

  const handleDeleteService = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce service ?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/services/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      showAlert('Service supprimé avec succès', 'success');
      setTimeout(() => navigate('/services'), 2000);
    } catch (error) {
      showAlert('Erreur lors de la suppression du service', 'error');
    }
  };

  const handleCancelBooking = async () => {
    try {
      await axios.post(
        `${API_URL}/services/${id}/cancel`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      fetchServiceDetails();
      showAlert('Réservation annulée avec succès', 'success');
    } catch (error) {
      showAlert('Erreur lors de l\'annulation de la réservation', 'error');
    }
  };

  const showAlert = (message: string, severity: 'success' | 'error') => {
    setAlert({ open: true, message, severity });
  };

  if (!service) {
    return <Container>Chargement...</Container>;
  }

  function getUserId(): number {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('User is not authenticated');
    }
    const decoded = jwtDecode<{ userId: number }>(token);
    return decoded.userId;
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h4" component="h1">
                {service.title}
              </Typography>
              {isProvider() ? (
                <Select
                  value={service.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  size="small"
                >
                  {Object.entries(SERVICE_STATUS).map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                      <Chip 
                        label={label}
                        color={value === 'available' ? 'success' : 'default'}
                        size="small"
                      />
                    </MenuItem>
                  ))}
                </Select>
              ) : (
                <Chip 
                  label={SERVICE_STATUS[service.status]}
                  color={service.status === 'available' ? 'success' : 'default'}
                />
              )}
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6">Description</Typography>
            <Typography paragraph>
              {service.description}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6">Disponibilités</Typography>
            <Typography variant="body2" gutterBottom>
              Du {new Date(service.date_start).toLocaleString()} au {new Date(service.date_end).toLocaleString()}
            </Typography>
            <Typography variant="subtitle2" gutterBottom>
              Jours disponibles :
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              {service.availability.days.map(day => (
                <Chip key={day} label={day.charAt(0).toUpperCase() + day.slice(1)} />
              ))}
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Box display="flex" gap={2} flexWrap="wrap">
              {isProvider() ? (
                <>
                  <Button 
                    variant="contained"
                    onClick={() => navigate('/messages')}
                  >
                    Voir mes messages
                  </Button>
                  <Button 
                    variant="outlined" 
                    color="error"
                    onClick={handleDeleteService}
                  >
                    Supprimer le service
                  </Button>
                  {service.status === 'booked' && (
                    <Button 
                      variant="outlined" 
                      color="error"
                      onClick={handleCancelBooking}
                    >
                      Annuler la réservation
                    </Button>
                  )}
                </>
              ) : (
                <>
                  {service.status === 'available' ? (
                    <Button 
                      variant="contained"
                      onClick={() => setBookingDialogOpen(true)}
                    >
                      Réserver ce service
                    </Button>
                  ) : service.requester?.id === getUserId() && service.status === 'booked' && (
                    <Button 
                      variant="outlined" 
                      color="error"
                      onClick={handleCancelBooking}
                    >
                      Annuler ma réservation
                    </Button>
                  )}
                  <Button 
                    variant="outlined"
                    onClick={() => navigate(`/messages/${service.provider.id}`)}
                  >
                    Contacter le prestataire
                  </Button>
                </>
              )}
              <Button 
                variant="outlined"
                onClick={() => navigate('/services')}
              >
                Retour à la liste
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={() => setAlert({ ...alert, open: false })}
      >
        <Alert severity={alert.severity}>
          {alert.message}
        </Alert>
      </Snackbar>

      <BookService
        serviceId={parseInt(id!)}
        open={bookingDialogOpen}
        onClose={() => setBookingDialogOpen(false)}
        onSuccess={() => {
          fetchServiceDetails();
          showAlert('Service réservé avec succès', 'success');
        }}
        availableDays={service.availability.days}
        timeSlots={service.availability.time_slots}
      />
    </Container>
  );
};

export default ServiceDetail;