import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Box,
  Snackbar,
  Alert,
  Divider,
  Tabs,
  Tab
} from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import EventIcon from '@mui/icons-material/Event';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import GroupIcon from '@mui/icons-material/Group';
import jwtDecode from 'jwt-decode';
import { API_URL } from '../../const';

interface Event {
  id: number;
  name: string;
  date: string;
  location: string;
  max_participants: number;
  min_participants: number;
  status: string;
  type: string;
  category?: string;
  description?: string;
  equipment_needed?: string;
  creator: {
    id: number;
    firstname: string;
    lastname: string;
  };
}

interface EventParticipation {
  id: number;
  eventId: number;
  userId: number;
  date_inscription: string;
  status_participation: string;
  event: Event;
}

interface ParticipationResponse {
  data: {
    id: number;
    eventId: number;
    userId: number;
    date_inscription: string;
    status_participation: string;
    [key: string]: any;
  }[];
}

const MyEvents = () => {
  const [participations, setParticipations] = useState<EventParticipation[]>([]);
  const [createdEvents, setCreatedEvents] = useState<Event[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [alert, setAlert] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const navigate = useNavigate();

  const fetchMyEvents = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const decoded = jwtDecode<{ userId: number }>(token);
      const userId = decoded.userId;

      // Récupérer tous les événements d'abord
      const { data: eventsData } = await axios.get<{ data: Event[] }>(
        `${API_URL}/events`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      // Filtrer les événements créés par l'utilisateur (y compris les brouillons)
      const userCreatedEvents = eventsData.data.filter(
        (event) => event.creator.id === userId
      );
      setCreatedEvents(userCreatedEvents);
      
      // Ensuite récupérer les participations
      try {
        const { data: participationsData } = await axios.get<ParticipationResponse>(
          `${API_URL}/event-participants`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        
        // Filtrer côté client pour l'utilisateur actuel
        const userParticipations = participationsData.data.filter(
          (p) => p.userId === userId
        );
        
        // Combiner avec les détails d'événements
        const participationsWithEvents = userParticipations.map((p) => {
          const eventDetails = eventsData.data.find((e) => e.id === p.eventId);
          return { ...p, event: eventDetails } as EventParticipation;
        });

        setParticipations(participationsWithEvents);
      } catch (error) {
        console.error("Erreur avec les participations:", error);
        setParticipations([]);
        showAlert('Impossible de charger vos participations', 'error');
      }
    } catch (error) {
      showAlert('Erreur lors du chargement de vos événements', 'error');
    }
  }, [navigate]);

  useEffect(() => {
    fetchMyEvents();
  }, [fetchMyEvents]);

  const handleCancelParticipation = async (participationId: number) => {
    try {
      await axios.delete(
        `${API_URL}/event-participants/${participationId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      showAlert('Inscription annulée avec succès', 'success');
      fetchMyEvents();
    } catch (error) {
      showAlert('Erreur lors de l\'annulation de l\'inscription', 'error');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'success';
      case 'closed':
        return 'error';
      case 'pending':
        return 'warning';
      case 'draft':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open':
        return 'Ouvert';
      case 'closed':
        return 'Fermé';
      case 'pending':
        return 'En attente';
      case 'draft':
        return 'Brouillon';
      default:
        return status;
    }
  };

  const getParticipationStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'canceled':
        return 'error';
      default:
        return 'default';
    }
  };

  const showAlert = (message: string, severity: 'success' | 'error') => {
    setAlert({ open: true, message, severity });
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const filteredParticipations = participations.filter(participation => {
    if (tabValue === 0) return true; // Tous
    if (tabValue === 1) return new Date(participation.event.date) >= new Date(); // À venir
    if (tabValue === 2) return new Date(participation.event.date) < new Date(); // Passés
    return true;
  });

  const filteredCreatedEvents = createdEvents.filter(event => {
    if (tabValue === 0) return true; // Tous
    if (tabValue === 1) return new Date(event.date) >= new Date(); // À venir
    if (tabValue === 2) return new Date(event.date) < new Date(); // Passés
    return true;
  });

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Mes Sorties
      </Typography>
      <Typography variant="subtitle1" gutterBottom color="text.secondary">
        Gérez vos inscriptions aux sorties et activités
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="event tabs">
          <Tab label="Toutes" />
          <Tab label="À venir" />
          <Tab label="Passées" />
        </Tabs>
      </Box>

      {/* Section des événements créés */}
      {filteredCreatedEvents.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Événements que j'ai créés
          </Typography>
          <Grid container spacing={3}>
            {filteredCreatedEvents.map((event) => (
              <Grid item xs={12} sm={6} md={4} key={`created-${event.id}`}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6" component="div">
                        {event.name}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip
                          label={getStatusLabel(event.status)}
                          color={getStatusColor(event.status) as any}
                          size="small"
                        />
                        {event.type === 'community' && (
                          <Chip
                            label="Communautaire"
                            color="info"
                            size="small"
                          />
                        )}
                      </Box>
                    </Box>

                    <Divider sx={{ my: 1 }} />

                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EventIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(event.date)}
                      </Typography>
                    </Box>
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationOnIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {event.location}
                      </Typography>
                    </Box>
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <GroupIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {event.max_participants} participants max
                      </Typography>
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      onClick={() => navigate(`/events/${event.id}`)}
                      sx={{ mr: 1 }}
                    >
                      Détails
                    </Button>
                    {event.status === 'draft' && (
                      <Button
                        size="small"
                        color="primary"
                        onClick={() => navigate(`/events/${event.id}/edit`)}
                      >
                        Modifier
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Section des participations */}
      {filteredParticipations.length > 0 && (
        <Box>
          <Typography variant="h5" gutterBottom>
            Événements auxquels je participe
          </Typography>
        </Box>
      )}

      {filteredParticipations.length === 0 && filteredCreatedEvents.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1">
            Vous n'avez pas encore d'inscriptions à des sorties.
          </Typography>
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            onClick={() => navigate('/events')}
          >
            Découvrir les sorties disponibles
          </Button>
        </Box>
      ) : (
        filteredParticipations.length > 0 && (
          <Grid container spacing={3}>
            {filteredParticipations.map((participation) => (
              <Grid item xs={12} sm={6} md={4} key={participation.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6" component="div">
                        {participation.event.name}
                      </Typography>
                      <Chip
                        label={participation.status_participation}
                        color={getParticipationStatusColor(participation.status_participation) as any}
                        size="small"
                      />
                    </Box>

                    <Divider sx={{ my: 1 }} />

                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EventIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(participation.event.date)}
                      </Typography>
                    </Box>
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationOnIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {participation.event.location}
                      </Typography>
                    </Box>
                    <Box sx={{ mt: 1 }}>
                      <Chip
                        label={participation.event.status}
                        color={getStatusColor(participation.event.status) as any}
                        size="small"
                      />
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      onClick={() => navigate(`/events/${participation.eventId}`)}
                      sx={{ mr: 1 }}
                    >
                      Détails
                    </Button>
                    {new Date(participation.event.date) > new Date() && (
                      <Button
                        size="small"
                        color="error"
                        onClick={() => handleCancelParticipation(participation.id)}
                      >
                        Annuler
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )
      )}

      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={() => setAlert({ ...alert, open: false })}
      >
        <Alert severity={alert.severity}>
          {alert.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default MyEvents;