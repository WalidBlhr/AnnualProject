import React, {useEffect, useState, useCallback} from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  CardActions,
  Button,
  Chip,
  Paper,
  TextField,
  InputAdornment,
  IconButton,
  Tabs,
  Tab
} from '@mui/material';
import {Link, useNavigate} from 'react-router-dom';
import axios from 'axios';
import SearchIcon from '@mui/icons-material/Search';
import DateRangeIcon from '@mui/icons-material/DateRange';
import PersonIcon from '@mui/icons-material/Person';
import CategoryIcon from '@mui/icons-material/Category';
import { Article } from '../../types/Articles';
import { API_URL } from '../../const';
import { CategoriesResponse, Category } from '../Admin/AdminCategories';

const JournalHome: React.FC = () => {
  const navigate = useNavigate();
  const [featuredArticles, setFeaturedArticles] = useState<Article[]>([]);
  const [recentArticles, setRecentArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  
  // Récupérer l'ID utilisateur si connecté
  const token = localStorage.getItem('token');

  const fetchFeaturedArticles = useCallback(async () => {
    try {
      const config = token ? {
        headers: { Authorization: `Bearer ${token}` }
      } : {};

      const { data } = await axios.get<{ data: Article[] }>(API_URL + '/journal/articles', { 
        ...config,
        params: {
          featured: true,
          limit: 3
        } 
      });
      console.log(data.data)
      setFeaturedArticles(data.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des articles à la une:', error);
    }
  }, [token]);

  const fetchRecentArticles = useCallback(async () => {
    try {
      const config = token ? {
        headers: { Authorization: `Bearer ${token}` }
      } : {};

      const { data } = await axios.get<{ data: Article[] }>(API_URL + '/journal/articles', { 
        ...config,
        params: {
          limit: 6
        } 
      });
      setRecentArticles(data.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des articles récents:', error);
    }
  }, [token]);

  useEffect(() => {
    fetchFeaturedArticles();
    fetchRecentArticles();
    fetchCategories();
  }, [fetchFeaturedArticles, fetchRecentArticles]);

  const fetchCategories = async () => {
    
    try {
      const res = await axios.get<CategoriesResponse>(API_URL + '/journal/categories');
      setCategories(res.data.data); // TODO Retyper les catégories
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories:', error);
    }
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      navigate(`/journal/all?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    
    if (newValue === 0) {
      // "Tous les articles" - rediriger vers /journal/all sans filtre
      navigate('/journal/all');
    } else {
      // Catégorie spécifique - rediriger avec le filtre de catégorie
      const selectedCategory = categories[newValue - 1]; // -1 car l'index 0 est "Tous les articles"
      if (selectedCategory) {
        navigate(`/journal/all?category=${encodeURIComponent(selectedCategory.name)}`);
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Journal de Quartier
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" align="center" sx={{ maxWidth: 700 }}>
          Toute l'actualité de votre quartier, les évènements à venir et les histoires de vos voisins
        </Typography>
        
        {/* Barre de recherche */}
        <Box sx={{ width: '100%', maxWidth: 600, mt: 3 }}>
          <TextField
            fullWidth
            placeholder="Rechercher un article..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={handleSearch}>
                    <SearchIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
          />
        </Box>
      </Box>

      {/* Articles à la une */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" component="h2" gutterBottom>
          À la une
        </Typography>
        <Grid container spacing={3}>
          {featuredArticles.length > 0 ? (
            featuredArticles.map((article) => (
              <Grid item key={article._id} xs={12} md={4}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: '0.3s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: 6
                    }
                  }}
                >
                  {article.imageUrl && (
                    <CardMedia
                      component="img"
                      height="200"
                      image={article.imageUrl}
                      alt={article.title}
                    />
                  )}
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="h6" component="h3" gutterBottom sx={{ mb: 0 }}>
                        {article.title}
                      </Typography>
                      {!article.isPublic && (
                        <Chip 
                          label="Privé" 
                          size="small" 
                          color="warning" 
                          variant="outlined"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', mb: 1, alignItems: 'center' }}>
                      <CategoryIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {article.category}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', mb: 2, alignItems: 'center' }}>
                      <DateRangeIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(article.createdAt)}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {article.summary}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      component={Link} 
                      to={`/journal/article/${article._id}`}
                    >
                      Lire la suite
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Typography variant="body1" align="center">
                Aucun article à la une pour le moment.
              </Typography>
            </Grid>
          )}
        </Grid>
      </Box>

      {/* Navigation par catégories */}
      <Box sx={{ mb: 4 }}>
        <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.paper' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Tous les articles" />
            {categories.map((category) => (
              <Tab key={category.name} label={category.name} />
            ))}
          </Tabs>
        </Paper>
      </Box>

      {/* Articles récents */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" component="h2" gutterBottom>
          Articles récents
        </Typography>
        <Grid container spacing={3}>
          {recentArticles.length > 0 ? (
            recentArticles.map((article) => (
              <Grid item key={article._id} xs={12} sm={6} md={4}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {article.imageUrl && (
                    <CardMedia
                      component="img"
                      height="140"
                      image={article.imageUrl}
                      alt={article.title}
                    />
                  )}
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="h6" component="h3" gutterBottom sx={{ mb: 0 }}>
                        {article.title}
                      </Typography>
                      {!article.isPublic && (
                        <Chip 
                          label="Privé" 
                          size="small" 
                          color="warning" 
                          variant="outlined"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', mb: 1, alignItems: 'center' }}>
                      <PersonIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {article.author ? 
                          `${article.author.firstname} ${article.author.lastname}` : 
                          article.authorName || 'Auteur inconnu'
                        }
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', mb: 2, alignItems: 'center' }}>
                      <DateRangeIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(article.createdAt)}
                      </Typography>
                    </Box>
                    <Typography variant="body2" paragraph>
                      {article.summary}
                    </Typography>
                    {article.tags && article.tags.length > 0 && (
                      <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {article.tags.map(tag => (
                          <Chip 
                            key={tag} 
                            label={tag} 
                            size="small" 
                            color="primary" 
                            variant="outlined" 
                          />
                        ))}
                      </Box>
                    )}
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      component={Link} 
                      to={`/journal/article/${article._id}`}
                    >
                      Lire la suite
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Typography variant="body1" align="center">
                Aucun article récent pour le moment.
              </Typography>
            </Grid>
          )}
        </Grid>
        
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Button 
            variant="contained" 
            component={Link} 
            to="/journal/all"
          >
            Voir tous les articles
          </Button>
        </Box>
      </Box>

      {/* Section écrire un article */}
      {token && (
        <Paper elevation={3} sx={{ p: 3, mb: 6, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            Vous avez une histoire à partager?
          </Typography>
          <Typography variant="body1" paragraph>
            Contribuez au journal de votre quartier en partageant vos histoires, événements ou actualités!
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            component={Link}
            to="/journal/editor"
            size="large"
          >
            Rédiger un article
          </Button>
        </Paper>
      )}
    </Container>
  );
};

export default JournalHome;