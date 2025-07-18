import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
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
  IconButton,
  Switch,
  FormControlLabel,
  ButtonGroup,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import jwtDecode from 'jwt-decode';
import { STATUS_LABELS, STATUS_COLORS, TrocOfferStatus } from '../../types/trocOffer';
import { styled } from '@mui/material/styles';
import { API_URL } from '../../const';

interface TrocOffer {
  id: number;
  title: string;
  description: string;
  creation_date: string;
  status: string;
  type: string;
  user: {
    id: number;
    firstname: string;
    lastname: string;
  };
  image_url?: string;
}

interface DecodedToken {
  userId: number;
  email: string;
  role: number;
}

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const MyTrocOffers: React.FC = () => {
  const navigate = useNavigate();
  const [trocOffers, setTrocOffers] = useState<TrocOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTrocOffer, setSelectedTrocOffer] = useState<TrocOffer | null>(null);
  const [filter, setFilter] = useState<'all' | 'offer' | 'request'>('all');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [alert, setAlert] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });
  
  const [newTrocOffer, setNewTrocOffer] = useState({
    title: '',
    description: '',
    status: 'open',
    type: 'offer'
  });

  const showAlert = useCallback((message: string, severity: 'success' | 'error') => {
    setAlert({ open: true, message, severity });
  }, []);

  const fetchMyTrocOffers = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const decoded = jwtDecode<DecodedToken>(token);
      
      const { data } = await axios.get(API_URL + '/trocoffers', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (data && data.data) {
        // Filtrer les trocs où l'utilisateur est le propriétaire
        const myTrocOffers = data.data.filter((trocOffer: TrocOffer) => 
          trocOffer.user && trocOffer.user.id === decoded.userId
        );
        setTrocOffers(myTrocOffers);
      }
    } catch (error) {
      console.error('Error fetching troc offers:', error);
      showAlert('Erreur lors du chargement des offres de troc', 'error');
    } finally {
      setLoading(false);
    }
  }, [navigate, showAlert]);

  useEffect(() => {
    fetchMyTrocOffers();
  }, [fetchMyTrocOffers]);

  const handleCreateTrocOffer = async () => {
    try {
      if (!newTrocOffer.title.trim()) {
        showAlert('Le titre est requis', 'error');
        return;
      }
      if (!newTrocOffer.description.trim()) {
        showAlert('La description est requise', 'error');
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        showAlert('Utilisateur non connecté', 'error');
        return;
      }

      const decoded = jwtDecode<DecodedToken>(token);
      if (!decoded.userId) {
        showAlert('ID utilisateur non trouvé', 'error');
        return;
      }

      const formData = new FormData();
      formData.append('title', newTrocOffer.title.trim());
      formData.append('description', newTrocOffer.description.trim());
      formData.append('creation_date', new Date().toISOString());
      formData.append('status', 'open');
      formData.append('userId', decoded.userId.toString());
      formData.append('type', newTrocOffer.type);
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      await axios.post(API_URL + '/trocoffers', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setCreateDialogOpen(false);
      resetNewTrocOffer();
      fetchMyTrocOffers();
      showAlert('Offre de troc créée avec succès', 'success');
    } catch (error: any) {
      console.error('Error creating troc offer:', error);
      if (error.response?.data) {
        const errorMessages = Object.values(error.response.data).join('\n');
        showAlert(errorMessages, 'error');
      } else {
        showAlert('Erreur lors de la création de l\'offre', 'error');
      }
    }
  };

  const handleUpdateTrocOffer = async () => {
    try {
      if (!selectedTrocOffer) return;

      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      // Validation des données
      if (!selectedTrocOffer.title.trim()) {
        showAlert('Le titre est requis', 'error');
        return;
      }
      if (!selectedTrocOffer.description.trim()) {
        showAlert('La description est requise', 'error');
        return;
      }

      console.log('Updating troc offer with data:', selectedTrocOffer);

      // Utiliser la même approche que handleStatusChange dans TrocOfferDetail
      // Envoyer un objet JSON simple (exactement comme pour le status)
      // Ne pas inclure 'type' car l'API ne l'accepte pas en mise à jour
      const updateData = {
        title: selectedTrocOffer.title.trim(),
        description: selectedTrocOffer.description.trim(),
        status: selectedTrocOffer.status
      };

      await axios.put(
        API_URL + `/trocoffers/${selectedTrocOffer.id}`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }
      );

      // Mettre à jour l'état local immédiatement (comme dans TrocOfferDetail)
      setTrocOffers(prevTrocOffers => 
        prevTrocOffers.map(offer => 
          offer.id === selectedTrocOffer.id 
            ? { ...offer, ...updateData } 
            : offer
        )
      );

      setEditDialogOpen(false);
      setSelectedTrocOffer(null);
      setSelectedImage(null);
      setPreviewUrl(null);
      showAlert('Offre de troc mise à jour avec succès', 'success');
    } catch (error: any) {
      console.error('Error updating troc offer:', error);
      console.error('Error response:', error.response?.data);
      
      const errorMessage = error.response?.data?.error || 'Erreur lors de la mise à jour de l\'offre';
      showAlert(errorMessage, 'error');
    }
  };

  const handleDeleteTrocOffer = async (trocOfferId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      if (window.confirm('Êtes-vous sûr de vouloir supprimer cette offre de troc ?')) {
        await axios.delete(
          API_URL + `/trocoffers/${trocOfferId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        fetchMyTrocOffers();
        showAlert('Offre de troc supprimée avec succès', 'success');
      }
    } catch (error) {
      console.error('Error deleting troc offer:', error);
      showAlert('Erreur lors de la suppression de l\'offre', 'error');
    }
  };

  const handleToggleTrocOfferStatus = async (trocOfferId: number, currentStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      // Basculer entre 'open' et 'closed'
      const newStatus = currentStatus === 'open' ? 'pending' : 'open';
      
      await axios.put(
        API_URL + `/trocoffers/${trocOfferId}`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      fetchMyTrocOffers();
      showAlert(`Offre ${newStatus === 'open' ? 'réactivée' : 'fermée'}`, 'success');
    } catch (error: any) {
      console.error('Error toggling troc offer status:', error);
      const errorMessage = error.response?.data?.error || 'Erreur lors du changement de statut';
      showAlert(errorMessage, 'error');
    }
  };

  const resetNewTrocOffer = () => {
    setNewTrocOffer({
      title: '',
      description: '',
      status: 'open',
      type: 'offer'
    });
    setSelectedImage(null);
    setPreviewUrl(null);
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const openEditDialog = (trocOffer: TrocOffer) => {
    setSelectedTrocOffer({ ...trocOffer });
    setSelectedImage(null); // Reset l'image sélectionnée
    setPreviewUrl(trocOffer.image_url ? API_URL + trocOffer.image_url : null);
    setEditDialogOpen(true);
  };

  const filteredTrocOffers = trocOffers.filter(offer => {
    return filter === 'all' || offer.type === filter;
  });

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography>Chargement...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3} alignItems="center" sx={{ mb: 4 }}>
        <Grid item xs>
          <Typography variant="h4">Mes Offres de Troc</Typography>
          <Typography variant="body2" color="textSecondary">
            {trocOffers.length} offre(s) de troc
          </Typography>
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Nouvelle offre de troc
          </Button>
        </Grid>
      </Grid>

      <Box sx={{ mb: 3 }}>
        <ButtonGroup>
          <Button 
            variant={filter === 'all' ? 'contained' : 'outlined'}
            onClick={() => setFilter('all')}
          >
            Tout ({trocOffers.length})
          </Button>
          <Button
            variant={filter === 'offer' ? 'contained' : 'outlined'}
            onClick={() => setFilter('offer')}
          >
            Offres ({trocOffers.filter(t => t.type === 'offer').length})
          </Button>
          <Button
            variant={filter === 'request' ? 'contained' : 'outlined'}
            onClick={() => setFilter('request')}
          >
            Demandes ({trocOffers.filter(t => t.type === 'request').length})
          </Button>
        </ButtonGroup>
      </Box>

      <Grid container spacing={3}>
        {filteredTrocOffers.map((trocOffer: TrocOffer) => (
          <Grid item xs={12} md={6} lg={4} key={trocOffer.id}>
            <Card>
              {trocOffer.image_url && (
                <Box sx={{ position: 'relative', pt: '56.25%' }}>
                  <img
                    src={API_URL + trocOffer.image_url}
                    alt={trocOffer.title}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </Box>
              )}
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="start" sx={{ mb: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {trocOffer.title}
                  </Typography>
                  <Chip 
                    label={STATUS_LABELS[trocOffer.status as TrocOfferStatus]}
                    color={STATUS_COLORS[trocOffer.status as TrocOfferStatus]}
                    size="small"
                  />
                </Box>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Type: {trocOffer.type === 'offer' ? 'Offre' : 'Demande'}
                </Typography>
                <Typography variant="body2" paragraph>
                  {trocOffer.description}
                </Typography>
                <Typography variant="caption" display="block">
                  Créé le {new Date(trocOffer.creation_date).toLocaleDateString()}
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={trocOffer.status === 'open'}
                        onChange={() => handleToggleTrocOfferStatus(trocOffer.id, trocOffer.status)}
                        size="small"
                      />
                    }
                    label={trocOffer.status === 'open' ? 'Actif' : 'Fermé'}
                  />
                </Box>
              </CardContent>
              <CardActions>
                <IconButton
                  size="small"
                  onClick={() => navigate(`/trocs/${trocOffer.id}`)}
                  title="Voir les détails"
                >
                  <VisibilityIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => openEditDialog(trocOffer)}
                  title="Modifier"
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleDeleteTrocOffer(trocOffer.id)}
                  title="Supprimer"
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredTrocOffers.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" color="textSecondary">
            Aucune offre de troc trouvée
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Commencez par créer votre première offre de troc
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Créer une offre
          </Button>
        </Box>
      )}

      {/* Dialog de création */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Nouvelle offre de troc</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="dense">
            <InputLabel>Type</InputLabel>
            <Select
              value={newTrocOffer.type}
              onChange={(e) => setNewTrocOffer({ ...newTrocOffer, type: e.target.value })}
            >
              <MenuItem value="offer">Offre</MenuItem>
              <MenuItem value="request">Demande</MenuItem>
            </Select>
          </FormControl>
          <TextField
            autoFocus
            margin="dense"
            label="Titre"
            fullWidth
            value={newTrocOffer.title}
            onChange={(e) => setNewTrocOffer({ ...newTrocOffer, title: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={4}
            value={newTrocOffer.description}
            onChange={(e) => setNewTrocOffer({ ...newTrocOffer, description: e.target.value })}
          />
          <Box sx={{ mt: 2 }}>
            <Button
              component="label"
              variant="contained"
              startIcon={<CloudUploadIcon />}
              sx={{ mb: 2 }}
            >
              Ajouter une photo
              <VisuallyHiddenInput type="file" accept="image/*" onChange={handleImageChange} />
            </Button>
            {previewUrl && (
              <Box sx={{ mt: 2 }}>
                <img 
                  src={previewUrl} 
                  alt="Aperçu" 
                  style={{ maxWidth: '100%', maxHeight: '200px' }} 
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Annuler</Button>
          <Button onClick={handleCreateTrocOffer} variant="contained">
            Créer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de modification */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Modifier l'offre de troc</DialogTitle>
        <DialogContent>
          {selectedTrocOffer && (
            <>
              <TextField
                autoFocus
                margin="dense"
                label="Titre"
                fullWidth
                value={selectedTrocOffer.title}
                onChange={(e) => setSelectedTrocOffer({ ...selectedTrocOffer, title: e.target.value })}
              />
              <TextField
                margin="dense"
                label="Description"
                fullWidth
                multiline
                rows={4}
                value={selectedTrocOffer.description}
                onChange={(e) => setSelectedTrocOffer({ ...selectedTrocOffer, description: e.target.value })}
              />
              <FormControl fullWidth margin="dense">
                <InputLabel>Statut</InputLabel>
                <Select
                  value={selectedTrocOffer.status}
                  onChange={(e) => setSelectedTrocOffer({ ...selectedTrocOffer, status: e.target.value })}
                >
                  <MenuItem value="open">Disponible</MenuItem>
                  <MenuItem value="pending">En négociation</MenuItem>
                  <MenuItem value="closed">Terminé</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 2, mb: 1 }}>
                Type: {selectedTrocOffer.type === 'offer' ? 'Offre' : 'Demande'} (non modifiable)
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Button
                  component="label"
                  variant="contained"
                  startIcon={<CloudUploadIcon />}
                  sx={{ mb: 2 }}
                >
                  Changer la photo
                  <VisuallyHiddenInput type="file" accept="image/*" onChange={handleImageChange} />
                </Button>
                {previewUrl && (
                  <Box sx={{ mt: 2 }}>
                    <img 
                      src={previewUrl} 
                      alt="Aperçu" 
                      style={{ maxWidth: '100%', maxHeight: '200px' }} 
                    />
                  </Box>
                )}
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Annuler</Button>
          <Button onClick={handleUpdateTrocOffer} variant="contained">
            Sauvegarder
          </Button>
        </DialogActions>
      </Dialog>

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

export default MyTrocOffers;
