import React, { useState, useEffect, useCallback } from 'react';
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
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  IconButton,
  Tooltip
} from '@mui/material';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import EventIcon from '@mui/icons-material/Event';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import GroupIcon from '@mui/icons-material/Group';
import PersonIcon from '@mui/icons-material/Person';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import PublishIcon from '@mui/icons-material/Publish';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import jwtDecode from 'jwt-decode';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import CelebrationIcon from '@mui/icons-material/Celebration';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import CommentIcon from '@mui/icons-material/Comment';
import { API_URL } from '../../const';

// Types définis selon la structure de l'API
interface Event {
  id: number;
  name: string;
  date: string;
  location: string;
  max_participants: number;
  min_participants: number;
  status: 'open' | 'closed' | 'pending' | 'draft' | 'canceled';
  participants?: Participant[];
  type?: string;
  category?: string;
  description?: string;
  equipment_needed?: string;
  creator?: {
    id: number;
    firstname: string;
    lastname: string;
  };
}

interface Participant {
  id: number;
  userId: number;
  eventId: number;
  date_inscription: string;
  status_participation: string;
  comment?: string | null;
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

  // Fonctions utilitaires
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Ouvert';
      case 'closed': return 'Fermé';
      case 'pending': return 'En attente';
      case 'draft': return 'Brouillon';
      case 'canceled': return 'Annulé';
      default: return status;
    }
  };

  const getParticipationStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'confirmed': return 'Confirmé';
      case 'canceled': return 'Annulé';
      case 'approved': return 'Approuvé';
      default: return status;
    }
  };

  const getParticipationStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': 
      case 'approved': 
        return 'success';
      case 'pending': 
        return 'warning';
      case 'canceled': 
        return 'error';
      default: 
        return 'default';
    }
  };
  
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isParticipant, setIsParticipant] = useState(false);
  const [participantId, setParticipantId] = useState<number | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [statusChangeDialog, setStatusChangeDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [alert, setAlert] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

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
          `${API_URL}/event-participants/${participantId}`,
          {
            status_participation: 'pending',
            comment: note || undefined
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
          `${API_URL}/event-participants`,
          {
            userId: decoded.userId,
            eventId: Number(id),
            date_inscription: new Date().toISOString(),
            status_participation: 'pending',
            comment: note || undefined
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
  const fetchEventDetails = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      let decoded: { userId: number } | null = null;
      
      if (token) {
        decoded = jwtDecode<{ userId: number }>(token);
      }
      
      // 1. Récupérer les détails de l'événement
      const eventResponse = await axios.get<Event>(
        `${API_URL}/events/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      setEvent(eventResponse.data);
      
      // Vérifier si l'utilisateur est le créateur
      if (decoded && eventResponse.data.creator) {
        setIsCreator(decoded.userId === eventResponse.data.creator.id);
      }
      
      // 2. Récupérer spécifiquement les participants pour cet événement
      const participantsResponse = await axios.get<ApiResponse<Participant>>(
        `${API_URL}/event-participants?eventId=${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      console.log("Participants récupérés pour l'événement:", participantsResponse.data);
      
      // Pas besoin de filtrer si le backend fait déjà le filtrage
      setParticipants(participantsResponse.data.data);
      
      // Vérifier si l'utilisateur actuel est inscrit
      if (decoded) {
        console.log("UserId actuel:", decoded.userId, typeof decoded.userId);
  
        // Vérifier la structure des participants
        if (participantsResponse.data.data.length > 0) {
          console.log("Structure d'un participant:", participantsResponse.data.data[0]);
        }
  
        // Comparaison avec conversion explicite des types
        const userParticipation = participantsResponse.data.data.find(p => {
          console.log(`Comparaison: ${Number(p.user?.id)} === ${Number(decoded!.userId)}`);
          return Number(p.user?.id) === Number(decoded!.userId);
        });
  
        console.log("Participation trouvée?", userParticipation);
  
        if (userParticipation) {
          setIsParticipant(true);
          setParticipantId(userParticipation.id);
          // Remplir le commentaire existant s'il y en a un
          setNote(userParticipation.comment || '');
        } else {
          setIsParticipant(false);
          setParticipantId(null);
          setNote('');
        }
      }
    } catch (error) {
      console.error("Erreur lors du chargement des détails:", error);
      showAlert('Erreur lors du chargement des détails de l\'événement', 'error');
    }
  }, [id]);

  useEffect(() => {
    fetchEventDetails();
  }, [fetchEventDetails]);

  // Fonctions de gestion pour le créateur
  const handleStatusChange = async () => {
    if (!newStatus || !event) return;
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Si le nouveau statut est "canceled", utiliser la route spécifique
      if (newStatus === 'canceled') {
        await axios.put(
          `${API_URL}/events/${event.id}/cancel`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else {
        // Sinon, utiliser la route de mise à jour normale
        await axios.put(
          `${API_URL}/events/${event.id}`,
          { status: newStatus },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }
      
      setEvent({ ...event, status: newStatus as Event['status'] });
      setStatusChangeDialog(false);
      setNewStatus('');
      showAlert('Statut mis à jour avec succès', 'success');
    } catch (error) {
      console.error("Erreur lors du changement de statut:", error);
      showAlert('Erreur lors du changement de statut', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEvent = async () => {
    if (!event) return;
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/events/${event.id}/cancel`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      setEvent({ ...event, status: 'canceled' });
      showAlert('Événement annulé avec succès', 'success');
    } catch (error) {
      console.error("Erreur lors de l'annulation:", error);
      showAlert('Erreur lors de l\'annulation', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleParticipantStatusChange = async (participantId: number, newStatus: string) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/event-participants/${participantId}`,
        { status_participation: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      // Mettre à jour localement le statut du participant
      setParticipants(participants.map(p => 
        p.id === participantId 
          ? { ...p, status_participation: newStatus }
          : p
      ));
      
      showAlert(`Participant ${newStatus === 'confirmed' ? 'confirmé' : 'refusé'} avec succès`, 'success');
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
      showAlert('Erreur lors de la mise à jour du statut', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!event) return;
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${API_URL}/events/${event.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      showAlert('Événement supprimé avec succès', 'success');
      navigate('/events');
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      showAlert('Erreur lors de la suppression', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveParticipant = async (participantId: number) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${API_URL}/event-participants/${participantId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      setParticipants(participants.filter(p => p.id !== participantId));
      showAlert('Participant retiré avec succès', 'success');
    } catch (error) {
      console.error("Erreur lors de la suppression du participant:", error);
      showAlert('Erreur lors de la suppression du participant', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditEvent = () => {
    if (event) {
      navigate(`/events/${event.id}/edit`);
    }
  };

  const handlePublishEvent = async () => {
    if (!event) return;
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/events/${event.id}`,
        { status: 'open' },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      setEvent({ ...event, status: 'open' });
      showAlert('Événement publié avec succès', 'success');
    } catch (error) {
      console.error("Erreur lors de la publication:", error);
      showAlert('Erreur lors de la publication', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelParticipation = async () => {
    if (!participantId) return;
    
    try {
      // Utiliser l'endpoint DELETE pour supprimer la participation
      await axios.delete(
        `${API_URL}/event-participants/${participantId}`,
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

  const showAlert = (message: string, severity: 'success' | 'error') => {
    setAlert({ open: true, message, severity });
  };

  const renderCategoryInfo = () => {
    if (!event?.type || event.type !== 'community' || !event.category) {
      return null;
    }
    
    let icon;
    let categoryLabel;
    
    switch (event.category) {
      case 'cleaning':
        icon = <CleaningServicesIcon color="primary" />;
        categoryLabel = 'Nettoyage';
        break;
      case 'waste_collection':
        icon = <DeleteIcon color="primary" />;
        categoryLabel = 'Collecte de déchets';
        break;
      case 'neighborhood_party':
        icon = <CelebrationIcon color="primary" />;
        categoryLabel = 'Fête de quartier';
        break;
      default:
        icon = <VolunteerActivismIcon color="primary" />;
        categoryLabel = 'Autre';
    }
    
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {icon}
          Événement communautaire: {categoryLabel}
        </Typography>
        
        {event.description && (
          <Typography variant="body1" paragraph>
            {event.description}
          </Typography>
        )}
        
        {event.equipment_needed && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" gutterBottom color="primary">
              Matériel nécessaire:
            </Typography>
            <Typography variant="body2">
              {event.equipment_needed}
            </Typography>
          </Box>
        )}
      </Box>
    );
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
        
        {renderCategoryInfo()}
        
        <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <EventIcon />
          <Typography variant="subtitle1">
            {formatDate(event.date)}
          </Typography>
        </Box>
        
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
            
            {/* Section de gestion pour le créateur */}
            {isCreator && (
              <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h6" gutterBottom color="primary">
                  Gestion de l'événement
                </Typography>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {event.status === 'draft' && (
                    <>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handlePublishEvent}
                        startIcon={<PublishIcon />}
                        disabled={isLoading}
                      >
                        Publier
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={handleEditEvent}
                        startIcon={<EditIcon />}
                      >
                        Modifier
                      </Button>
                    </>
                  )}
                  
                  {event.status !== 'draft' && (
                    <>
                      <Button
                        variant="outlined"
                        onClick={() => setStatusChangeDialog(true)}
                        startIcon={<CheckCircleIcon />}
                      >
                        Changer le statut
                      </Button>
                      
                      {event.status !== 'canceled' && (
                        <Button
                          variant="outlined"
                          color="warning"
                          onClick={handleCancelEvent}
                          startIcon={<CancelIcon />}
                          disabled={isLoading}
                        >
                          Annuler l'événement
                        </Button>
                      )}
                    </>
                  )}
                  
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => setDeleteDialog(true)}
                    startIcon={<DeleteIcon />}
                  >
                    Supprimer
                  </Button>
                </Box>
                
                <Typography variant="body2" color="text.secondary">
                  En tant que créateur, vous pouvez gérer cet événement.
                </Typography>
              </Box>
            )}
            
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
                  <ListItem 
                    key={participant.id}
                    sx={{ 
                      flexDirection: 'column', 
                      alignItems: 'stretch',
                      py: 2,
                      px: 1
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <ListItemAvatar>
                        <Avatar>
                          <PersonIcon />
                        </Avatar>
                      </ListItemAvatar>
                      
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {participant.user ? 
                              `${participant.user.firstname} ${participant.user.lastname}` : 
                              `Participant #${participant.userId}`}
                          </Typography>
                          {participant.comment && (
                            <Tooltip title={participant.comment} arrow placement="top">
                              <CommentIcon 
                                sx={{ 
                                  fontSize: 16, 
                                  color: 'primary.main',
                                  cursor: 'help'
                                }} 
                              />
                            </Tooltip>
                          )}
                        </Box>
                        
                        <Chip 
                          label={getParticipationStatusLabel(participant.status_participation)}
                          color={getParticipationStatusColor(participant.status_participation) as any}
                          size="small"
                        />
                      </Box>
                      
                      {isCreator && (
                        <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                          {participant.status_participation === 'pending' && (
                            <>
                              <Tooltip title="Confirmer ce participant">
                                <IconButton
                                  color="success"
                                  onClick={() => handleParticipantStatusChange(participant.id, 'confirmed')}
                                  disabled={isLoading}
                                  size="small"
                                >
                                  <CheckCircleIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Refuser ce participant">
                                <IconButton
                                  color="error"
                                  onClick={() => handleParticipantStatusChange(participant.id, 'canceled')}
                                  disabled={isLoading}
                                  size="small"
                                >
                                  <CancelIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                          <Tooltip title="Supprimer ce participant">
                            <IconButton
                              color="error"
                              onClick={() => handleRemoveParticipant(participant.id)}
                              disabled={isLoading}
                              size="small"
                            >
                              <PersonRemoveIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )}
                    </Box>
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

      {/* Dialogue de changement de statut */}
      <Dialog open={statusChangeDialog} onClose={() => setStatusChangeDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Changer le statut de l'événement</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Nouveau statut</InputLabel>
            <Select
              value={newStatus}
              label="Nouveau statut"
              onChange={(e: SelectChangeEvent) => setNewStatus(e.target.value)}
            >
              <MenuItem value="open">Ouvert</MenuItem>
              <MenuItem value="closed">Fermé</MenuItem>
              <MenuItem value="pending">En attente</MenuItem>
              <MenuItem value="canceled">Annulé</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusChangeDialog(false)}>Annuler</Button>
          <Button 
            onClick={handleStatusChange}
            variant="contained" 
            disabled={!newStatus || isLoading}
          >
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialogue de confirmation de suppression */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Supprimer l'événement</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Êtes-vous sûr de vouloir supprimer cet événement ? Cette action est irréversible.
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            Tous les participants seront automatiquement désinscrit.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Annuler</Button>
          <Button 
            onClick={handleDeleteEvent}
            variant="contained" 
            color="error"
            disabled={isLoading}
          >
            Supprimer définitivement
          </Button>
        </DialogActions>
      </Dialog>

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