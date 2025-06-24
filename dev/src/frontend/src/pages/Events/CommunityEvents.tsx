import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Divider,
  Pagination,
  Snackbar,
  Alert,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent
} from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import EventIcon from '@mui/icons-material/Event';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import GroupIcon from '@mui/icons-material/Group';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import DeleteIcon from '@mui/icons-material/Delete';
import CelebrationIcon from '@mui/icons-material/Celebration';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
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
  category: string;
  description?: string;
  equipment_needed?: string;
}

interface EventsResponse {
  data: Event[];
  page_size: number;
  page: number;
  total_count: number;
  total_pages: number;
}

const CommunityEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [category, setCategory] = useState<string>('');
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents();
  }, [page, category]);

  const fetchEvents = async () => {
    try {
      let url = `${API_URL}/events?page=${page}&limit=6&type=community`;
      
      if (category) {
        url += `&category=${category}`;
      }
      
      const { data } = await axios.get<EventsResponse>(
        url,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      // Filtrer les événements côté client si nécessaire
      const filteredEvents = data.data.filter(event => event.status === 'open' || event.status === 'pending');
      
      setEvents(filteredEvents);
      setTotalPages(data.total_pages);
    } catch (error) {
      showAlert('Erreur lors du chargement des événements', 'error');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'success';
      case 'closed':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cleaning':
        return <CleaningServicesIcon />;
      case 'waste_collection':
        return <DeleteIcon />;
      case 'neighborhood_party':
        return <CelebrationIcon />;
      default:
        return <VolunteerActivismIcon />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'cleaning':
        return 'Nettoyage';
      case 'waste_collection':
        return 'Collecte de déchets';
      case 'neighborhood_party':
        return 'Fête de quartier';
      default:
        return 'Autre';
    }
  };

  const showAlert = (message: string, severity: 'success' | 'error') => {
    setAlert({ open: true, message, severity });
  };

  const handleChangePage = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleCategoryChange = (event: SelectChangeEvent) => {
    setCategory(event.target.value);
    setPage(1); // Reset page when changing category
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Événements Communautaires
      </Typography>
      <Typography variant="subtitle1" gutterBottom color="text.secondary">
        Participez aux activités qui améliorent notre quartier ensemble
      </Typography>

      <Box sx={{ mb: 3 }}>
        <FormControl variant="outlined" sx={{ minWidth: 240 }}>
          <InputLabel id="category-filter-label">Filtrer par catégorie</InputLabel>
          <Select
            labelId="category-filter-label"
            id="category-filter"
            value={category}
            onChange={handleCategoryChange}
            label="Filtrer par catégorie"
          >
            <MenuItem value="">Toutes les catégories</MenuItem>
            <MenuItem value="cleaning">Nettoyage</MenuItem>
            <MenuItem value="waste_collection">Collecte de déchets</MenuItem>
            <MenuItem value="neighborhood_party">Fête de quartier</MenuItem>
            <MenuItem value="other">Autre</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3}>
        {events.length === 0 ? (
          <Box sx={{ width: '100%', textAlign: 'center', py: 4 }}>
            <Typography variant="body1">
              Aucun événement communautaire disponible pour le moment.
            </Typography>
          </Box>
        ) : (
          events.map((event) => (
            <Grid item xs={12} sm={6} md={4} key={event.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    {getCategoryIcon(event.category)}
                    <Typography variant="h6" component="div" sx={{ ml: 1 }}>
                      {event.name}
                    </Typography>
                  </Box>
                  
                  <Chip 
                    label={getCategoryLabel(event.category)}
                    color="primary"
                    size="small"
                    sx={{ mb: 2 }}
                  />

                  <Typography variant="body2" color="text.secondary" gutterBottom noWrap>
                    {event.description || "Pas de description"}
                  </Typography>

                  <Divider sx={{ my: 1 }} />

                  <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EventIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(event.date)}
                    </Typography>
                  </Box>

                  <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOnIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {event.location}
                    </Typography>
                  </Box>

                  <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <GroupIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {`${event.min_participants > 0 ? `Min: ${event.min_participants}, ` : ''}Max: ${event.max_participants} participants`}
                    </Typography>
                  </Box>

                  <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip
                      label={event.status}
                      color={getStatusColor(event.status) as any}
                      size="small"
                    />
                    {event.equipment_needed && (
                      <Chip
                        label="Matériel requis"
                        color="secondary"
                        size="small"
                      />
                    )}
                  </Box>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    variant="contained" 
                    fullWidth
                    onClick={() => navigate(`/events/${event.id}`)}
                  >
                    Détails et inscription
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {totalPages > 1 && (
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <Pagination 
            count={totalPages} 
            page={page} 
            onChange={handleChangePage} 
            color="primary" 
          />
        </Box>
      )}

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

export default CommunityEvents;