import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
    Alert,
    Button,
    Chip,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Snackbar,
    Switch,
    Table, TableBody, TableCell, TableContainer, TableHead,
    TablePagination,
    TableRow,
    TextField,
    Typography,
    Box
} from '@mui/material';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../const';
import AdminSearchAndSort from '../../components/AdminSearchAndSort';
import { useAdminSearchAndSort } from '../../hooks/useAdminSearchAndSort';

interface Article {
  _id: string;
  title: string;
  content: string;
  category: string;
  isPublic: boolean;
  status: string;
  author: number;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

interface ArticlesResponse {
  data: Article[];
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
};

const AdminArticles: React.FC = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [totalArticles, setTotalArticles] = useState<number>(0);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    content: '',
    category: '',
    isPublic: true,
    status: 'published'
  });
  const [alert, setAlert] = useState<{ open: boolean; message: string; severity: 'success' | 'error'; }>({ open: false, message: '', severity: 'success' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterPublic, setFilterPublic] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Configuration de la recherche et du tri
  const searchFields: (keyof Article)[] = ['title', 'authorName', 'category', 'content'];
  const sortOptions = [
    { value: 'title', label: 'Titre' },
    { value: 'authorName', label: 'Auteur' },
    { value: 'category', label: 'Catégorie' },
    { value: 'status', label: 'Statut' },
    { value: 'createdAt', label: 'Date de création' },
    { value: 'updatedAt', label: 'Date de modification' }
  ];

  const {
    searchValue,
    sortConfig,
    filteredAndSortedData,
    handleSearchChange,
    handleSearchClear,
    handleSortChange
  } = useAdminSearchAndSort({ data: articles, searchFields });

  // Application des filtres supplémentaires
  const finalFilteredData = (filteredAndSortedData as Article[]).filter((article: Article) => {
    // Recherche dans les champs spécifiés
    if (searchValue) {
      const searchLower = searchValue.toLowerCase();
      const matchesSearch = searchFields.some(field => {
        const value = article[field as keyof Article];
        return value && value.toString().toLowerCase().includes(searchLower);
      });
      if (!matchesSearch) return false;
    }
    
    if (filterPublic !== 'all' && article.isPublic.toString() !== filterPublic) return false;
    if (filterStatus !== 'all' && article.status !== filterStatus) return false;
    return true;
  });

  // Pagination des données filtrées
  const paginatedArticles = finalFilteredData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const categories = ['Actualités', 'Lifestyle', 'Cuisine', 'Jardinage', 'Bricolage', 'Sport', 'Culture', 'Technologie', 'Autre'];
  const statuses = ['draft', 'published', 'archived'];

  useEffect(() => {
    fetchArticles();
  }, [filterPublic, filterStatus]);

  const fetchArticles = async () => {
    try {
      let url = `${API_URL}/journal/articles?page=1&limit=1000`;
      if (filterPublic !== 'all') url += `&isPublic=${filterPublic}`;
      if (filterStatus !== 'all') url += `&status=${filterStatus}`;
      
      const { data } = await axios.get<ArticlesResponse>(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setArticles(data.data);
      setTotalArticles(data.total_count);
    } catch (error) {
      showAlert('Erreur lors du chargement des articles', 'error');
    }
  };

  const handleEditClick = (article: Article) => {
    setEditingArticle(article);
    setEditFormData({
      title: article.title,
      content: article.content,
      category: article.category,
      isPublic: article.isPublic,
      status: article.status || 'published'
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editingArticle) return;
    try {
      await axios.put(`${API_URL}/journal/articles/${editingArticle._id}`, editFormData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      showAlert('Article modifié avec succès', 'success');
      setEditDialogOpen(false);
      fetchArticles();
    } catch (error) {
      showAlert('Erreur lors de la modification', 'error');
    }
  };

  const handleDeleteArticle = async (articleId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) return;
    try {
      await axios.delete(`${API_URL}/journal/articles/${articleId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      showAlert('Article supprimé avec succès', 'success');
      fetchArticles();
    } catch (error) {
      showAlert('Erreur lors de la suppression', 'error');
    }
  };

  const handleViewArticle = (articleId: string) => {
    navigate(`/journal/article/${articleId}`);
  };

  const handleTogglePublic = async (article: Article, isPublic: boolean) => {
    try {
      await axios.put(`${API_URL}/journal/articles/${article._id}`, { ...article, isPublic }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      showAlert(`Article ${isPublic ? 'rendu public' : 'rendu privé'} avec succès`, 'success');
      fetchArticles();
    } catch (error) {
      showAlert('Erreur lors du changement de statut', 'error');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'success';
      case 'draft': return 'warning';
      case 'archived': return 'default';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'published': return 'Publié';
      case 'draft': return 'Brouillon';
      case 'archived': return 'Archivé';
      default: return status;
    }
  };

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [searchValue, filterPublic, filterStatus]);
  
  const showAlert = (message: string, severity: 'success' | 'error') => setAlert({ open: true, message, severity });

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>Gestion des Articles</Typography>
      
      {/* Recherche et tri */}
      <AdminSearchAndSort
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        onSearchClear={handleSearchClear}
        sortConfig={sortConfig}
        onSortChange={handleSortChange}
        sortOptions={sortOptions}
      />
      
      {/* Filtres */}
      <Paper sx={{ mb: 2, p: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Visibilité</InputLabel>
            <Select value={filterPublic} onChange={e => setFilterPublic(e.target.value)}>
              <MenuItem value="all">Tous</MenuItem>
              <MenuItem value="true">Public</MenuItem>
              <MenuItem value="false">Privé</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Statut</InputLabel>
            <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <MenuItem value="all">Tous</MenuItem>
              <MenuItem value="published">Publié</MenuItem>
              <MenuItem value="draft">Brouillon</MenuItem>
              <MenuItem value="archived">Archivé</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Titre</TableCell>
              <TableCell>Auteur</TableCell>
              <TableCell>Catégorie</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Public</TableCell>
              <TableCell>Date de création</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedArticles.map((article) => (
              <TableRow key={article._id}>
                <TableCell sx={{ maxWidth: 200 }}>
                  <Typography variant="body2" noWrap title={article.title}>
                    {article.title}
                  </Typography>
                </TableCell>
                <TableCell>{article.authorName || 'Inconnu'}</TableCell>
                <TableCell>{article.category}</TableCell>
                <TableCell>
                  <Chip 
                    label={getStatusLabel(article.status || 'published')} 
                    color={getStatusColor(article.status || 'published')}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={article.isPublic}
                    onChange={(e) => handleTogglePublic(article, e.target.checked)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{new Date(article.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <IconButton 
                    onClick={() => handleViewArticle(article._id)} 
                    title="Voir l'article"
                    size="small"
                  >
                    <VisibilityIcon />
                  </IconButton>
                  <IconButton 
                    onClick={() => handleEditClick(article)} 
                    title="Modifier"
                    size="small"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    onClick={() => handleDeleteArticle(article._id)} 
                    title="Supprimer"
                    size="small"
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={finalFilteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Dialog d'édition */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Modifier l'article</DialogTitle>
        <DialogContent>
          <TextField 
            margin="normal" 
            fullWidth 
            label="Titre" 
            value={editFormData.title} 
            onChange={e => setEditFormData({ ...editFormData, title: e.target.value })} 
          />
          <TextField 
            margin="normal" 
            fullWidth 
            multiline
            rows={4}
            label="Contenu" 
            value={editFormData.content} 
            onChange={e => setEditFormData({ ...editFormData, content: e.target.value })} 
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Catégorie</InputLabel>
            <Select 
              value={editFormData.category} 
              onChange={e => setEditFormData({ ...editFormData, category: e.target.value })}
            >
              {categories.map(cat => (
                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Statut</InputLabel>
            <Select 
              value={editFormData.status} 
              onChange={e => setEditFormData({ ...editFormData, status: e.target.value })}
            >
              {statuses.map(status => (
                <MenuItem key={status} value={status}>{getStatusLabel(status)}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Annuler</Button>
          <Button onClick={handleEditSubmit} variant="contained">Enregistrer</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={alert.open} autoHideDuration={6000} onClose={() => setAlert({ ...alert, open: false })}>
        <Alert severity={alert.severity} onClose={() => setAlert({ ...alert, open: false })}>{alert.message}</Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminArticles; 