import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Chip,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  LinearProgress
} from '@mui/material';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import EventIcon from '@mui/icons-material/Event';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import GroupIcon from '@mui/icons-material/Group';
import PersonIcon from '@mui/icons-material/Person';
import jwtDecode from 'jwt-decode';

// Types définis selon la structure de l'API
interface Event {
  id: number;
  name: string;
  date: string;
  location: string;
  max_participants: number;
  min_participants: number;
  status: 'open' | 'closed' | 'pending' | 'draft' | 'canceled'; // Ajout de 'canceled'
  participants?: Participant[];
}

interface Participant {
  id: number;
  userId: number;
  eventId: number;
  date_inscription: string;
  status_participation: string;
  user?: {
    id: number;
    firstname: string;
    lastname: string;
  };
}

interface ApiResponse<T> {
  data: T[];
  page_size: number;
  page: number;
  total_count: number;
  total_pages: number;
}

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isParticipant, setIsParticipant] = useState(false);
  const [participantId, setParticipantId] = useState<number | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const handleParticipate = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const decoded = jwtDecode<{ userId: number }>(token);
      
      // Traiter différemment selon si l'utilisateur est déjà inscrit ou non
      if (isParticipant && participantId) {
        // Mettre à jour une participation existante
        await axios.put(
          `http://localhost:3000/event-participants/${participantId}`,
          {
            status_participation: 'pending',
            // Note est un commentaire optionnel
            note: note || undefined
          },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        
        showAlert('Inscription mise à jour !', 'success');
      } else {
        // Créer une nouvelle participation avec la structure exacte attendue par l'API
        const response = await axios.post<{ id: number }>(
          'http://localhost:3000/event-participants',
          {
            userId: decoded.userId,
            eventId: Number(id),
            date_inscription: new Date().toISOString(),
            status_participation: 'pending'
          },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        
        console.log("Réponse de l'inscription:", response.data);
        
        // Mettre à jour immédiatement les états locaux
        setIsParticipant(true);
        setParticipantId(response.data.id);
        
        // Ajouter manuellement le participant à la liste
        const newParticipant = {
          id: response.data.id,
          userId: decoded.userId,
          eventId: Number(id),
          date_inscription: new Date().toISOString(),
          status_participation: 'pending'
        };
        
        setParticipants(prev => [...prev, newParticipant]);
        
        showAlert('Inscription réussie !', 'success');
      }
      
      setOpenDialog(false);
      
      // Attendre un court instant avant de rafraîchir les données
      setTimeout(() => {
        fetchEventDetails();
      }, 500);
      
    } catch (error: any) {
      console.error('Erreur détaillée:', error.response?.data);
      showAlert(
        error.response?.data?.message || 'Erreur lors de l\'inscription', 
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Amélioration du fetchEventDetails pour être plus robuste
  const fetchEventDetails = async () => {
    try {
      // 1. Récupérer les détails de l'événement
      const eventResponse = await axios.get<Event>(
        `http://localhost:3000/events/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      
      setEvent(eventResponse.data);
      
      // 2. Récupérer spécifiquement les participants pour cet événement
      const participantsResponse = await axios.get<ApiResponse<Participant>>(
        `http://localhost:3000/event-participants?eventId=${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      
      console.log("Participants récupérés pour l'événement:", participantsResponse.data);
      
      // Pas besoin de filtrer si le backend fait déjà le filtrage
      setParticipants(participantsResponse.data.data);
      
      // Vérifier si l'utilisateur actuel est inscrit
      const token = localStorage.getItem('token');
      if (token) {
        const decoded = jwtDecode<{ userId: number }>(token);
        console.log("UserId actuel:", decoded.userId, typeof decoded.userId);
  
        // Vérifier la structure des participants
        if (participantsResponse.data.data.length > 0) {
          console.log("Structure d'un participant:", participantsResponse.data.data[0]);
        }
  
        // Comparaison avec conversion explicite des types
        const userParticipation = participantsResponse.data.data.find(p => {
          console.log(`Comparaison: ${Number(p.user?.id)} === ${Number(decoded.userId)}`);
          return Number(p.user?.id) === Number(decoded.userId);
        });
  
        console.log("Participation trouvée?", userParticipation);
  
        if (userParticipation) {
          setIsParticipant(true);
          setParticipantId(userParticipation.id);
        } else {
          setIsParticipant(false);
          setParticipantId(null);
        }
      }
    } catch (error) {
      console.error("Erreur lors du chargement des détails:", error);
      showAlert('Erreur lors du chargement des détails de l\'événement', 'error');
    }
  };

  const handleCancelParticipation = async () => {
    if (!participantId) return;
    
    try {
      // Utiliser l'endpoint DELETE pour supprimer la participation
      await axios.delete(
        `http://localhost:3000/event-participants/${participantId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      
      setIsParticipant(false);
      setParticipantId(null);
      showAlert('Inscription annulée', 'success');
      fetchEventDetails();
    } catch (error) {
      console.error("Erreur lors de l'annulation:", error);
      showAlert('Erreur lors de l\'annulation', 'error');
    }
  };

  // Utilitaires pour le formatage et l'affichage
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
      case 'open': return 'success';
      case 'closed': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Ouvert';
      case 'closed': return 'Fermé';
      case 'pending': return 'En attente';
      case 'draft': return 'Brouillon';
      case 'canceled': return 'Annulé'; // Ajout de ce cas
      default: return status;
    }
  };

  const showAlert = (message: string, severity: 'success' | 'error') => {
    setAlert({ open: true, message, severity });
  };

  if (!event) {
    return <Container>Chargement...</Container>;
  }

  const participantsCount = participants.length;
  const remainingSlots = event.max_participants - participantsCount;
  const isMaxReached = participants.length >= event.max_participants;

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          {event.name}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Chip 
            label={getStatusLabel(event.status)}
            color={getStatusColor(event.status) as any}
          />
        </Box>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <EventIcon color="primary" />
                <Typography variant="body1">
                  {formatDate(event.date)}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOnIcon color="primary" />
                <Typography variant="body1">
                  {event.location}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <GroupIcon color="primary" />
                <Typography variant="body1">
                  {participantsCount}/{event.max_participants} participants
                  {event.min_participants > 0 && ` (minimum requis : ${event.min_participants})`}
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Informations importantes
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {remainingSlots <= 0 ? (
                  "Cette sortie est complète."
                ) : (
                  `Il reste ${remainingSlots} place${remainingSlots > 1 ? 's' : ''} disponible${remainingSlots > 1 ? 's' : ''}.`
                )}
                {event.min_participants > 0 && participantsCount < event.min_participants && (
                  ` Cette sortie nécessite au minimum ${event.min_participants} participants pour être confirmée.`
                )}
              </Typography>
              
              {event.status === 'open' && (
                <Box sx={{ mt: 2 }}>
                  {!isParticipant ? (
                    <Button
                      variant="contained"
                      onClick={() => setOpenDialog(true)}
                      disabled={isParticipant || isMaxReached}
                    >
                      {isParticipant 
                        ? 'Déjà inscrit' 
                        : isMaxReached 
                          ? 'Complet' 
                          : 'S\'inscrire'}
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outlined" 
                        color="primary"
                        onClick={() => setOpenDialog(true)}
                        sx={{ mr: 1 }}
                      >
                        Modifier mon inscription
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={handleCancelParticipation}
                      >
                        Annuler mon inscription
                      </Button>
                    </>
                  )}
                </Box>
              )}
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Typography variant="h6">
              Participants ({participantsCount}/{event.max_participants})
            </Typography>
            {participants.length > 0 ? (
              <List>
                {participants.map((participant) => (
                  <ListItem key={participant.id}>
                    <ListItemAvatar>
                      <Avatar>
                        <PersonIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={participant.user ? 
                        `${participant.user.firstname} ${participant.user.lastname}` : 
                        `Participant #${participant.userId}`}
                      secondary={`Statut: ${participant.status_participation}`}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" sx={{ mt: 2 }}>
                Aucun participant pour le moment.
              </Typography>
            )}
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 3 }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/events')}
          >
            Retour à la liste
          </Button>
        </Box>
      </Paper>

      {/* Dialogue d'inscription */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{isParticipant ? 'Modifier mon inscription' : 'S\'inscrire à "' + event.name + '"'}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              Date: {formatDate(event.date)}
            </Typography>
            <Typography variant="body2" gutterBottom>
              Lieu: {event.location}
            </Typography>
            
            <TextField
              margin="normal"
              fullWidth
              multiline
              rows={3}
              label="Commentaire (optionnel)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Annuler</Button>
          <Button 
            onClick={handleParticipate} 
            variant="contained" 
            disabled={isLoading}
          >
            {isParticipant ? 'Mettre à jour' : 'Confirmer l\'inscription'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={() => setAlert({ ...alert, open: false })}
      >
        <Alert severity={alert.severity}>
          {alert.message}
        </Alert>
      </Snackbar>

      {/* Indicateur de statut */}
      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {`${participants.length} / ${event.max_participants} participants`}
          {event.min_participants > 0 && 
            ` (minimum: ${event.min_participants})`}
        </Typography>
        <LinearProgress 
          variant="determinate" 
          value={(participants.length / event.max_participants) * 100}
          sx={{ ml: 2, flexGrow: 1 }} 
        />
      </Box>

      {/* Avertissement pour le minimum de participants */}
      {event.status === 'pending' && participants.length < event.min_participants && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          L'événement sera annulé s'il n'y a pas au moins {event.min_participants} participants.
        </Alert>
      )}
    </Container>
  );
};

export default EventDetail;