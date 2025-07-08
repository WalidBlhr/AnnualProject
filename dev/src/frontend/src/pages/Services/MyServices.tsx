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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Service, SERVICE_TYPES, SERVICE_STATUS, DAY_LABELS } from '../../types/Service';
import jwtDecode from 'jwt-decode';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import { API_URL } from '../../const';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  CalendarToday as CalendarIcon,
  Work as WorkIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';

interface TimeSlot {
  start: string;
  end: string;
}

interface ExtendedService extends Service {
  bookingCount?: number;
  lastBooking?: string;
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

const MyServices: React.FC = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<ExtendedService[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ExtendedService | null>(null);
  const [alert, setAlert] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });
  
  const [newService, setNewService] = useState({
    title: '',
    description: '',
    type: 'other' as const,
    date_start: new Date().toISOString().slice(0, 16),
    date_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    availability: {
      days: [] as string[],
      time_slots: [] as TimeSlot[],
    },
  });

  const [tempTimeSlot, setTempTimeSlot] = useState<TimeSlot>({
    start: '09:00',
    end: '17:00',
  });

  const showAlert = useCallback((message: string, severity: 'success' | 'error') => {
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
      
      // Récupérer tous les services puis filtrer côté client
      const { data } = await axios.get(API_URL + '/services?limit=1000', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (data && typeof data === 'object' && 'data' in data) {
        // Filtrer les services où l'utilisateur est le provider
        const myServices = (data as any).data.filter((service: Service) => 
          service.provider && service.provider.id === decoded.userId
        );
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

  const handleCreateService = async () => {
    try {
      // Validation
      if (!newService.title.trim()) {
        showAlert('Le titre est requis', 'error');
        return;
      }
      if (!newService.description.trim()) {
        showAlert('La description est requise', 'error');
        return;
      }
      if (newService.availability.days.length === 0) {
        showAlert('Veuillez sélectionner au moins un jour', 'error');
        return;
      }
      if (newService.availability.time_slots.length === 0) {
        showAlert('Veuillez ajouter au moins un créneau horaire', 'error');
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const serviceData = {
        title: newService.title.trim(),
        description: newService.description.trim(),
        type: newService.type,
        date_start: new Date(newService.date_start).toISOString(),
        date_end: new Date(newService.date_end).toISOString(),
        availability: {
          days: newService.availability.days,
          time_slots: newService.availability.time_slots
        }
      };

      console.log('Sending service data:', serviceData); // Pour déboguer

      await axios.post(
        API_URL + '/services',
        serviceData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setCreateDialogOpen(false);
      resetNewService();
      fetchMyServices();
      showAlert('Service créé avec succès', 'success');
    } catch (error) {
      console.error('Error creating service:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        showAlert(`Erreur lors de la création du service: ${error.response.data.message || error.message}`, 'error');
      } else {
        showAlert('Erreur lors de la création du service', 'error');
      }
    }
  };

  const handleUpdateService = async () => {
    try {
      if (!selectedService) return;

      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const serviceData = {
        title: selectedService.title,
        description: selectedService.description,
        type: selectedService.type,
        date_start: selectedService.date_start,
        date_end: selectedService.date_end,
        availability: {
          days: selectedService.availability.days,
          time_slots: selectedService.availability.timeSlots || []  // Convertir timeSlots en time_slots
        },
        status: selectedService.status,
      };

      await axios.put(
        API_URL + `/services/${selectedService.id}`,
        serviceData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setEditDialogOpen(false);
      setSelectedService(null);
      fetchMyServices();
      showAlert('Service mis à jour avec succès', 'success');
    } catch (error) {
      console.error('Error updating service:', error);
      showAlert('Erreur lors de la mise à jour du service', 'error');
    }
  };

  const handleDeleteService = async (serviceId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      if (window.confirm('Êtes-vous sûr de vouloir supprimer ce service ?')) {
        await axios.delete(
          API_URL + `/services/${serviceId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        fetchMyServices();
        showAlert('Service supprimé avec succès', 'success');
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      showAlert('Erreur lors de la suppression du service', 'error');
    }
  };

  const handleToggleServiceStatus = async (serviceId: number, currentStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const newStatus = currentStatus === 'available' ? 'paused' : 'available';
      
      await axios.put(
        API_URL + `/services/${serviceId}`,
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
    if (tempTimeSlot.start >= tempTimeSlot.end) {
      showAlert('L\'heure de début doit être antérieure à l\'heure de fin', 'error');
      return;
    }

    const newTimeSlots = [...newService.availability.time_slots, { ...tempTimeSlot }];
    setNewService({
      ...newService,
      availability: {
        ...newService.availability,
        time_slots: newTimeSlots
      }
    });
    setTempTimeSlot({ start: '09:00', end: '17:00' });
  };

  const removeTimeSlot = (index: number) => {
    const newTimeSlots = newService.availability.time_slots.filter((_, i) => i !== index);
    setNewService({
      ...newService,
      availability: {
        ...newService.availability,
        time_slots: newTimeSlots
      }
    });
  };

  const resetNewService = () => {
    setNewService({
      title: '',
      description: '',
      type: 'other' as const,
      date_start: new Date().toISOString().slice(0, 16),
      date_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      availability: {
        days: [],
        time_slots: [],
      },
    });
    setTempTimeSlot({ start: '09:00', end: '17:00' });
  };

  const openEditDialog = (service: ExtendedService) => {
    setSelectedService({ ...service });
    setEditDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'success';
      case 'booked':
        return 'warning';
      case 'completed':
        return 'info';
      case 'paused':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatTimeSlots = (timeSlots: TimeSlot[]) => {
    return timeSlots.map(slot => `${slot.start} - ${slot.end}`).join(', ');
  };

  const formatDays = (days: string[]) => {
    return days.map(day => DAY_LABELS[day as keyof typeof DAY_LABELS] || day).join(', ');
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" align="center">
          Chargement...
        </Typography>
      </Container>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" component="h1">
            <WorkIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
            Mes Services
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Nouveau Service
          </Button>
        </Box>

        {services.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Vous n'avez encore créé aucun service
            </Typography>
            <Typography variant="body1" color="textSecondary" paragraph>
              Créez votre premier service pour commencer à proposer vos services à la communauté.
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Créer mon premier service
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {services.map((service) => (
              <Grid item xs={12} md={6} key={service.id}>
                <Card elevation={3}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                      <Typography variant="h6" component="h2" sx={{ flexGrow: 1 }}>
                        {service.title}
                      </Typography>
                      <Box>
                        <Chip 
                          label={SERVICE_STATUS[service.status]}
                          color={getStatusColor(service.status)}
                          size="small"
                        />
                      </Box>
                    </Box>
                    
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {SERVICE_TYPES[service.type]}
                    </Typography>
                    
                    <Typography variant="body2" paragraph>
                      {service.description}
                    </Typography>

                    <Accordion sx={{ mb: 2 }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle2">
                          <CalendarIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: 16 }} />
                          Disponibilités
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box>
                          <Typography variant="body2" gutterBottom>
                            <strong>Jours:</strong> {formatDays(service.availability.days)}
                          </Typography>
                          <Typography variant="body2" gutterBottom>
                            <strong>Horaires:</strong> {formatTimeSlots((service.availability as any).time_slots || service.availability.timeSlots || [])}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Du {new Date(service.date_start).toLocaleDateString()} au {new Date(service.date_end).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </AccordionDetails>
                    </Accordion>

                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <FormControlLabel
                        control={
                          <Switch
                            checked={service.status === 'available'}
                            onChange={() => handleToggleServiceStatus(service.id, service.status)}
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
                          onClick={() => openEditDialog(service)}
                          color="primary"
                          title="Modifier"
                        >
                          <EditIcon />
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
        <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Créer un nouveau service</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Titre"
                  value={newService.title}
                  onChange={(e) => setNewService({ ...newService, title: e.target.value })}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={newService.description}
                  onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Type de service *</InputLabel>
                  <Select
                    value={newService.type}
                    onChange={(e) => setNewService({ ...newService, type: e.target.value as any })}
                    label="Type de service"
                    required
                  >
                    {Object.entries(SERVICE_TYPES).map(([value, label]) => (
                      <MenuItem key={value} value={value}>{label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Date de début"
                  required
                  type="datetime-local"
                  value={newService.date_start}
                  onChange={(e) => setNewService({ ...newService, date_start: e.target.value })}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Date de fin"
                  required
                  type="datetime-local"
                  value={newService.date_end}
                  onChange={(e) => setNewService({ ...newService, date_end: e.target.value })}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Jours disponibles *
                </Typography>
                <FormGroup row>
                  {DAYS_OF_WEEK.map((day) => (
                    <FormControlLabel
                      key={day.key}
                      control={
                        <Checkbox
                          checked={newService.availability.days.includes(day.key)}
                          onChange={(e) => {
                            const days = e.target.checked
                              ? [...newService.availability.days, day.key]
                              : newService.availability.days.filter(d => d !== day.key);
                            setNewService({
                              ...newService,
                              availability: { ...newService.availability, days }
                            });
                          }}
                        />
                      }
                      label={day.label}
                    />
                  ))}
                </FormGroup>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Créneaux horaires *
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        type="time"
                        label="Début"
                        value={tempTimeSlot.start}
                        onChange={(e) => setTempTimeSlot({ ...tempTimeSlot, start: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        type="time"
                        label="Fin"
                        value={tempTimeSlot.end}
                        onChange={(e) => setTempTimeSlot({ ...tempTimeSlot, end: e.target.value })}
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
                </Box>

                {newService.availability.time_slots.length > 0 && (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Début</TableCell>
                          <TableCell>Fin</TableCell>
                          <TableCell width="60">Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {newService.availability.time_slots.map((slot, index) => (
                          <TableRow key={index}>
                            <TableCell>{slot.start}</TableCell>
                            <TableCell>{slot.end}</TableCell>
                            <TableCell>
                              <IconButton
                                size="small"
                                onClick={() => removeTimeSlot(index)}
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setCreateDialogOpen(false); resetNewService(); }}>
              Annuler
            </Button>
            <Button onClick={handleCreateService} variant="contained" color="primary">
              Créer
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog d'édition */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Modifier le service</DialogTitle>
          <DialogContent>
            {selectedService && (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Titre"
                    value={selectedService.title}
                    onChange={(e) => setSelectedService({ ...selectedService, title: e.target.value })}
                    required
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Description"
                    value={selectedService.description}
                    onChange={(e) => setSelectedService({ ...selectedService, description: e.target.value })}
                    required
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Type de service</InputLabel>
                    <Select
                      value={selectedService.type}
                      onChange={(e) => setSelectedService({ ...selectedService, type: e.target.value as any })}
                      label="Type de service"
                    >
                      {Object.entries(SERVICE_TYPES).map(([value, label]) => (
                        <MenuItem key={value} value={value}>{label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Date de début"
                    type="datetime-local"
                    value={typeof selectedService.date_start === 'string' ? selectedService.date_start.slice(0, 16) : new Date(selectedService.date_start).toISOString().slice(0, 16)}
                    onChange={(e) => setSelectedService({ ...selectedService, date_start: e.target.value })}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Date de fin"
                    type="datetime-local"
                    value={typeof selectedService.date_end === 'string' ? selectedService.date_end.slice(0, 16) : new Date(selectedService.date_end).toISOString().slice(0, 16)}
                    onChange={(e) => setSelectedService({ ...selectedService, date_end: e.target.value })}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Jours disponibles
                  </Typography>
                  <FormGroup row>
                    {DAYS_OF_WEEK.map((day) => (
                      <FormControlLabel
                        key={day.key}
                        control={
                          <Checkbox
                            checked={selectedService.availability.days.includes(day.key as any)}
                            onChange={(e) => {
                              const days = e.target.checked
                                ? [...selectedService.availability.days, day.key as any]
                                : selectedService.availability.days.filter(d => d !== day.key);
                              setSelectedService({
                                ...selectedService,
                                availability: { ...selectedService.availability, days }
                              });
                            }}
                          />
                        }
                        label={day.label}
                      />
                    ))}
                  </FormGroup>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Créneaux horaires
                  </Typography>
                  {((selectedService.availability as any).time_slots || selectedService.availability.timeSlots || []).length > 0 && (
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Début</TableCell>
                            <TableCell>Fin</TableCell>
                            <TableCell width="60">Action</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {((selectedService.availability as any).time_slots || selectedService.availability.timeSlots || []).map((slot: TimeSlot, index: number) => (
                            <TableRow key={index}>
                              <TableCell>{slot.start}</TableCell>
                              <TableCell>{slot.end}</TableCell>
                              <TableCell>
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    const currentSlots = (selectedService.availability as any).time_slots || selectedService.availability.timeSlots || [];
                                    const newTimeSlots = currentSlots.filter((_: TimeSlot, i: number) => i !== index);
                                    setSelectedService({
                                      ...selectedService,
                                      availability: {
                                        ...selectedService.availability,
                                        timeSlots: newTimeSlots,
                                        time_slots: newTimeSlots  // Garder les deux formats
                                      } as any
                                    });
                                  }}
                                  color="error"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setEditDialogOpen(false); setSelectedService(null); }}>
              Annuler
            </Button>
            <Button onClick={handleUpdateService} variant="contained" color="primary">
              Sauvegarder
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
      </Container>
    </LocalizationProvider>
  );
};

export default MyServices;
