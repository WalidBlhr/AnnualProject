import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import { isAdmin } from '../../services/auth';

interface Category {
  id: string;
  name: string;
  description: string;
}

const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const userIsAdmin = isAdmin();
    
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data } = await axios.get<Category[]>('http://localhost:3000/journal/categories');
      setCategories(data);
    } catch (error) {
      showAlert('Erreur lors du chargement des catégories', 'error');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCategory.name.trim()) {
      showAlert('Le nom de la catégorie est requis', 'error');
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Non authentifié');
      
      await axios.post(
        'http://localhost:3000/journal/categories',
        newCategory,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setNewCategory({ name: '', description: '' });
      fetchCategories();
      showAlert('Catégorie créée avec succès', 'success');
    } catch (error) {
      showAlert('Erreur lors de la création de la catégorie', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Non authentifié');
      
      await axios.delete(`http://localhost:3000/journal/categories/${categoryToDelete}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      fetchCategories();
      showAlert('Catégorie supprimée avec succès', 'success');
    } catch (error) {
      showAlert('Erreur lors de la suppression de la catégorie', 'error');
    } finally {
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  const confirmDeleteCategory = (id: string) => {
    setCategoryToDelete(id);
    setDeleteDialogOpen(true);
  };

  const showAlert = (message: string, severity: 'success' | 'error') => {
    setAlert({ open: true, message, severity });
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Catégories d'articles
      </Typography>
      
      {/* Section pour créer des catégories - accessible uniquement aux admins */}
      {userIsAdmin && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Créer une nouvelle catégorie
          </Typography>
          
          <Box component="form" onSubmit={handleCreateCategory} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              required
              label="Nom de la catégorie"
              margin="normal"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
            />
            
            <TextField
              fullWidth
              label="Description (optionnel)"
              margin="normal"
              multiline
              rows={2}
              value={newCategory.description}
              onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
            />
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                type="submit" 
                variant="contained" 
                color="primary"
                disabled={loading}
              >
                {loading ? 'Création...' : 'Créer la catégorie'}
              </Button>
            </Box>
          </Box>
        </Paper>
      )}
      
      {/* Liste des catégories existantes */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Liste des catégories
        </Typography>
        
        {categories.length === 0 ? (
          <Typography variant="body1" color="text.secondary">
            Aucune catégorie disponible pour le moment.
          </Typography>
        ) : (
          <List>
            {categories.map((category, index) => (
              <React.Fragment key={category.id}>
                <ListItem>
                  <ListItemText 
                    primary={category.name} 
                    secondary={category.description || 'Aucune description'}
                  />
                  {userIsAdmin && (
                    <ListItemSecondaryAction>
                      <IconButton 
                        edge="end" 
                        aria-label="delete" 
                        onClick={() => confirmDeleteCategory(category.id)}
                      >
                        <DeleteIcon color="error" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  )}
                </ListItem>
                {index < categories.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
      
      {/* Dialog de confirmation de suppression */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          Êtes-vous sûr de vouloir supprimer cette catégorie ? Cette action ne peut pas être annulée.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Annuler</Button>
          <Button onClick={handleDeleteCategory} color="error" autoFocus>
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Alertes */}
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={() => setAlert({ ...alert, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={alert.severity} sx={{ width: '100%' }}>
          {alert.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Categories;