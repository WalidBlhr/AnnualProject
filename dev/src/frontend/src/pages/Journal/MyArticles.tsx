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
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { API_URL } from '../../const';
import { Article } from '../../types/Articles';

const MyArticles: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    article: Article | null;
  }>({ open: false, article: null });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  
  const navigate = useNavigate();

  const fetchMyArticles = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Vous devez être connecté pour voir vos articles');
        return;
      }

      const response = await axios.get(`${API_URL}/journal/articles?author=me&limit=100`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      setArticles(response.data.data || []);
    } catch (error: any) {
      setError('Erreur lors du chargement de vos articles');
      console.error('Error fetching my articles:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyArticles();
  }, [fetchMyArticles]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, article: Article) => {
    setAnchorEl(event.currentTarget);
    setSelectedArticle(article);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedArticle(null);
  };

  const handleEdit = () => {
    if (selectedArticle) {
      navigate(`/journal/editor/${selectedArticle._id}`);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    if (selectedArticle) {
      setDeleteDialog({ open: true, article: selectedArticle });
    }
    handleMenuClose();
  };

  const confirmDelete = async () => {
    if (!deleteDialog.article) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/journal/articles/${deleteDialog.article._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setArticles(articles.filter(article => article._id !== deleteDialog.article!._id));
      setDeleteDialog({ open: false, article: null });
    } catch (error: any) {
      setError('Erreur lors de la suppression de l\'article');
      console.error('Error deleting article:', error);
    }
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

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Mes articles
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gérez vos articles publiés
          </Typography>
        </Box>
        <Button
          variant="contained"
          component={Link}
          to="/journal/editor"
          sx={{ height: 'fit-content' }}
        >
          Nouvel article
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {articles.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" gutterBottom>
            Vous n'avez encore écrit aucun article
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Commencez à partager vos histoires avec la communauté
          </Typography>
          <Button variant="contained" component={Link} to="/journal/editor">
            Écrire mon premier article
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {articles.map((article) => (
            <Grid item key={article._id} xs={12} md={6} lg={4}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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
                    <Typography variant="h6" component="h3" gutterBottom sx={{ mb: 0, flexGrow: 1 }}>
                      {article.title}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {!article.isPublic && (
                        <Chip 
                          label="Privé" 
                          size="small" 
                          color="warning" 
                          variant="outlined"
                        />
                      )}
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, article)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Chip label={article.category} size="small" variant="outlined" />
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(article.createdAt)}
                    </Typography>
                  </Box>

                  <Typography variant="body2" color="text.secondary">
                    {truncateContent(article.content)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Menu contextuel */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => selectedArticle && navigate(`/journal/article/${selectedArticle._id}`)}>
          <VisibilityIcon sx={{ mr: 1 }} />
          Voir l'article
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1 }} />
          Modifier
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Supprimer
        </MenuItem>
      </Menu>

      {/* Dialog de confirmation de suppression */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, article: null })}
      >
        <DialogTitle>Supprimer l'article</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir supprimer l'article "{deleteDialog.article?.title}" ?
            Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, article: null })}>
            Annuler
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MyArticles;
