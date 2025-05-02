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
} from '@mui/material';
import axios from 'axios';
import jwtDecode from 'jwt-decode'; // Ajoutez cet import

interface TrocOffer {
  id: number;
  title: string;
  description: string;
  creation_date: string;
  status: string;
  user: {
    id: number;
    firstname: string;
    lastname: string;
  };
}

interface DecodedToken {
  userId: number;
  email: string;
  role: number;
}

const TrocOffersList: React.FC = () => {
  const navigate = useNavigate(); // Ajoutez cette ligne
  const [trocOffers, setTrocOffers] = useState<TrocOffer[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTrocOffer, setNewTrocOffer] = useState({
    title: '',
    description: '',
    status: 'open'
  });
  const [alert, setAlert] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchTrocOffers();
  }, []);

  const fetchTrocOffers = async () => {
    try {
      const { data } = await axios.get('http://localhost:3000/trocoffers', {
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

      await axios.post(
        'http://localhost:3000/trocoffers',
        {
          title: newTrocOffer.title,
          description: newTrocOffer.description,
          creation_date: new Date().toISOString(),
          status: 'open',
          userId: decoded.userId // Utiliser l'ID décodé du token
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      showAlert('Offre de troc créée avec succès', 'success');
      setCreateDialogOpen(false);
      fetchTrocOffers();
      setNewTrocOffer({ title: '', description: '', status: 'open' });
    } catch (error: any) {
      if (error.response?.data) {
        const errorMessages = Object.values(error.response.data).join('\n');
        showAlert(errorMessages, 'error');
      } else {
        showAlert('Erreur lors de la création de l\'offre', 'error');
      }
    }
  };

  const showAlert = (message: string, severity: 'success' | 'error') => {
    setAlert({ open: true, message, severity });
  };

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

      <Grid container spacing={3}>
        {trocOffers.map((trocOffer) => (
          <Grid item xs={12} md={6} lg={4} key={trocOffer.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {trocOffer.title}
                </Typography>
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
                <Button size="small" color="primary">
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