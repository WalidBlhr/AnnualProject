import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Avatar,
  Grid,
  Divider,
  Alert,
  Snackbar,
  Card,
  CardContent,
  IconButton,
  CircularProgress,
  Switch,
  FormControlLabel,
  FormControl
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import EmailIcon from '@mui/icons-material/Email';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { API_URL } from '../../const';

interface ProfileData {
  firstname: string;
  lastname: string;
  email: string;
}

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData>({
    firstname: '',
    lastname: '',
    email: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [originalData, setOriginalData] = useState<ProfileData>({
    firstname: '',
    lastname: '',
    email: ''
  });
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  useEffect(() => {
    if (user) {
      const data = {
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email
      };
      setProfileData(data);
      setOriginalData(data);
      
      // Charger les préférences de notification
      loadEmailNotificationPreferences();
    }
  }, [user]);

  const loadEmailNotificationPreferences = async () => {
    if (!user) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/users/${user.userId}/email-notifications`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      setEmailNotificationsEnabled(response.data.email_notifications_enabled);
    } catch (error) {
      console.error('Erreur lors du chargement des préférences:', error);
      // En cas d'erreur, on garde la valeur par défaut (true)
    }
  };

  const handleEmailNotificationToggle = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.checked;
    setNotificationLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/users/${user?.userId}/email-notifications`,
        { enabled: newValue },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      setEmailNotificationsEnabled(newValue);
      setAlert({
        open: true,
        message: `Notifications par email ${newValue ? 'activées' : 'désactivées'}`,
        severity: 'success'
      });
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour des préférences:', error);
      setAlert({
        open: true,
        message: error.response?.data?.error || 'Erreur lors de la mise à jour des préférences',
        severity: 'error'
      });
    } finally {
      setNotificationLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setOriginalData({ ...profileData });
  };

  const handleCancel = () => {
    setProfileData({ ...originalData });
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      console.log('Sending update request for user:', user.userId);
      console.log('Data to send:', {
        firstname: profileData.firstname,
        lastname: profileData.lastname,
        email: profileData.email
      });
      
      const response = await axios.put(
        `${API_URL}/users/${user.userId}`,
        {
          firstname: profileData.firstname,
          lastname: profileData.lastname,
          email: profileData.email
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      console.log('Update response:', response.data);
      
      setAlert({
        open: true,
        message: 'Profil mis à jour avec succès !',
        severity: 'success'
      });
      setIsEditing(false);
      setOriginalData({ ...profileData });
      
      // Recharger la page après un délai pour permettre à l'utilisateur de voir le message
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour:', error);
      console.error('Error response:', error.response?.data);
      setAlert({
        open: true,
        message: error.response?.data?.message || error.response?.data?.error || 'Erreur lors de la mise à jour du profil',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getInitials = () => {
    if (!user) return '?';
    return `${user.firstname.charAt(0)}${user.lastname.charAt(0)}`.toUpperCase();
  };

  if (!user) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        {/* Header avec avatar */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              fontSize: '2rem',
              mr: 3,
              bgcolor: 'primary.main'
            }}
          >
            {getInitials()}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Mon Profil
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Gérez vos informations personnelles
            </Typography>
          </Box>
          <Box>
            {!isEditing ? (
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={handleEdit}
              >
                Modifier
              </Button>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Annuler
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={20} /> : 'Sauvegarder'}
                </Button>
              </Box>
            )}
          </Box>
        </Box>

        <Divider sx={{ mb: 4 }} />

        <Grid container spacing={3}>
          {/* Informations personnelles */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <PersonIcon sx={{ mr: 1 }} />
                  Informations personnelles
                </Typography>
                
                <Box sx={{ mt: 3 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Prénom"
                        value={profileData.firstname}
                        onChange={(e) => handleInputChange('firstname', e.target.value)}
                        disabled={!isEditing}
                        variant={isEditing ? 'outlined' : 'filled'}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Nom"
                        value={profileData.lastname}
                        onChange={(e) => handleInputChange('lastname', e.target.value)}
                        disabled={!isEditing}
                        variant={isEditing ? 'outlined' : 'filled'}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Email"
                        value={profileData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        disabled={!isEditing}
                        variant={isEditing ? 'outlined' : 'filled'}
                        type="email"
                      />
                    </Grid>
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Informations du compte */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Informations du compte
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Email de connexion
                      </Typography>
                      <Typography variant="body1">
                        {user.email}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <AdminPanelSettingsIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Rôle
                      </Typography>
                      <Typography variant="body1">
                        {user.role === 1 ? 'Administrateur' : 'Membre'}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CalendarTodayIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Membre depuis
                      </Typography>
                      <Typography variant="body1">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'Date inconnue'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Section Préférences de notification */}
        <Box sx={{ mt: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <NotificationsIcon sx={{ mr: 1 }} />
                Préférences de notification
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <FormControl component="fieldset">
                  <FormControlLabel
                    control={
                      <Switch
                        checked={emailNotificationsEnabled}
                        onChange={handleEmailNotificationToggle}
                        disabled={notificationLoading}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body1">
                          Notifications par email
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Recevoir un email pour les notifications importantes (réservations, demandes de surveillance, événements annulés)
                        </Typography>
                      </Box>
                    }
                  />
                  {notificationLoading && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <CircularProgress size={16} sx={{ mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        Mise à jour en cours...
                      </Typography>
                    </Box>
                  )}
                </FormControl>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Paper>

      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={() => setAlert({ ...alert, open: false })}
      >
        <Alert
          severity={alert.severity}
          onClose={() => setAlert({ ...alert, open: false })}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Profile;
