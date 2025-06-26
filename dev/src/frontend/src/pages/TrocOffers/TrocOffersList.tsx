import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Box,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ButtonGroup,
} from '@mui/material';
import axios from 'axios';
import jwtDecode from 'jwt-decode'; // Ajoutez cet import
import { STATUS_LABELS, STATUS_COLORS, TrocOfferStatus } from '../../types/trocOffer';
import { styled } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
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
  image_url?: string; // Ajoutez cette ligne
}

interface DecodedToken {
  userId: number;
  email: string;
  role: number;
}

// Ajoutez ce style pour le bouton d'upload
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

const TrocOffersList: React.FC = () => {
  const navigate = useNavigate(); // Ajoutez cette ligne
  const [trocOffers, setTrocOffers] = useState<TrocOffer[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTrocOffer, setNewTrocOffer] = useState({
    title: '',
    description: '',
    status: 'open',
    type: 'offer'
  });
  const [alert, setAlert] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });
  const [filter, setFilter] = useState<'all' | 'offer' | 'request'>('all');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchTrocOffers();
  }, []);

  const fetchTrocOffers = async () => {
    try {
      const { data } = await axios.get(API_URL + '/trocoffers', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setTrocOffers(data.data);
    } catch (error) {
      showAlert('Erreur lors du chargement des offres de troc', 'error');
    }
  };

  const handleCreateTrocOffer = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showAlert('Utilisateur non connecté', 'error');
        return;
      }

      // Décoder le token pour obtenir l'ID de l'utilisateur
      const decoded = jwtDecode<DecodedToken>(token);
      if (!decoded.userId) {
        showAlert('ID utilisateur non trouvé', 'error');
        return;
      }

      // Créer un FormData pour envoyer l'image
      const formData = new FormData();
      formData.append('title', newTrocOffer.title);
      formData.append('description', newTrocOffer.description);
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

      showAlert('Offre de troc créée avec succès', 'success');
      setCreateDialogOpen(false);
      fetchTrocOffers();
      setNewTrocOffer({ title: '', description: '', status: 'open', type: 'offer' });
      setSelectedImage(null);
      setPreviewUrl(null);
    } catch (error: any) {
      if (error.response?.data) {
        const errorMessages = Object.values(error.response.data).join('\n');
        showAlert(errorMessages, 'error');
      } else {
        showAlert('Erreur lors de la création de l\'offre', 'error');
      }
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const showAlert = (message: string, severity: 'success' | 'error') => {
    setAlert({ open: true, message, severity });
  };

  const filteredTrocOffers = trocOffers.filter(offer => 
    filter === 'all' || offer.type === filter
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3} alignItems="center" sx={{ mb: 4 }}>
        <Grid item xs>
          <Typography variant="h4">Offres de Troc</Typography>
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setCreateDialogOpen(true)}
          >
            Nouvelle offre de troc
          </Button>
        </Grid>
      </Grid>

      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <ButtonGroup>
          <Button 
            variant={filter === 'all' ? 'contained' : 'outlined'}
            onClick={() => setFilter('all')}
          >
            Tout
          </Button>
          <Button
            variant={filter === 'offer' ? 'contained' : 'outlined'}
            onClick={() => setFilter('offer')}
          >
            Offres
          </Button>
          <Button
            variant={filter === 'request' ? 'contained' : 'outlined'}
            onClick={() => setFilter('request')}
          >
            Demandes
          </Button>
        </ButtonGroup>
      </Box>

      <Grid container spacing={3}>
        {filteredTrocOffers.map((trocOffer : TrocOffer) => (
          <Grid item xs={12} md={6} lg={4} key={trocOffer.id}>
            <Card>
              {trocOffer.image_url && (
                <Box sx={{ position: 'relative', pt: '56.25%' }}> {/* 16:9 aspect ratio */}
                  <img
                    src={trocOffer.image_url}
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
                <Box display="flex" justifyContent="space-between" alignItems="start">
                  <Typography variant="h6" gutterBottom>
                    {trocOffer.title}
                  </Typography>
                  <Chip 
                    label={STATUS_LABELS[trocOffer.status as TrocOfferStatus]}
                    color={STATUS_COLORS[trocOffer.status as TrocOfferStatus]}
                    size="small"
                  />
                </Box>
                <Typography color="textSecondary" gutterBottom>
                  Par {trocOffer.user?.firstname} {trocOffer.user?.lastname}
                </Typography>
                <Typography variant="body2">
                  {trocOffer.description}
                </Typography>
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Créé le {new Date(trocOffer.creation_date).toLocaleDateString()}
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" color="primary" onClick={() => navigate(`/trocs/${trocOffer.id}/messages/${trocOffer.user.id}`)}>
                  Contacter
                </Button>
                <Button size="small" onClick={() => navigate(`/trocs/${trocOffer.id}`)}>
                  Détails
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
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

export default TrocOffersList;