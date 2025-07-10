import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Snackbar,
  Alert,
  FormGroup,
  FormControlLabel,
  Checkbox,
  IconButton,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  CalendarToday as CalendarIcon,
  Work as WorkIcon,
  Visibility as VisibilityIcon,
  AccessTime as TimeIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Service, SERVICE_TYPES, SERVICE_STATUS, DAY_LABELS } from '../../types/Service';
import jwtDecode from 'jwt-decode';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import { API_URL } from '../../const';

interface TimeSlot {
  start: string;
  end: string;
}

interface ServiceFormData {
  title: string;
  description: string;
  type: string;
  date_start: string;
  date_end: string;
  days: string[];
  timeSlots: TimeSlot[];
}

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Lundi' },
  { key: 'tuesday', label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday', label: 'Jeudi' },
  { key: 'friday', label: 'Vendredi' },
  { key: 'saturday', label: 'Samedi' },
  { key: 'sunday', label: 'Dimanche' },
];

const PREDEFINED_TIME_SLOTS = [
  { label: 'Matin (9h-12h)', start: '09:00', end: '12:00' },
  { label: 'Après-midi (14h-18h)', start: '14:00', end: '18:00' },
  { label: 'Soirée (18h-21h)', start: '18:00', end: '21:00' },
  { label: 'Journée complète (9h-18h)', start: '09:00', end: '18:00' },
];

const MyServices: React.FC = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [alert, setAlert] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({ open: false, message: '', severity: 'success' });
  
  const [formData, setFormData] = useState<ServiceFormData>({
    title: '',
    description: '',
    type: 'other',
    date_start: new Date().toISOString().slice(0, 16),
    date_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    days: [],
    timeSlots: [],
  });

  const [newTimeSlot, setNewTimeSlot] = useState<TimeSlot>({
    start: '09:00',
    end: '17:00',
  });

  const showAlert = useCallback((message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setAlert({ open: true, message, severity });
  }, []);

  const fetchMyServices = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const decoded = jwtDecode<{ userId: number }>(token);
      
      const response = await axios.get(`${API_URL}/services?limit=1000`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data?.data) {
        const myServices = response.data.data
          .filter((service: Service) => 
            service.provider && service.provider.id === decoded.userId
          )
          .map((service: Service) => ({
            ...service,
            availability: {
              ...service.availability,
              days: convertDaysToEnglish(service.availability.days), // Convertir en anglais pour le frontend
              timeSlots: service.availability.time_slots || [] // Utiliser time_slots
            }
          }));
        setServices(myServices);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      showAlert('Erreur lors du chargement des services', 'error');
    } finally {
      setLoading(false);
    }
  }, [navigate, showAlert]);

  useEffect(() => {
    fetchMyServices();
  }, [fetchMyServices]);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'other',
      date_start: new Date().toISOString().slice(0, 16),
      date_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      days: [],
      timeSlots: [],
    });
    setNewTimeSlot({ start: '09:00', end: '17:00' });
  };

  const validateForm = (): string | null => {
    if (!formData.title.trim()) return 'Le titre est requis';
    if (!formData.description.trim()) return 'La description est requise';
    if (formData.days.length === 0) return 'Veuillez sélectionner au moins un jour';
    if (formData.timeSlots.length === 0) return 'Veuillez ajouter au moins un créneau horaire';
    if (new Date(formData.date_start) >= new Date(formData.date_end)) {
      return 'La date de fin doit être postérieure à la date de début';
    }
    return null;
  };

  const handleCreateService = async () => {
    try {
      const validationError = validateForm();
      if (validationError) {
        showAlert(validationError, 'warning');
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const serviceData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        type: formData.type,
        date_start: new Date(formData.date_start).toISOString(),
        date_end: new Date(formData.date_end).toISOString(),
        availability: {
          days: convertDaysToFrench(formData.days), // Convertir les jours en français
          time_slots: formData.timeSlots
        }
      };

      console.log('🚀 Creating service with data:', serviceData);
      console.log('🎯 Original formData.days:', formData.days);
      console.log('🔄 Converted days:', convertDaysToFrench(formData.days));
      console.log('⏰ Time slots:', formData.timeSlots);

      await axios.post(`${API_URL}/services`, serviceData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setCreateDialogOpen(false);
      resetForm();
      fetchMyServices();
      showAlert('Service créé avec succès !', 'success');
    } catch (error) {
      console.error('Error creating service:', error);
      if (axios.isAxiosError(error) && error.response) {
        const errorMessage = error.response.data?.message || 'Erreur inconnue';
        showAlert(`Erreur lors de la création: ${errorMessage}`, 'error');
      } else {
        showAlert('Erreur lors de la création du service', 'error');
      }
    }
  };

  const handleDeleteService = async (serviceId: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce service ?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      await axios.delete(`${API_URL}/services/${serviceId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      fetchMyServices();
      showAlert('Service supprimé avec succès', 'success');
    } catch (error) {
      console.error('Error deleting service:', error);
      showAlert('Erreur lors de la suppression du service', 'error');
    }
  };

  const toggleServiceStatus = async (serviceId: number, currentStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const newStatus = currentStatus === 'available' ? 'paused' : 'available';
      
      await axios.put(`${API_URL}/services/${serviceId}`, 
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      fetchMyServices();
      showAlert(`Service ${newStatus === 'available' ? 'activé' : 'mis en pause'}`, 'success');
    } catch (error) {
      console.error('Error updating service status:', error);
      showAlert('Erreur lors de la mise à jour du statut', 'error');
    }
  };

  const addTimeSlot = () => {
    if (newTimeSlot.start >= newTimeSlot.end) {
      showAlert('L\'heure de début doit être antérieure à l\'heure de fin', 'warning');
      return;
    }

    // Vérifier si le créneau existe déjà
    const exists = formData.timeSlots.some(slot => 
      slot.start === newTimeSlot.start && slot.end === newTimeSlot.end
    );

    if (exists) {
      showAlert('Ce créneau horaire existe déjà', 'warning');
      return;
    }

    setFormData(prev => ({
      ...prev,
      timeSlots: [...prev.timeSlots, { ...newTimeSlot }]
    }));
    setNewTimeSlot({ start: '09:00', end: '17:00' });
  };

  const removeTimeSlot = (index: number) => {
    setFormData(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.filter((_, i) => i !== index)
    }));
  };

  const addPredefinedTimeSlot = (slot: TimeSlot) => {
    const exists = formData.timeSlots.some(ts => 
      ts.start === slot.start && ts.end === slot.end
    );

    if (exists) {
      showAlert('Ce créneau horaire existe déjà', 'warning');
      return;
    }

    setFormData(prev => ({
      ...prev,
      timeSlots: [...prev.timeSlots, { ...slot }]
    }));
  };

  const toggleDay = (dayKey: string) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.includes(dayKey)
        ? prev.days.filter(d => d !== dayKey)
        : [...prev.days, dayKey]
    }));
  };

  const formatTimeSlots = (timeSlots: TimeSlot[]) => {
    if (!timeSlots || timeSlots.length === 0) return 'Aucun créneau défini';
    return timeSlots.map(slot => `${slot.start}-${slot.end}`).join(', ');
  };

  const formatDays = (days: string[]) => {
    if (!days || days.length === 0) return 'Aucun jour défini';
    return days.map(day => DAY_LABELS[day as keyof typeof DAY_LABELS] || day).join(', ');
  };

  // Fonction pour convertir les jours anglais vers français pour l'API
  const convertDaysToFrench = (englishDays: string[]): string[] => {
    return englishDays.map(day => DAY_LABELS[day as keyof typeof DAY_LABELS] || day);
  };

  // Fonction pour convertir les jours français vers anglais depuis l'API
  const convertDaysToEnglish = (frenchDays: string[]): string[] => {
    const reverseMapping: { [key: string]: string } = {
      'Lundi': 'monday',
      'Mardi': 'tuesday', 
      'Mercredi': 'wednesday',
      'Jeudi': 'thursday',
      'Vendredi': 'friday',
      'Samedi': 'saturday',
      'Dimanche': 'sunday'
    };
    return frenchDays.map(day => reverseMapping[day] || day);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'success';
      case 'booked': return 'warning';
      case 'completed': return 'info';
      case 'paused': return 'default';
      default: return 'default';
    }
  };

  const getTimeSlots = (service: Service) => {
    return service.availability?.time_slots || [];
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <Typography variant="h5">Chargement de vos services...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* En-tête */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center' }}>
            <WorkIcon sx={{ mr: 2 }} />
            Mes Services
            <Chip 
              label={services.length} 
              color="primary" 
              size="small" 
              sx={{ ml: 2 }}
            />
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
            size="large"
          >
            Nouveau Service
          </Button>
        </Box>

        {/* Liste des services */}
        {services.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center', backgroundColor: 'grey.50' }}>
            <WorkIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
            <Typography variant="h5" gutterBottom color="textSecondary">
              Aucun service créé
            </Typography>
            <Typography variant="body1" color="textSecondary" paragraph>
              Créez votre premier service pour commencer à proposer vos services à la communauté.
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
              size="large"
            >
              Créer mon premier service
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {services.map((service) => (
              <Grid item xs={12} lg={6} key={service.id}>
                <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    {/* En-tête du service */}
                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                      <Typography variant="h6" component="h2" sx={{ flexGrow: 1, mr: 2 }}>
                        {service.title}
                      </Typography>
                      <Chip 
                        label={SERVICE_STATUS[service.status]}
                        color={getStatusColor(service.status)}
                        size="small"
                      />
                    </Box>
                    
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      <strong>Type:</strong> {SERVICE_TYPES[service.type]}
                    </Typography>
                    
                    <Typography variant="body2" paragraph sx={{ mb: 3 }}>
                      {service.description}
                    </Typography>

                    {/* Disponibilités */}
                    <Accordion sx={{ mb: 2 }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center' }}>
                          <ScheduleIcon sx={{ mr: 1, fontSize: 20 }} />
                          Disponibilités
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <List dense>
                          <ListItem>
                            <ListItemIcon>
                              <CalendarIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText 
                              primary="Jours"
                              secondary={formatDays(service.availability.days)}
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemIcon>
                              <TimeIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText 
                              primary="Horaires"
                              secondary={formatTimeSlots(getTimeSlots(service))}
                            />
                          </ListItem>
                          <Divider />
                          <ListItem>
                            <ListItemText 
                              primary="Période"
                              secondary={`Du ${new Date(service.date_start).toLocaleDateString('fr-FR')} au ${new Date(service.date_end).toLocaleDateString('fr-FR')}`}
                            />
                          </ListItem>
                        </List>
                      </AccordionDetails>
                    </Accordion>

                    {/* Actions */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mt="auto">
                      <FormControlLabel
                        control={
                          <Switch
                            checked={service.status === 'available'}
                            onChange={() => toggleServiceStatus(service.id, service.status)}
                            color="primary"
                          />
                        }
                        label={service.status === 'available' ? 'Actif' : 'En pause'}
                      />
                      
                      <Box>
                        <IconButton
                          onClick={() => navigate(`/services/${service.id}`)}
                          color="primary"
                          title="Voir les détails"
                        >
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDeleteService(service.id)}
                          color="error"
                          title="Supprimer"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Dialog de création */}
        <Dialog 
          open={createDialogOpen} 
          onClose={() => setCreateDialogOpen(false)} 
          maxWidth="md" 
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center">
              <AddIcon sx={{ mr: 1 }} />
              Créer un nouveau service
            </Box>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {/* Informations de base */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Informations générales
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Titre du service"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                  placeholder="Ex: Garde d'animaux, Courses, Ménage..."
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  required
                  placeholder="Décrivez votre service en détail..."
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Type de service</InputLabel>
                  <Select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    label="Type de service"
                  >
                    {Object.entries(SERVICE_TYPES).map(([value, label]) => (
                      <MenuItem key={value} value={value}>{label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Période de disponibilité */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Période de disponibilité
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Date de début"
                  type="datetime-local"
                  value={formData.date_start}
                  onChange={(e) => setFormData(prev => ({ ...prev, date_start: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Date de fin"
                  type="datetime-local"
                  value={formData.date_end}
                  onChange={(e) => setFormData(prev => ({ ...prev, date_end: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* Jours disponibles */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Jours disponibles
                </Typography>
                <FormGroup row>
                  {DAYS_OF_WEEK.map((day) => (
                    <FormControlLabel
                      key={day.key}
                      control={
                        <Checkbox
                          checked={formData.days.includes(day.key)}
                          onChange={() => toggleDay(day.key)}
                        />
                      }
                      label={day.label}
                    />
                  ))}
                </FormGroup>
              </Grid>

              {/* Créneaux horaires */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Créneaux horaires
                </Typography>
                
                {/* Créneaux prédéfinis */}
                <Typography variant="subtitle2" gutterBottom>
                  Créneaux rapides :
                </Typography>
                <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {PREDEFINED_TIME_SLOTS.map((slot, index) => (
                    <Chip
                      key={index}
                      label={slot.label}
                      onClick={() => addPredefinedTimeSlot(slot)}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                  ))}
                </Box>

                {/* Créneau personnalisé */}
                <Typography variant="subtitle2" gutterBottom>
                  Ou créer un créneau personnalisé :
                </Typography>
                <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      type="time"
                      label="Début"
                      value={newTimeSlot.start}
                      onChange={(e) => setNewTimeSlot(prev => ({ ...prev, start: e.target.value }))}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      type="time"
                      label="Fin"
                      value={newTimeSlot.end}
                      onChange={(e) => setNewTimeSlot(prev => ({ ...prev, end: e.target.value }))}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Button
                      variant="outlined"
                      onClick={addTimeSlot}
                      startIcon={<AddIcon />}
                      fullWidth
                    >
                      Ajouter
                    </Button>
                  </Grid>
                </Grid>

                {/* Liste des créneaux ajoutés */}
                {formData.timeSlots.length > 0 && (
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Créneaux ajoutés :
                    </Typography>
                    <List dense>
                      {formData.timeSlots.map((slot, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <TimeIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText 
                            primary={`${slot.start} - ${slot.end}`}
                          />
                          <ListItemSecondaryAction>
                            <IconButton
                              edge="end"
                              onClick={() => removeTimeSlot(index)}
                              color="error"
                              size="small"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                )}
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => { setCreateDialogOpen(false); resetForm(); }}>
              Annuler
            </Button>
            <Button 
              onClick={handleCreateService} 
              variant="contained" 
              color="primary"
              startIcon={<AddIcon />}
            >
              Créer le service
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar pour les notifications */}
        <Snackbar
          open={alert.open}
          autoHideDuration={6000}
          onClose={() => setAlert(prev => ({ ...prev, open: false }))}
        >
          <Alert severity={alert.severity} onClose={() => setAlert(prev => ({ ...prev, open: false }))}>
            {alert.message}
          </Alert>
        </Snackbar>
      </Container>
    </LocalizationProvider>
  );
};

export default MyServices;
