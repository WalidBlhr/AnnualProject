import React, { useState } from 'react';
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
  Paper
} from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import jwtDecode from 'jwt-decode';

const CreateEvent = () => {
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
  
  const navigate = useNavigate();
  
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
      setFormData({ ...formData, type: 'community' });
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
      
      const decoded = jwtDecode<{ userId: number }>(token);
      
      const eventData = {
        ...formData,
        creatorId: decoded.userId,
        min_participants: formData.min_participants || 0
      };
      
      await axios.post(
        'http://localhost:3000/events',
        eventData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      showAlert('Événement créé avec succès', 'success');
      
      // Rediriger en fonction du type d'événement
      setTimeout(() => {
        if (isCommunityEvent) {
          navigate('/community-events');
        } else {
          navigate('/events');
        }
      }, 1500);
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erreur lors de la création de l\'événement';
      showAlert(errorMessage, 'error');
    }
  };
  
  const showAlert = (message: string, severity: 'success' | 'error') => {
    setAlert({ open: true, message, severity });
  };
  
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Créer un nouvel événement
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
              onClick={() => navigate(-1)}
            >
              Annuler
            </Button>
            <Button 
              type="submit"
              variant="contained"
            >
              Créer l'événement
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

export default CreateEvent;