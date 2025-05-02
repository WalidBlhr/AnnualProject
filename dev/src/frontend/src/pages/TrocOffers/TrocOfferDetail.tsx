import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
  Grid,
  Chip,
  Divider,
  Box,
  Alert,
  Snackbar,
} from '@mui/material';
import axios from 'axios';
import jwtDecode from 'jwt-decode';

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

const TrocOfferDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [trocOffer, setTrocOffer] = useState<TrocOffer | null>(null);
  const [alert, setAlert] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchTrocOfferDetails();
  }, [id]);

  const fetchTrocOfferDetails = async () => {
    try {
      const { data } = await axios.get(`http://localhost:3000/trocoffers/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setTrocOffer(data);
    } catch (error) {
      showAlert('Erreur lors du chargement des détails de l\'offre', 'error');
    }
  };

  const handleDeleteTrocOffer = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette offre ?')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:3000/trocoffers/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      showAlert('Offre supprimée avec succès', 'success');
      setTimeout(() => navigate('/trocs'), 2000);
    } catch (error) {
      showAlert('Erreur lors de la suppression de l\'offre', 'error');
    }
  };

  const showAlert = (message: string, severity: 'success' | 'error') => {
    setAlert({ open: true, message, severity });
  };

  // Ajoutez cette fonction pour vérifier si l'utilisateur est le propriétaire
  const isOwner = () => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    const decoded = jwtDecode<{ userId: number }>(token);
    return decoded.userId === trocOffer?.user?.id;
  };

  if (!trocOffer) {
    return <Container>Chargement...</Container>;
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h4" component="h1">
                {trocOffer.title}
              </Typography>
              <Chip 
                label={trocOffer.status} 
                color={trocOffer.status === 'open' ? 'success' : 'default'}
              />
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          <Grid item xs={12}>
            <Typography color="textSecondary" gutterBottom>
              Proposé par {trocOffer.user?.firstname || 'Utilisateur'} {trocOffer.user?.lastname || ''}
            </Typography>
            <Typography variant="caption" display="block">
              Créé le {new Date(trocOffer.creation_date).toLocaleDateString()}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6">Description</Typography>
            <Typography paragraph>
              {trocOffer.description}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          <Grid item xs={12}>
            <Box display="flex" gap={2}>
              {isOwner() ? (
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => navigate('/messages')} // Redirection vers la page des messages
                >
                  Voir mes messages
                </Button>
              ) : (
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => navigate(`/messages/${trocOffer.user.id}`)}
                >
                  Contacter le propriétaire
                </Button>
              )}
              {isOwner() && (
                <Button 
                  variant="outlined" 
                  color="error"
                  onClick={handleDeleteTrocOffer}
                >
                  Supprimer l'offre
                </Button>
              )}
              <Button 
                variant="outlined"
                onClick={() => navigate('/trocs')}
              >
                Retour à la liste
              </Button>
            </Box>
          </Grid>
        </Grid>
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

export default TrocOfferDetail;
