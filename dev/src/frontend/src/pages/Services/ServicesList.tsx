import React, { useState, useEffect } from 'react';
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
  Checkbox
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Service, SERVICE_TYPES, SERVICE_STATUS } from '../../types/Service';
import jwtDecode from 'jwt-decode';
import { TimePicker } from '@mui/x-date-pickers';
import { API_URL } from '../../const';

const DAYS_OF_WEEK = [
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
  'Dimanche',
];

const ServicesList: React.FC = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
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
    date_end: new Date().toISOString().slice(0, 16),
    availability: {
      days: [] as string[],
      time_slots: [{
        start: '09:00',
        end: '17:00',
      }],
    },
  });

  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    dateRange: {
      start: null as Date | null,
      end: null as Date | null
    }
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const { data } = await axios.get(API_URL + '/services', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      // Vérifiez que data.data existe avant de l'assigner
      if (data.data) {
        setServices(data.data);
      }
    } catch (error) {
      showAlert('Erreur lors du chargement des services', 'error');
    }
  };

  const showAlert = (message: string, severity: 'success' | 'error') => {
    setAlert({ open: true, message, severity });
  };

  const filteredServices = services.filter(service => {
    if (filters.type !== 'all' && service.type !== filters.type) return false;
    if (filters.status !== 'all' && service.status !== filters.status) return false;
    if (filters.dateRange.start && new Date(service.date_start) < filters.dateRange.start) return false;
    if (filters.dateRange.end && new Date(service.date_end) > filters.dateRange.end) return false;
    return true;
  });

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4">Services disponibles</Typography>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => navigate('/my-services')}
        >
          Mes services
        </Button>
      </Box>

      <Box mb={4}>
        <Typography variant="h6" mb={1}>Recherche</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Type de service</InputLabel>
              <Select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                label="Type de service"
              >
                <MenuItem value="all">Tous les types</MenuItem>
                {Object.entries(SERVICE_TYPES).map(([value, label]) => (
                  <MenuItem key={value} value={value}>{label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Statut</InputLabel>
              <Select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                label="Statut"
              >
                <MenuItem value="all">Tous les statuts</MenuItem>
                <MenuItem value="available">Disponible</MenuItem>
                <MenuItem value="booked">Réservé</MenuItem>
                <MenuItem value="completed">Terminé</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="datetime-local"
              label="À partir de"
              InputLabelProps={{ shrink: true }}
              onChange={(e) => setFilters({
                ...filters,
                dateRange: { ...filters.dateRange, start: e.target.value ? new Date(e.target.value) : null }
              })}
            />
          </Grid>
        </Grid>
      </Box>

      <Grid container spacing={3}>
        {filteredServices.map((service) => (
          <Grid item xs={12} md={6} lg={4} key={service.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{service.title}</Typography>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography color="textSecondary">
                    {SERVICE_TYPES[service.type]}
                  </Typography>
                  <Chip 
                    label={SERVICE_STATUS[service.status]}
                    color={service.status === 'available' ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
                <Typography variant="body2" paragraph>
                  {service.description}
                </Typography>
                <Box>
                  <Typography variant="caption" display="block">
                    Disponible : {service.availability.days.join(', ')}
                  </Typography>
                  <Typography variant="caption" display="block">
                    Du {new Date(service.date_start).toLocaleDateString()} au {new Date(service.date_end).toLocaleDateString()}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                  <Typography variant="subtitle2">
                    {service.provider
                      ? `Par ${service.provider.firstname} ${service.provider.lastname}`
                      : 'Prestataire inconnu'}
                  </Typography>
                  <Button 
                    variant="outlined"
                    size="small"
                    onClick={() => navigate(`/services/${service.id}`)}
                  >
                    Voir détails
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

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

export default ServicesList;