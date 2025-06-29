import AddIcon from '@mui/icons-material/Add';
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
    Paper,
    Snackbar,
    Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow,
    TextField,
    Typography
} from '@mui/material';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { API_URL } from '../../const';

export interface Category {
  _id: string;
  name: string;
  description?: string;
}

export interface CategoriesResponse {
  data: Category[];
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
};

const AdminCategories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalCategories, setTotalCategories] = useState<number>(0);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({ name: '', description: '' });
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({ name: '', description: '' });
  const [alert, setAlert] = useState<{ open: boolean; message: string; severity: 'success' | 'error'; }>({ open: false, message: '', severity: 'success' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchCategories();
  }, [page, rowsPerPage]);

  const fetchCategories = async () => {
    try {
      const { data } = await axios.get<CategoriesResponse>(API_URL + '/journal/categories', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setCategories(data.data);
      setTotalCategories(data.total_count);
    } catch (error) {
      showAlert('Erreur lors du chargement des catégories', 'error');
    }
  };

  const handleEditClick = (category: Category) => {
    setEditingCategory(category);
    setEditFormData({ name: category.name, description: category.description || '' });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editingCategory) return;
    try {
      await axios.put(`${API_URL}/journal/categories/${editingCategory._id}`, editFormData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      showAlert('Catégorie modifiée avec succès', 'success');
      setEditDialogOpen(false);
      fetchCategories();
    } catch (error) {
      showAlert('Erreur lors de la modification', 'error');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) return;
    try {
      await axios.delete(`${API_URL}/journal/categories/${categoryId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      showAlert('Catégorie supprimée avec succès', 'success');
      fetchCategories();
    } catch (error) {
      showAlert('Erreur lors de la suppression', 'error');
    }
  };

  const handleAddSubmit = async () => {
    try {
      await axios.post(API_URL + '/journal/categories', addFormData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      showAlert('Catégorie ajoutée avec succès', 'success');
      setAddDialogOpen(false);
      setAddFormData({ name: '', description: '' });
      fetchCategories();
    } catch (error) {
      showAlert('Erreur lors de l\'ajout', 'error');
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
      <Typography variant="h4" gutterBottom>Gestion des Catégories d'Articles</Typography>
      <Button variant="contained" startIcon={<AddIcon />} sx={{ mb: 2 }} onClick={() => setAddDialogOpen(true)}>
        Ajouter une catégorie
      </Button>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nom</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category._id}>
                <TableCell>{category._id}</TableCell>
                <TableCell>{category.name}</TableCell>
                <TableCell>{category.description}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEditClick(category)}><EditIcon /></IconButton>
                  <IconButton onClick={() => handleDeleteCategory(category._id)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalCategories}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
      {/* Dialog édition */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Modifier la catégorie</DialogTitle>
        <DialogContent>
          <TextField margin="normal" fullWidth label="Nom" value={editFormData.name} onChange={e => setEditFormData({ ...editFormData, name: e.target.value })} />
          <TextField margin="normal" fullWidth label="Description" value={editFormData.description} onChange={e => setEditFormData({ ...editFormData, description: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Annuler</Button>
          <Button onClick={handleEditSubmit} variant="contained">Enregistrer</Button>
        </DialogActions>
      </Dialog>
      {/* Dialog ajout */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)}>
        <DialogTitle>Ajouter une catégorie</DialogTitle>
        <DialogContent>
          <TextField margin="normal" fullWidth label="Nom" value={addFormData.name} onChange={e => setAddFormData({ ...addFormData, name: e.target.value })} />
          <TextField margin="normal" fullWidth label="Description" value={addFormData.description} onChange={e => setAddFormData({ ...addFormData, description: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Annuler</Button>
          <Button onClick={handleAddSubmit} variant="contained">Ajouter</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={alert.open} autoHideDuration={6000} onClose={() => setAlert({ ...alert, open: false })}>
        <Alert severity={alert.severity} onClose={() => setAlert({ ...alert, open: false })}>{alert.message}</Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminCategories; 