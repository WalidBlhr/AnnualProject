import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Paper,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  ListItemSecondaryAction,
  IconButton,
  Tooltip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import axios from 'axios';
import jwtDecode from 'jwt-decode';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import { useNavigate } from 'react-router-dom';

// Types
interface User {
  id: number;
  firstname: string;
  lastname: string;
}

interface Absence {
  id: number;
  user: User;
  start_date: string;
  end_date: string;
  notes: string;
  status: string;
  trusted_contacts: User[];
}

interface AbsencesResponse {
  data: Absence[];
  page_size: number;
  page: number;
  total_count: number;
  total_pages: number;
}

const statusColors: Record<string, string> = {
  'pending': 'warning',
  'accepted': 'success',
  'completed': 'info',
  'canceled': 'error'
};

const statusLabels: Record<string, string> = {
  'pending': 'En attente',
  'accepted': 'Acceptée',
  'completed': 'Terminée',
  'canceled': 'Annulée'
};

const Absences: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [myAbsences, setMyAbsences] = useState<Absence[]>([]);
  const [requestedAbsences, setRequestedAbsences] = useState<Absence[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAbsence, setEditingAbsence] = useState<Absence | null>(null);
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs());
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs().add(1, 'day'));
  const [notes, setNotes] = useState('');
  const [alert, setAlert] = useState<{
    open: boolean,
    message: string,
    severity: 'success' | 'error'
  }>({ open: false, message: '', severity: 'success' });
  const [userId, setUserId] = useState<number | null>(null);
  const [trustedContacts, setTrustedContacts] = useState<User[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [selectedNewContact, setSelectedNewContact] = useState<number>(0);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const decoded = jwtDecode<{ userId: number }>(token);
    setUserId(decoded.userId);

    fetchMyAbsences();
    fetchRequestedAbsences();
    fetchTrustedContacts(decoded.userId);
    fetchAvailableUsers();
  }, []);

  const fetchMyAbsences = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const decoded = jwtDecode<{ userId: number }>(token);
      const response = await axios.get<AbsencesResponse>(
        `http://localhost:3000/absences?userId=${decoded.userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMyAbsences(response.data.data);
    } catch (error) {
      showAlert('Erreur lors du chargement de vos absences', 'error');
    }
  };

  const fetchRequestedAbsences = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const decoded = jwtDecode<{ userId: number }>(token);
      
      // Récupérer toutes les absences
      const response = await axios.get<AbsencesResponse>(
        'http://localhost:3000/absences',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      // Filtrer pour ne garder que celles où l'utilisateur est un contact de confiance
      const requested = response.data.data.filter(absence => 
        absence.trusted_contacts.some(contact => contact.id === decoded.userId) && 
        absence.user.id !== decoded.userId
      );
      
      setRequestedAbsences(requested);
    } catch (error) {
      showAlert('Erreur lors du chargement des demandes de surveillance', 'error');
    }
  };

  const fetchTrustedContacts = async (userId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get<User[]>(
        `http://localhost:3000/users/${userId}/trusted-contacts`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setTrustedContacts(response.data);
    } catch (error) {
      showAlert('Erreur lors du chargement de vos contacts de confiance', 'error');
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(
        'http://localhost:3000/users',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      // Exclure l'utilisateur courant
      const decoded = jwtDecode<{ userId: number }>(token);
      const filteredUsers = response.data.data.filter((user: User) => user.id !== decoded.userId);
      setAvailableUsers(filteredUsers);
    } catch (error) {
      showAlert('Erreur lors du chargement des utilisateurs', 'error');
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOpenDialog = (absence?: Absence) => {
    if (absence) {
      setEditingAbsence(absence);
      setStartDate(dayjs(absence.start_date));
      setEndDate(dayjs(absence.end_date));
      setNotes(absence.notes);
      setSelectedContacts(absence.trusted_contacts.map(contact => contact.id));
    } else {
      setEditingAbsence(null);
      setStartDate(dayjs());
      setEndDate(dayjs().add(1, 'day'));
      setNotes('');
      setSelectedContacts([]);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleCreateOrUpdateAbsence = async () => {
    if (!startDate || !endDate || !userId) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const absenceData = {
        start_date: startDate.format('YYYY-MM-DD'),
        end_date: endDate.format('YYYY-MM-DD'),
        notes,
        trusted_contact_ids: selectedContacts
      };
      
      if (editingAbsence) {
        // Update existing absence
        await axios.put(
          `http://localhost:3000/absences/${editingAbsence.id}`,
          absenceData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        showAlert('Absence mise à jour avec succès', 'success');
      } else {
        // Create new absence
        await axios.post(
          'http://localhost:3000/absences',
          absenceData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        showAlert('Absence déclarée avec succès', 'success');
      }
      
      setOpenDialog(false);
      fetchMyAbsences();
    } catch (error) {
      showAlert('Erreur lors de l\'enregistrement de l\'absence', 'error');
    }
  };

  const handleDeleteAbsence = async (id: number) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette absence ?")) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await axios.delete(
        `http://localhost:3000/absences/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      showAlert('Absence supprimée avec succès', 'success');
      fetchMyAbsences();
    } catch (error) {
      showAlert('Erreur lors de la suppression de l\'absence', 'error');
    }
  };

  const handleAbsenceStatusChange = async (absenceId: number, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await axios.put(
        `http://localhost:3000/absences/${absenceId}`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      showAlert(`Demande ${newStatus === 'accepted' ? 'acceptée' : 'refusée'}`, 'success');
      fetchRequestedAbsences();
    } catch (error) {
      showAlert('Erreur lors du changement de statut', 'error');
    }
  };

  const handleAddContact = async () => {
    if (!selectedNewContact || !userId) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await axios.post(
        'http://localhost:3000/trusted-contacts',
        {
          userId,
          trustedUserId: selectedNewContact
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      showAlert('Contact de confiance ajouté avec succès', 'success');
      setIsAddingContact(false);
      setSelectedNewContact(0);
      fetchTrustedContacts(userId);
    } catch (error) {
      showAlert('Erreur lors de l\'ajout du contact de confiance', 'error');
    }
  };

  const handleRemoveContact = async (trustedUserId: number) => {
    if (!userId) return;
    if (!window.confirm("Êtes-vous sûr de vouloir retirer ce contact de confiance ?")) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await axios.delete(
        `http://localhost:3000/trusted-contacts/${userId}/${trustedUserId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      showAlert('Contact de confiance supprimé avec succès', 'success');
      fetchTrustedContacts(userId);
    } catch (error) {
      showAlert('Erreur lors de la suppression du contact de confiance', 'error');
    }
  };

  const handleContactSelectionChange = (event: SelectChangeEvent<number[]>) => {
    setSelectedContacts(event.target.value as number[]);
  };

  const handleNewContactChange = (event: SelectChangeEvent) => {
    setSelectedNewContact(Number(event.target.value));
  };

  const showAlert = (message: string, severity: 'success' | 'error') => {
    setAlert({ open: true, message, severity });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  // Filtrer les utilisateurs qui ne sont pas déjà des contacts de confiance
  const availableNewContacts = availableUsers.filter(
    user => !trustedContacts.some(contact => contact.id === user.id)
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Gestion des absences
      </Typography>
      
      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Mes absences" />
        <Tab label="Demandes de surveillance" />
        <Tab label="Contacts de confiance" />
      </Tabs>
      
      {/* Tab 1: Mes absences */}
      {tabValue === 0 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h5">Mes déclarations d'absence</Typography>
            <Button 
              variant="contained" 
              onClick={() => handleOpenDialog()}
              startIcon={<AddIcon />}
            >
              Déclarer une absence
            </Button>
          </Box>
          
          {myAbsences.length === 0 ? (
            <Typography variant="body1">Aucune absence déclarée.</Typography>
          ) : (
            <Grid container spacing={3}>
              {myAbsences.map((absence) => (
                <Grid item xs={12} md={6} key={absence.id}>
                  <Paper sx={{ p: 2, position: 'relative' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="h6">
                        Du {formatDate(absence.start_date)} au {formatDate(absence.end_date)}
                      </Typography>
                      <Chip 
                        label={statusLabels[absence.status] || absence.status} 
                        color={statusColors[absence.status] as any || 'default'}
                        size="small"
                      />
                    </Box>
                    
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      {absence.notes || "Aucune note"}
                    </Typography>
                    
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2">
                        Contacts de confiance ({absence.trusted_contacts.length}):
                      </Typography>
                      {absence.trusted_contacts.length > 0 ? (
                        <List dense>
                          {absence.trusted_contacts.map((contact) => (
                            <ListItem key={contact.id} disableGutters>
                              <ListItemText 
                                primary={`${contact.firstname} ${contact.lastname}`}
                              />
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Aucun contact de confiance sélectionné
                        </Typography>
                      )}
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                      {/* Possible d'éditer seulement si en attente ou acceptée */}
                      {['pending', 'accepted'].includes(absence.status) && (
                        <>
                          <IconButton onClick={() => handleOpenDialog(absence)} color="primary">
                            <Tooltip title="Modifier">
                              <EditIcon />
                            </Tooltip>
                          </IconButton>
                          <IconButton onClick={() => handleDeleteAbsence(absence.id)} color="error">
                            <Tooltip title="Supprimer">
                              <DeleteIcon />
                            </Tooltip>
                          </IconButton>
                        </>
                      )}
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}
      
      {/* Tab 2: Demandes de surveillance */}
      {tabValue === 1 && (
        <Box>
          <Typography variant="h5" gutterBottom>
            Demandes de surveillance
          </Typography>
          
          {requestedAbsences.length === 0 ? (
            <Typography variant="body1">Aucune demande de surveillance en attente.</Typography>
          ) : (
            <Grid container spacing={3}>
              {requestedAbsences.map((absence) => (
                <Grid item xs={12} md={6} key={absence.id}>
                  <Paper sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6">
                        Demande de {absence.user.firstname} {absence.user.lastname}
                      </Typography>
                      <Chip 
                        label={statusLabels[absence.status] || absence.status} 
                        color={statusColors[absence.status] as any || 'default'}
                        size="small"
                      />
                    </Box>
                    
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      Du {formatDate(absence.start_date)} au {formatDate(absence.end_date)}
                    </Typography>
                    
                    <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                      {absence.notes || "Aucune note"}
                    </Typography>
                    
                    {absence.status === 'pending' && (
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                        <Button 
                          startIcon={<CheckCircleIcon />}
                          variant="contained" 
                          color="success"
                          onClick={() => handleAbsenceStatusChange(absence.id, 'accepted')}
                          sx={{ mr: 1 }}
                        >
                          Accepter
                        </Button>
                        <Button 
                          startIcon={<CancelIcon />}
                          variant="outlined" 
                          color="error"
                          onClick={() => handleAbsenceStatusChange(absence.id, 'canceled')}
                        >
                          Refuser
                        </Button>
                      </Box>
                    )}
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}
      
      {/* Tab 3: Contacts de confiance */}
      {tabValue === 2 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h5">Mes contacts de confiance</Typography>
            <Button 
              variant="contained" 
              onClick={() => setIsAddingContact(true)}
              startIcon={<AddIcon />}
              disabled={isAddingContact || availableNewContacts.length === 0}
            >
              Ajouter un contact
            </Button>
          </Box>
          
          {isAddingContact && (
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Ajouter un contact de confiance
              </Typography>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="new-contact-label">Sélectionner un utilisateur</InputLabel>
                <Select
                  labelId="new-contact-label"
                  value={selectedNewContact.toString()}
                  onChange={handleNewContactChange}
                  label="Sélectionner un utilisateur"
                >
                  <MenuItem value={0} disabled>Choisir un utilisateur</MenuItem>
                  {availableNewContacts.map((user) => (
                    <MenuItem value={user.id} key={user.id}>
                      {user.firstname} {user.lastname}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  onClick={() => setIsAddingContact(false)} 
                  sx={{ mr: 1 }}
                >
                  Annuler
                </Button>
                <Button 
                  variant="contained" 
                  onClick={handleAddContact}
                  disabled={!selectedNewContact}
                >
                  Ajouter
                </Button>
              </Box>
            </Paper>
          )}
          
          {trustedContacts.length === 0 ? (
            <Typography variant="body1">
              Vous n'avez pas encore ajouté de contacts de confiance.
            </Typography>
          ) : (
            <Paper>
              <List>
                {trustedContacts.map((contact) => (
                  <React.Fragment key={contact.id}>
                    <ListItem>
                      <ListItemText 
                        primary={`${contact.firstname} ${contact.lastname}`} 
                      />
                      <ListItemSecondaryAction>
                        <IconButton 
                          edge="end" 
                          color="error" 
                          onClick={() => handleRemoveContact(contact.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          )}
        </Box>
      )}
      
      {/* Dialog pour créer/modifier une absence */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingAbsence ? 'Modifier l\'absence' : 'Déclarer une absence'}
        </DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <DatePicker
                label="Date de début"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
              />
              
              <DatePicker
                label="Date de fin"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                minDate={startDate || undefined}
              />
              
              <TextField
                label="Notes (optionnel)"
                multiline
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Instructions particulières, clés à récupérer, etc."
              />
              
              <FormControl fullWidth>
                <InputLabel id="contacts-label">Contacts de confiance</InputLabel>
                <Select
                  labelId="contacts-label"
                  multiple
                  value={selectedContacts}
                  onChange={handleContactSelectionChange}
                  label="Contacts de confiance"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => {
                        const contact = trustedContacts.find(c => c.id === value);
                        return contact ? (
                          <Chip key={value} label={`${contact.firstname} ${contact.lastname}`} />
                        ) : null;
                      })}
                    </Box>
                  )}
                >
                  {trustedContacts.map((contact) => (
                    <MenuItem value={contact.id} key={contact.id}>
                      {contact.firstname} {contact.lastname}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              {trustedContacts.length === 0 && (
                <Alert severity="info">
                  Vous n'avez pas encore de contacts de confiance. 
                  Vous pouvez en ajouter dans l'onglet "Contacts de confiance".
                </Alert>
              )}
            </Box>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button 
            onClick={handleCreateOrUpdateAbsence} 
            variant="contained" 
            disabled={!startDate || !endDate || startDate.isAfter(endDate)}
          >
            {editingAbsence ? 'Mettre à jour' : 'Déclarer'}
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
  );
};

export default Absences;