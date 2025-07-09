import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Snackbar,
  Alert,
  FormControlLabel,
  Checkbox,
  Paper,
  CircularProgress
} from '@mui/material';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
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

const EditEvent = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    location: '',
    max_participants: 10,
    min_participants: 0,
    status: 'draft',
    type: 'regular',
    category: '',
    description: '',
    equipment_needed: ''
  });
  
  const [isCommunityEvent, setIsCommunityEvent] = useState(false);
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const showAlert = (message: string, severity: 'success' | 'error') => {
    setAlert({ open: true, message, severity });
  };

  const fetchEvent = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const decoded = jwtDecode<{ userId: number }>(token);

      const response = await axios.get<Event>(`${API_URL}/events/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const eventData = response.data;

      // Vérifier que l'utilisateur est le créateur de l'événement
      if (eventData.creator.id !== decoded.userId) {
        showAlert('Vous n\'êtes pas autorisé à modifier cet événement', 'error');
        navigate('/my-events');
        return;
      }

      // Vérifier que l'événement est en brouillon
      if (eventData.status !== 'draft') {
        showAlert('Seuls les événements en brouillon peuvent être modifiés', 'error');
        navigate('/my-events');
        return;
      }
      
      // Convertir la date au format datetime-local
      const eventDate = new Date(eventData.date);
      const formattedDate = eventDate.toISOString().slice(0, 16);

      setFormData({
        name: eventData.name,
        date: formattedDate,
        location: eventData.location,
        max_participants: eventData.max_participants,
        min_participants: eventData.min_participants,
        status: eventData.status,
        type: eventData.type,
        category: eventData.category || '',
        description: eventData.description || '',
        equipment_needed: eventData.equipment_needed || ''
      });

      setIsCommunityEvent(eventData.type === 'community');
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'événement:', error);
      showAlert('Erreur lors du chargement de l\'événement', 'error');
      navigate('/my-events');
    }
  }, [id, navigate]);

  useEffect(() => {
    if (id) {
      fetchEvent();
    }
  }, [id, fetchEvent]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name as string]: value });
  };
  
  const handleCommunityToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsCommunityEvent(e.target.checked);
    
    if (e.target.checked) {
      setFormData({ ...formData, type: 'community', category: 'cleaning' });
    } else {
      setFormData({ ...formData, type: 'regular', category: '' });
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      // Validation côté client
      if (isCommunityEvent && !formData.category) {
        showAlert('La catégorie est obligatoire pour les événements communautaires', 'error');
        return;
      }
      
      // Validation de la date
      if (!formData.date) {
        showAlert('La date est obligatoire', 'error');
        return;
      }
      
      const dateObj = new Date(formData.date);
      if (isNaN(dateObj.getTime())) {
        showAlert('Format de date invalide', 'error');
        return;
      }
      
      const eventData = {
        name: formData.name,
        date: dateObj.toISOString(),
        location: formData.location,
        max_participants: formData.max_participants,
        min_participants: formData.min_participants || 0,
        status: formData.status,
        type: formData.type,
        ...(formData.type === 'community' && { category: formData.category }),
        ...(formData.description && { description: formData.description }),
        ...(formData.equipment_needed && { equipment_needed: formData.equipment_needed })
      };
      
      console.log('Data à envoyer:', eventData);
      
      await axios.put(
        `${API_URL}/events/${id}`,
        eventData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      showAlert('Événement modifié avec succès', 'success');
      
      // Rediriger vers mes événements
      setTimeout(() => {
        navigate('/my-events');
      }, 1500);
      
    } catch (error: any) {
      console.error('Erreur lors de la modification:', error);
      
      let errorMessage = 'Erreur lors de la modification de l\'événement';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showAlert(errorMessage, 'error');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Chargement de l'événement...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Modifier l'événement
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={isCommunityEvent}
                onChange={handleCommunityToggle}
                name="isCommunityEvent"
                color="primary"
              />
            }
            label="Événement communautaire (nettoyage, collecte, fête de quartier)"
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            id="name"
            label="Nom de l'événement"
            name="name"
            value={formData.name}
            onChange={handleChange}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            id="date"
            label="Date et heure"
            type="datetime-local"
            name="date"
            value={formData.date}
            onChange={handleChange}
            InputLabelProps={{
              shrink: true,
            }}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            id="location"
            label="Lieu"
            name="location"
            value={formData.location}
            onChange={handleChange}
          />
          
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <TextField
              required
              fullWidth
              id="max_participants"
              label="Nombre maximum de participants"
              type="number"
              name="max_participants"
              value={formData.max_participants}
              onChange={handleChange}
              inputProps={{ min: 1 }}
            />
            
            <TextField
              fullWidth
              id="min_participants"
              label="Nombre minimum de participants"
              type="number"
              name="min_participants"
              value={formData.min_participants}
              onChange={handleChange}
              inputProps={{ min: 0 }}
              helperText="Laissez 0 si pas de minimum"
            />
          </Box>
          
          {isCommunityEvent && (
            <>
              <FormControl fullWidth margin="normal" required>
                <InputLabel id="category-label">Catégorie</InputLabel>
                <Select
                  labelId="category-label"
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleSelectChange}
                  label="Catégorie"
                >
                  <MenuItem value="cleaning">Nettoyage</MenuItem>
                  <MenuItem value="waste_collection">Collecte de déchets</MenuItem>
                  <MenuItem value="neighborhood_party">Fête de quartier</MenuItem>
                  <MenuItem value="other">Autre</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                margin="normal"
                fullWidth
                id="description"
                label="Description détaillée"
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={4}
              />
              
              <TextField
                margin="normal"
                fullWidth
                id="equipment_needed"
                label="Matériel nécessaire (facultatif)"
                name="equipment_needed"
                value={formData.equipment_needed}
                onChange={handleChange}
                helperText="Listez le matériel que les participants devraient apporter"
              />
            </>
          )}
          
          <FormControl fullWidth margin="normal" required>
            <InputLabel id="status-label">Statut</InputLabel>
            <Select
              labelId="status-label"
              id="status"
              name="status"
              value={formData.status}
              onChange={handleSelectChange}
              label="Statut"
            >
              <MenuItem value="draft">Brouillon</MenuItem>
              <MenuItem value="pending">En attente</MenuItem>
              <MenuItem value="open">Ouvert</MenuItem>
            </Select>
          </FormControl>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Button 
              variant="outlined"
              onClick={() => navigate('/my-events')}
            >
              Annuler
            </Button>
            <Button 
              type="submit"
              variant="contained"
            >
              Modifier l'événement
            </Button>
          </Box>
        </Box>
      </Paper>
      
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

export default EditEvent;
