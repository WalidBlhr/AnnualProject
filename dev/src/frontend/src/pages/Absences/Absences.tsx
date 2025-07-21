import React, { useState, useEffect, useCallback } from 'react';
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
  Tooltip,
  Autocomplete,
  Avatar
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import axios from 'axios';
import jwtDecode from 'jwt-decode';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../const';
import { AbsenceCard } from './AbsenceCard';

// Types
interface User {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
}

interface AbsenceResponse {
  id: number;
  status: string;
  responded_at: string;
  response_notes: string;
  contact: User;
}

export interface Absence {
  id: number;
  user: User;
  start_date: string;
  end_date: string;
  notes: string;
  status: string;
  trusted_contacts: User[];
  responses: AbsenceResponse[];
}

interface AbsencesResponse {
  data: Absence[];
  page_size: number;
  page: number;
  total_count: number;
  total_pages: number;
}

interface UsersResponse {
  data: User[];
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

interface AbsenceData {
  start_date: string,
  end_date: string,
  userId?: number|null,
  notes: string,
  trusted_contact_ids: number[],
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
  const [selectedNewContact, setSelectedNewContact] = useState<User | null>(null);

  const navigate = useNavigate();

  const showAlert = useCallback((message: string, severity: 'success' | 'error') => {
    setAlert({ open: true, message, severity });
  }, []);

  const fetchMyAbsences = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const decoded = jwtDecode<{ userId: number }>(token);
      const response = await axios.get<AbsencesResponse>(
        `${API_URL}/absences?userId=${decoded.userId}`,
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
  }, [showAlert]);

  const fetchRequestedAbsences = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const decoded = jwtDecode<{ userId: number }>(token);
      
      // Récupérer toutes les absences
      const response = await axios.get<AbsencesResponse>(
        API_URL + '/absences',
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
  }, [showAlert]);

  const fetchTrustedContacts = useCallback(async (userId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get<User[]>(
        `${API_URL}/users/${userId}/trusted-contacts`,
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
  }, [showAlert]);

  const fetchAvailableUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get<UsersResponse>(
        API_URL + '/users',
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
  }, [showAlert]);

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
  }, [navigate, fetchMyAbsences, fetchRequestedAbsences, fetchTrustedContacts, fetchAvailableUsers]);

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
    if (!startDate || !endDate || selectedContacts.length === 0) {
      showAlert("Date de début, de fin ou contact manquant.", "error");
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const absenceData : AbsenceData = {
        start_date: startDate.format('YYYY-MM-DD'),
        end_date: endDate.format('YYYY-MM-DD'),
        //userId,
        notes,
        trusted_contact_ids: selectedContacts,
      };
      
      if (editingAbsence) {
        // Update existing absence
        await axios.put(
          `${API_URL}/absences/${editingAbsence.id}`,
          absenceData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        showAlert('Absence mise à jour avec succès', 'success');
      } else {
        absenceData["userId"] = userId;
        // Create new absence
        await axios.post(
          API_URL + '/absences',
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
        `${API_URL}/absences/${id}`,
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
        `${API_URL}/absences/${absenceId}/response`,
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
        API_URL + '/trusted-contacts',
        {
          userId,
          trustedUserId: selectedNewContact.id
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      showAlert('Contact de confiance ajouté avec succès', 'success');
      setIsAddingContact(false);
      setSelectedNewContact(null);
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
        `${API_URL}/trusted-contacts/${userId}/${trustedUserId}`,
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
                <AbsenceCard
                  key={absence.id}
                  absence={absence}
                  handleOpenDialog={handleOpenDialog}
                  handleDeleteAbsence={handleDeleteAbsence}
                />
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
                    
                    {/* Affichage des réponses individuelles */}
                    {absence.responses && absence.responses.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                          Réponses des contacts :
                        </Typography>
                        {absence.responses.map((response) => (
                          <Box key={response.id} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Avatar sx={{ width: 24, height: 24, mr: 1, bgcolor: 'primary.main', fontSize: '12px' }}>
                              {response.contact.firstname.charAt(0).toUpperCase()}
                            </Avatar>
                            <Typography variant="body2" sx={{ mr: 1 }}>
                              {response.contact.firstname} {response.contact.lastname}:
                            </Typography>
                            <Chip 
                              label={response.status === 'accepted' ? 'Accepté' : response.status === 'refused' ? 'Refusé' : 'En attente'} 
                              color={response.status === 'accepted' ? 'success' : response.status === 'refused' ? 'error' : 'warning'}
                              size="small"
                            />
                          </Box>
                        ))}
                      </Box>
                    )}
                    
                    {/* Boutons pour l'utilisateur actuel si c'est sa demande */}
                    {userId && absence.responses && absence.responses.some(r => r.contact.id === userId && r.status === 'pending') && (
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
                          onClick={() => handleAbsenceStatusChange(absence.id, 'refused')}
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

          {availableNewContacts.length === 0 && !isAddingContact && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Tous les utilisateurs disponibles sont déjà dans vos contacts de confiance.
            </Alert>
          )}
          
          {isAddingContact && (
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Ajouter un contact de confiance
              </Typography>
              
              <Autocomplete
                fullWidth
                options={availableNewContacts}
                getOptionLabel={(option) => `${option.firstname} ${option.lastname}`}
                renderOption={(props, option) => (
                  <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                      {option.firstname.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="body1">
                        {option.firstname} {option.lastname}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {option.email}
                      </Typography>
                    </Box>
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Rechercher un utilisateur"
                    placeholder="Tapez le nom, prénom ou email..."
                    variant="outlined"
                    sx={{ mb: 2 }}
                  />
                )}
                onChange={(event, newValue) => {
                  setSelectedNewContact(newValue);
                }}
                onClose={() => {
                  // Réinitialiser la sélection quand on ferme la dropdown
                }}
                filterOptions={(options, { inputValue }) => {
                  const filterValue = inputValue.toLowerCase();
                  return options.filter(
                    (option) =>
                      option.firstname.toLowerCase().includes(filterValue) ||
                      option.lastname.toLowerCase().includes(filterValue) ||
                      option.email.toLowerCase().includes(filterValue)
                  );
                }}
                noOptionsText="Aucun utilisateur trouvé"
                clearOnBlur
                selectOnFocus
                isOptionEqualToValue={(option, value) => option.id === value.id}
                size="medium"
                autoHighlight
              />
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  onClick={() => {
                    setIsAddingContact(false);
                    setSelectedNewContact(null);
                  }} 
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
                      <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                        {contact.firstname.charAt(0).toUpperCase()}
                      </Avatar>
                      <ListItemText 
                        primary={`${contact.firstname} ${contact.lastname}`}
                        secondary={contact.email}
                      />
                      <ListItemSecondaryAction>
                        <Tooltip title="Retirer ce contact de confiance">
                          <IconButton 
                            edge="end" 
                            color="error" 
                            onClick={() => handleRemoveContact(contact.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
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
                format="DD-MM-YYYY"
              />
              
              <DatePicker
                label="Date de fin"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                minDate={startDate || undefined}
                format="DD-MM-YYYY"
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