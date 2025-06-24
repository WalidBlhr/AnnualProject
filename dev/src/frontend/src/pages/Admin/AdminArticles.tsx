import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import {
    Alert,
    Button,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    MenuItem,
    Paper,
    Select,
    Snackbar,
    Switch,
    Table, TableBody, TableCell, TableContainer, TableHead,
    TablePagination,
    TableRow,
    TextField,
    Typography
} from '@mui/material';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { API_URL } from '../../const';

interface Article {
  _id: string;
  title: string;
  category: string;
  isPublic: boolean;
  createdAt: string;
}

const AdminArticles: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [totalArticles, setTotalArticles] = useState<number>(0);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    category: '',
    isPublic: true
  });
  const [alert, setAlert] = useState<{ open: boolean; message: string; severity: 'success' | 'error'; }>({ open: false, message: '', severity: 'success' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterPublic, setFilterPublic] = useState('all');

  useEffect(() => {
    fetchArticles();
  }, [page, rowsPerPage, filterPublic]);

  const fetchArticles = async () => {
    try {
      let url = `${API_URL}/journal/articles?page=${page + 1}&limit=${rowsPerPage}`;
      if (filterPublic !== 'all') url += `&isPublic=${filterPublic}`;
      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setArticles(data.data);
      setTotalArticles(data.total);
    } catch (error) {
      showAlert('Erreur lors du chargement des articles', 'error');
    }
  };

  const handleEditClick = (article: Article) => {
    setEditingArticle(article);
    setEditFormData({
      title: article.title,
      category: article.category,
      isPublic: article.isPublic
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

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  const showAlert = (message: string, severity: 'success' | 'error') => setAlert({ open: true, message, severity });

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>Gestion des Articles</Typography>
      <Paper sx={{ mb: 2, p: 2 }}>
        <Select value={filterPublic} onChange={e => setFilterPublic(e.target.value)}>
          <MenuItem value="all">Tous</MenuItem>
          <MenuItem value="true">Public</MenuItem>
          <MenuItem value="false">Privé</MenuItem>
        </Select>
      </Paper>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Titre</TableCell>
              <TableCell>Catégorie</TableCell>
              <TableCell>Public</TableCell>
              <TableCell>Date de création</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {articles.map((article) => (
              <TableRow key={article._id}>
                <TableCell>{article._id}</TableCell>
                <TableCell>{article.title}</TableCell>
                <TableCell>{article.category}</TableCell>
                <TableCell>
                  <Switch
                    checked={article.isPublic}
                    onChange={async (e) => {
                      try {
                        await axios.put(`${API_URL}/journal/articles/${article._id}`, { ...article, isPublic: e.target.checked }, {
                          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                        });
                        fetchArticles();
                      } catch {
                        showAlert('Erreur lors du changement de statut', 'error');
                      }
                    }}
                  />
                </TableCell>
                <TableCell>{new Date(article.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEditClick(article)}><EditIcon /></IconButton>
                  <IconButton onClick={() => handleDeleteArticle(article._id)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalArticles}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Modifier l'article</DialogTitle>
        <DialogContent>
          <TextField margin="normal" fullWidth label="Titre" value={editFormData.title} onChange={e => setEditFormData({ ...editFormData, title: e.target.value })} />
          <TextField margin="normal" fullWidth label="Catégorie" value={editFormData.category} onChange={e => setEditFormData({ ...editFormData, category: e.target.value })} />
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