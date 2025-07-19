import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import {
    Alert,
    Box,
    Button,
    Checkbox,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    FormGroup,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Snackbar,
    Table, TableBody, TableCell, TableContainer, TableHead,
    TablePagination,
    TableRow,
    TextField,
    Typography
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { API_URL } from '../../const';
import { SERVICE_TYPES } from '../../types/Service';
import AdminSearchAndSort, { SortOption } from '../../components/AdminSearchAndSort';
import { useAdminSearchAndSort } from '../../hooks/useAdminSearchAndSort';

interface TimeSlot {
  start: string;
  end: string;
}

interface Service {
  id: number;
  title: string;
  description: string;
  type: string;
  status: string;
  provider: {
    id: number;
    firstname: string;
    lastname: string;
  };
  date_start: string;
  date_end: string;
  availability?: {
    days: string[];
    time_slots: TimeSlot[];
  };
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

const AdminServices: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [totalServices, setTotalServices] = useState<number>(0);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    type: '',
    status: ''
  });
  const [alert, setAlert] = useState<{ open: boolean; message: string; severity: 'success' | 'error'; }>({ open: false, message: '', severity: 'success' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  // Options de tri pour les services
  const sortOptions: SortOption[] = [
    { value: 'id', label: 'ID' },
    { value: 'title', label: 'Titre' },
    { value: 'type', label: 'Type' },
    { value: 'status', label: 'Statut' },
    { value: 'date_start', label: 'Date de début' },
  ];

  // Hook pour la recherche et le tri
  const {
    searchValue,
    sortConfig,
    filteredAndSortedData,
    handleSearchChange,
    handleSearchClear,
    handleSortChange,
  } = useAdminSearchAndSort({
    data: services,
    searchFields: ['title', 'description', 'type'],
    defaultSortField: 'id'
  });

  // Pagination sur les données filtrées et triées
  const paginatedServices = filteredAndSortedData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  useEffect(() => {
    fetchServices();
  }, [page, rowsPerPage, filterStatus, filterType]);

  // Remettre la page à 0 quand on change la recherche
  useEffect(() => {
    setPage(0);
  }, [searchValue]);

  const fetchServices = async () => {
    try {
      let url = `${API_URL}/services?page=${page + 1}&limit=${rowsPerPage}`;
      if (filterStatus !== 'all') url += `&status=${filterStatus}`;
      if (filterType !== 'all') url += `&type=${filterType}`;
      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setServices(data.data);
      setTotalServices(data.total_count);
    } catch (error) {
      showAlert('Erreur lors du chargement des services', 'error');
    }
  };

  const handleEditClick = (service: Service) => {
    // Convertir les labels français en clés anglaises pour l'édition
    const englishDays = service.availability?.days?.map((dayLabel: string) => {
      const dayObj = DAYS_OF_WEEK.find(d => d.label === dayLabel);
      return dayObj ? dayObj.key : dayLabel;
    }) || [];

    setSelectedService({
      ...service,
      availability: {
        days: englishDays,
        time_slots: service.availability?.time_slots || []
      }
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedService) return;
    try {
      // Validation des données
      if (!selectedService.title.trim()) {
        showAlert('Le titre est requis', 'error');
        return;
      }
      if (!selectedService.description.trim()) {
        showAlert('La description est requise', 'error');
        return;
      }

      // Convertir les clés anglaises en labels français pour le backend
      const frenchDays = selectedService.availability?.days?.map((dayKey: string) => {
        const dayObj = DAYS_OF_WEEK.find(d => d.key === dayKey);
        return dayObj ? dayObj.label : dayKey;
      }) || [];

      const serviceData = {
        title: selectedService.title,
        description: selectedService.description,
        type: selectedService.type,
        date_start: selectedService.date_start,
        date_end: selectedService.date_end,
        availability: {
          days: frenchDays,
          time_slots: selectedService.availability?.time_slots || []
        },
        status: selectedService.status,
      };

      await axios.put(`${API_URL}/services/${selectedService.id}`, serviceData, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      // Mettre à jour l'état local immédiatement
      setServices(prevServices => 
        prevServices.map(service => 
          service.id === selectedService.id 
            ? { ...service, ...serviceData, availability: { days: frenchDays, time_slots: selectedService.availability?.time_slots || [] } } 
            : service
        )
      );

      setEditDialogOpen(false);
      setSelectedService(null);
      showAlert('Service modifié avec succès', 'success');
    } catch (error) {
      console.error('Error updating service:', error);
      showAlert('Erreur lors de la modification', 'error');
    }
  };

  const handleDeleteService = async (serviceId: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce service ?')) return;
    try {
      await axios.delete(`${API_URL}/services/${serviceId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      showAlert('Service supprimé avec succès', 'success');
      fetchServices();
    } catch (error) {
      showAlert('Erreur lors de la suppression', 'error');
    }
  };

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  const showAlert = (message: string, severity: 'success' | 'error') => setAlert({ open: true, message, severity });

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>Gestion des Services</Typography>
      
      <AdminSearchAndSort
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        onSearchClear={handleSearchClear}
        sortConfig={sortConfig}
        onSortChange={handleSortChange}
        sortOptions={sortOptions}
        placeholder="Rechercher par titre, description ou type..."
      />

      <Paper sx={{ mb: 2, p: 2 }}>
        <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} sx={{ mr: 2 }}>
          <MenuItem value="all">Tous statuts</MenuItem>
          <MenuItem value="available">Disponible</MenuItem>
          <MenuItem value="booked">Réservé</MenuItem>
          <MenuItem value="completed">Terminé</MenuItem>
        </Select>
        <Select value={filterType} onChange={e => setFilterType(e.target.value)}>
          <MenuItem value="all">Tous types</MenuItem>
          <MenuItem value="help">Aide</MenuItem>
          <MenuItem value="other">Autre</MenuItem>
        </Select>
      </Paper>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Titre</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Prestataire</TableCell>
              <TableCell>Date début</TableCell>
              <TableCell>Date fin</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedServices.map((service) => (
              <TableRow key={service.id}>
                <TableCell>{service.id}</TableCell>
                <TableCell>{service.title}</TableCell>
                <TableCell>{service.description}</TableCell>
                <TableCell>{service.type}</TableCell>
                <TableCell>{service.status}</TableCell>
                <TableCell>{service.provider ? `${service.provider.firstname} ${service.provider.lastname}` : 'N/A'}</TableCell>
                <TableCell>{new Date(service.date_start).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(service.date_end).toLocaleDateString()}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEditClick(service)}><EditIcon /></IconButton>
                  <IconButton onClick={() => handleDeleteService(service.id)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredAndSortedData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
      
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
                          checked={selectedService.availability?.days?.includes(day.key as any) || false}
                          onChange={(e) => {
                            const currentDays = selectedService.availability?.days || [];
                            const days = e.target.checked
                              ? [...currentDays, day.key as any]
                              : currentDays.filter(d => d !== day.key);
                            setSelectedService({
                              ...selectedService,
                              availability: { 
                                ...selectedService.availability,
                                days,
                                time_slots: selectedService.availability?.time_slots || []
                              }
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
                {(selectedService.availability?.time_slots || []).length > 0 && (
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
                        {(selectedService.availability?.time_slots || []).map((slot: TimeSlot, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{slot.start}</TableCell>
                            <TableCell>{slot.end}</TableCell>
                            <TableCell>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  const currentSlots = selectedService.availability?.time_slots || [];
                                  const newTimeSlots = currentSlots.filter((_: TimeSlot, i: number) => i !== index);
                                  setSelectedService({
                                    ...selectedService,
                                    availability: {
                                      ...selectedService.availability,
                                      days: selectedService.availability?.days || [],
                                      time_slots: newTimeSlots
                                    }
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
          <Button onClick={handleEditSubmit} variant="contained" color="primary">
            Sauvegarder
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar open={alert.open} autoHideDuration={6000} onClose={() => setAlert({ ...alert, open: false })}>
        <Alert severity={alert.severity} onClose={() => setAlert({ ...alert, open: false })}>{alert.message}</Alert>
      </Snackbar>
    </Container>
    </LocalizationProvider>
  );
};

export default AdminServices; 