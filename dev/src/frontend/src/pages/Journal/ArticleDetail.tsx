import {useEffect, useState} from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Divider, 
  Chip,
  Paper,
  Button,
  Avatar,
  Breadcrumbs,
  Link as MuiLink,
  Skeleton,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import {Link, useNavigate, useParams} from 'react-router-dom';
import axios from 'axios';
import DateRangeIcon from '@mui/icons-material/DateRange';
import PersonIcon from '@mui/icons-material/Person';
import CategoryIcon from '@mui/icons-material/Category';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {useAuth} from '../../contexts/AuthContext';
import {Article} from '../../types/Articles';

interface RelatedArticle {
  _id: string;
  title: string;
  summary: string;
  image_url?: string;
  category: string;
  createdAt: string;
}

const ArticleDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<RelatedArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  const {user} = useAuth();
  const isAuthor = user && article && user.userId === article.author.id;
  
  useEffect(() => {
    fetchArticle();
  }, [id]);
  
  const fetchArticle = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const config = token ? {
        headers: { Authorization: `Bearer ${token}` }
      } : {};
      
      const { data } = await axios.get<Article>(`http://localhost:3000/journal/articles/${id}`, config);
      setArticle(data);
      
      // Fetch related articles
      fetchRelatedArticles(data.category);
    } catch (err) {
      console.error('Error fetching article:', err);
      setError('Impossible de charger l\'article. Veuillez réessayer plus tard.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchRelatedArticles = async (category: string) => {
    try {
      const token = localStorage.getItem('token');
      const config = token ? {
        headers: { Authorization: `Bearer ${token}` }
      } : {};
      
      const { data } = await axios.get<{ data: RelatedArticle[] }>(
        'http://localhost:3000/journal/articles', 
        {
          ...config,
          params: {
            category,
            limit: 3,
            exclude: id
          }
        }
      );
      
      setRelatedArticles(data.data);
    } catch (err) {
      console.error('Error fetching related articles:', err);
    }
  };
  
  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !isAuthor) return;
      
      await axios.delete(`http://localhost:3000/journal/articles/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      navigate('/journal');
    } catch (err) {
      console.error('Error deleting article:', err);
      setError('Une erreur est survenue lors de la suppression de l\'article.');
    } finally {
      setConfirmDelete(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };
  
  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', mb: 3, gap: 1 }}>
          <Skeleton variant="circular" width={40} height={40} />
          <Skeleton variant="text" width={150} />
        </Box>
        <Skeleton variant="rectangular" height={300} sx={{ mb: 2 }} />
        <Skeleton variant="text" height={30} sx={{ mb: 1 }} />
        <Skeleton variant="text" height={30} sx={{ mb: 1 }} />
        <Skeleton variant="text" height={30} sx={{ mb: 1 }} />
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2 }}
          component={Link}
          to="/journal"
        >
          Retour au journal
        </Button>
      </Container>
    );
  }
  
  if (!article) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
        <Alert severity="info">Cet article n'existe pas ou a été supprimé.</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2 }}
          component={Link}
          to="/journal"
        >
          Retour au journal
        </Button>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
      {/* Breadcrumbs navigation */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <MuiLink component={Link} to="/" color="inherit">
          Accueil
        </MuiLink>
        <MuiLink component={Link} to="/journal" color="inherit">
          Journal
        </MuiLink>
        <Typography color="text.primary">{article.title}</Typography>
      </Breadcrumbs>
      
      {/* Article header */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          {article.title}
        </Typography>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ mr: 1, bgcolor: 'primary.main' }}>
              <PersonIcon />
            </Avatar>
            <Typography variant="body2">
              {article.authorName}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <DateRangeIcon sx={{ mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {formatDate(article.createdAt)}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CategoryIcon sx={{ mr: 1, color: 'text.secondary' }} />
            <Chip 
              label={article.category} 
              size="small" 
              color="primary" 
              component={Link} 
              to={`/journal/all?category=${article.category}`}
              clickable
            />
          </Box>
        </Box>
      </Paper>
      
      {/* Image de couverture */}
      {article.image_url && (
        <Box sx={{ mb: 4, borderRadius: 2, overflow: 'hidden' }}>
          <img 
            src={article.image_url} 
            alt={article.title} 
            style={{ width: '100%', maxHeight: '500px', objectFit: 'cover' }}
          />
        </Box>
      )}
      
      {/* Article content */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="body1" paragraph>
          {article.content}
        </Typography>
      </Box>
      
      {/* Article tags */}
      {article.tags && article.tags.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle2" gutterBottom>
            Tags:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {article.tags.map((tag) => (
              <Chip 
                key={tag} 
                label={tag} 
                size="small" 
                variant="outlined" 
                component={Link} 
                to={`/journal/all?tag=${tag}`}
                clickable
              />
            ))}
          </Box>
        </Box>
      )}
      
      {/* Author actions */}
      {isAuthor && (
        <Box sx={{ mb: 4, display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<EditIcon />}
            component={Link}
            to={`/journal/editor/${id}`}
          >
            Modifier l'article
          </Button>
          
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setConfirmDelete(true)}
          >
            Supprimer
          </Button>
        </Box>
      )}
      
      <Divider sx={{ my: 4 }} />
      
      {/* Related articles */}
      {relatedArticles.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Articles similaires
          </Typography>
          <Grid container spacing={3}>
            {relatedArticles.map((relatedArticle) => (
              <Grid item key={relatedArticle._id} xs={12} sm={6} md={4}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: '0.2s',
                    '&:hover': { transform: 'translateY(-5px)', boxShadow: 4 }
                  }}
                >
                  {relatedArticle.image_url && (
                    <CardMedia
                      component="img"
                      height="140"
                      image={relatedArticle.image_url}
                      alt={relatedArticle.title}
                    />
                  )}
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="h3" gutterBottom>
                      {relatedArticle.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(relatedArticle.createdAt)}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      component={Link} 
                      to={`/journal/article/${relatedArticle._id}`}
                    >
                      Lire l'article
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
      
      {/* Back to journal button */}
      <Box sx={{ textAlign: 'center' }}>
        <Button
          variant="contained"
          color="primary"
          component={Link}
          to="/journal"
          startIcon={<ArrowBackIcon />}
        >
          Retour au journal
        </Button>
      </Box>
      
      {/* Confirmation dialog */}
      <Dialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
      >
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir supprimer cet article ? Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)}>
            Annuler
          </Button>
          <Button onClick={handleDelete} color="error" autoFocus>
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ArticleDetail;