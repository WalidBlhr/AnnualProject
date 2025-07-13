import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Pagination,
  SelectChangeEvent,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { API_URL } from '../../const';
import { Article } from '../../types/Articles';

interface Category {
  _id: string;
  name: string;
  description?: string;
}

const AllArticles: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState('all'); // 'all', 'public', 'private'
  
  const location = useLocation();
  const navigate = useNavigate();
  
  // Vérifier si l'utilisateur est connecté
  const token = localStorage.getItem('token');

  // Parse query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const category = params.get('category');
    const search = params.get('search');
    const page = params.get('page');

    if (category) setSelectedCategory(category);
    if (search) setSearchTerm(search);
    if (page) setCurrentPage(parseInt(page));
  }, [location.search]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/journal/categories?limit=100`);
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
      });

      if (selectedCategory) {
        params.append('category', selectedCategory);
      }

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      // Gestion du filtre de visibilité
      if (visibilityFilter === 'public') {
        params.append('isPublic', 'true');
      } else if (visibilityFilter === 'private') {
        params.append('isPublic', 'false');
      }
      // Si 'all', on ne met pas de paramètre isPublic pour laisser le backend gérer

      const config: any = {};
      if (token) {
        config.headers = {
          Authorization: `Bearer ${token}`,
        };
      }

      const response = await axios.get(`${API_URL}/journal/articles?${params}`, config);
      setArticles(response.data.data || []);
      setTotalPages(response.data.total_pages || 1);
    } catch (error: any) {
      setError('Erreur lors du chargement des articles');
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedCategory, searchTerm, visibilityFilter, token]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleCategoryChange = (event: SelectChangeEvent) => {
    const category = event.target.value;
    setSelectedCategory(category);
    setCurrentPage(1);
    updateURL({ category, search: searchTerm, page: 1 });
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const search = event.target.value;
    setSearchTerm(search);
    setCurrentPage(1);
    updateURL({ category: selectedCategory, search, page: 1 });
  };

  const handleVisibilityChange = (event: SelectChangeEvent) => {
    const visibility = event.target.value;
    setVisibilityFilter(visibility);
    setCurrentPage(1);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
    updateURL({ category: selectedCategory, search: searchTerm, page });
  };

  const updateURL = ({ category, search, page }: { category: string; search: string; page: number }) => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (search) params.set('search', search);
    if (page > 1) params.set('page', page.toString());

    const queryString = params.toString();
    navigate(`/journal/all${queryString ? `?${queryString}` : ''}`, { replace: true });
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMMM yyyy', { locale: fr });
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    const textContent = content.replace(/<[^>]*>/g, '');
    return textContent.length > maxLength 
      ? textContent.substring(0, maxLength) + '...'
      : textContent;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Tous les articles
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {!token 
            ? "Découvrez tous les articles publics de notre communauté"
            : visibilityFilter === 'public' 
              ? "Articles publics de la communauté"
              : visibilityFilter === 'private'
                ? "Vos articles privés"
                : "Articles publics et vos articles privés"
          }
        </Typography>
      </Box>

      {/* Filtres */}
      <Box sx={{ mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Catégorie</InputLabel>
          <Select
            value={selectedCategory}
            label="Catégorie"
            onChange={handleCategoryChange}
          >
            <MenuItem value="">Toutes les catégories</MenuItem>
            {Array.isArray(categories) && categories.map((category) => (
              <MenuItem key={category._id} value={category.name}>
                {category.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Rechercher"
          variant="outlined"
          value={searchTerm}
          onChange={handleSearchChange}
          sx={{ flexGrow: 1, maxWidth: 400 }}
          placeholder="Rechercher dans les articles..."
        />

        {/* Filtre de visibilité - affiché seulement si connecté */}
        {token && (
          <FormControl sx={{ minWidth: 180 }}>
            <InputLabel>Visibilité</InputLabel>
            <Select
              value={visibilityFilter}
              label="Visibilité"
              onChange={handleVisibilityChange}
            >
              <MenuItem value="all">Tous mes articles</MenuItem>
              <MenuItem value="public">Articles publics</MenuItem>
              <MenuItem value="private">Mes articles privés</MenuItem>
            </Select>
          </FormControl>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {articles.length === 0 ? (
            <Alert severity="info">
              Aucun article trouvé avec les critères sélectionnés.
            </Alert>
          ) : (
            <>
              <Grid container spacing={3}>
                {articles.map((article) => (
                  <Grid item xs={12} sm={6} md={4} key={article._id}>
                    <Card 
                      sx={{ 
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column',
                        transition: '0.2s',
                        '&:hover': { 
                          transform: 'translateY(-4px)', 
                          boxShadow: 4 
                        }
                      }}
                    >
                      {article.imageUrl && (
                        <CardMedia
                          component="img"
                          height="200"
                          image={article.imageUrl}
                          alt={article.title}
                          sx={{ objectFit: 'cover' }}
                        />
                      )}
                      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Typography variant="h6" component="h2" gutterBottom sx={{ mb: 0 }}>
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
                        
                        <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1, mb: 2 }}>
                          {truncateContent(article.content)}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Chip 
                            label={article.category} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                          />
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(article.createdAt)}
                          </Typography>
                        </Box>
                        
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 2 }}>
                          Par {article.authorName}
                        </Typography>
                        
                        <Button
                          component={Link}
                          to={`/journal/article/${article._id}`}
                          variant="outlined"
                          size="small"
                          sx={{ mt: 'auto' }}
                        >
                          Lire la suite
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={handlePageChange}
                    color="primary"
                    size="large"
                  />
                </Box>
              )}
            </>
          )}
        </>
      )}
    </Container>
  );
};

export default AllArticles;
