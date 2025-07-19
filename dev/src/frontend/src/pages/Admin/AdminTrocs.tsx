import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import {
  Alert,
  Box,
  Button,
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
  Table, TableBody, TableCell, TableContainer, TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import { styled } from '@mui/material/styles';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { API_URL } from '../../const';
import AdminSearchAndSort, { SortOption } from '../../components/AdminSearchAndSort';
import { useAdminSearchAndSort } from '../../hooks/useAdminSearchAndSort';

interface TrocOffer {
  id: number;
  title: string;
  description: string;
  creation_date: string;
  status: string;
  type: string;
  user: {
    id: number;
    firstname: string;
    lastname: string;
  };
  image_url?: string;
}

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const AdminTrocs: React.FC = () => {
  const [trocs, setTrocs] = useState<TrocOffer[]>([]);
  const [totalTrocs, setTotalTrocs] = useState<number>(0);
  const [editingTroc, setEditingTroc] = useState<TrocOffer | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    status: '',
    type: ''
  });
  const [alert, setAlert] = useState<{ open: boolean; message: string; severity: 'success' | 'error'; }>({ open: false, message: '', severity: 'success' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  // Options de tri pour les trocs
  const sortOptions: SortOption[] = [
    { value: 'id', label: 'ID' },
    { value: 'title', label: 'Titre' },
    { value: 'type', label: 'Type' },
    { value: 'status', label: 'Statut' },
    { value: 'creation_date', label: 'Date de création' },
  ];

  // Hook pour la recherche et le tri
  const {
    searchValue,
    sortConfig,
    filteredAndSortedData,
    handleSearchChange,
    handleSearchClear,
    handleSortChange,
  } = useAdminSearchAndSort({
    data: trocs,
    searchFields: ['title', 'description', 'type'],
    defaultSortField: 'creation_date'
  });

  // Pagination sur les données filtrées et triées
  const paginatedTrocs = filteredAndSortedData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  useEffect(() => {
    fetchTrocs();
  }, [page, rowsPerPage, filterStatus, filterType]);

  // Remettre la page à 0 quand on change la recherche
  useEffect(() => {
    setPage(0);
  }, [searchValue]);

  const fetchTrocs = async () => {
    try {
      let url = `${API_URL}/trocoffers?page=${page + 1}&limit=${rowsPerPage}`;
      if (filterStatus !== 'all') url += `&status=${filterStatus}`;
      if (filterType !== 'all') url += `&type=${filterType}`;
      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setTrocs(data.data);
      setTotalTrocs(data.total_count);
    } catch (error) {
      showAlert('Erreur lors du chargement des offres de troc', 'error');
    }
  };

  const handleEditClick = (troc: TrocOffer) => {
    setEditingTroc(troc);
    setEditFormData({
      title: troc.title,
      description: troc.description,
      status: troc.status,
      type: troc.type
    });
    setSelectedImage(null);
    setPreviewUrl(troc.image_url ? API_URL + troc.image_url : null);
    setEditDialogOpen(true);
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleEditSubmit = async () => {
    if (!editingTroc) return;
    try {
      // Validation des données
      if (!editFormData.title.trim()) {
        showAlert('Le titre est requis', 'error');
        return;
      }
      if (!editFormData.description.trim()) {
        showAlert('La description est requise', 'error');
        return;
      }

      // Utiliser la même approche que MyTrocOffers
      const updateData = {
        title: editFormData.title.trim(),
        description: editFormData.description.trim(),
        status: editFormData.status
      };

      await axios.put(`${API_URL}/trocoffers/${editingTroc.id}`, updateData, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      // Mettre à jour l'état local immédiatement
      setTrocs(prevTrocs => 
        prevTrocs.map(troc => 
          troc.id === editingTroc.id 
            ? { ...troc, ...updateData } 
            : troc
        )
      );

      setEditDialogOpen(false);
      setEditingTroc(null);
      setSelectedImage(null);
      setPreviewUrl(null);
      showAlert('Offre de troc modifiée avec succès', 'success');
    } catch (error) {
      console.error('Error updating troc offer:', error);
      showAlert('Erreur lors de la modification', 'error');
    }
  };

  const handleDeleteTroc = async (trocId: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette offre de troc ?')) return;
    try {
      await axios.delete(`${API_URL}/trocoffers/${trocId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      showAlert('Offre de troc supprimée avec succès', 'success');
      fetchTrocs();
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
      <Typography variant="h4" gutterBottom>Gestion des Offres de Troc</Typography>
      
      <AdminSearchAndSort
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        onSearchClear={handleSearchClear}
        sortConfig={sortConfig}
        onSortChange={handleSortChange}
        sortOptions={sortOptions}
        placeholder="Rechercher par titre, description ou type..."
      />

      <Paper sx={{ mb: 2, p: 2 }}>
        <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} sx={{ mr: 2 }}>
          <MenuItem value="all">Tous statuts</MenuItem>
          <MenuItem value="open">Ouvert</MenuItem>
          <MenuItem value="closed">Fermé</MenuItem>
        </Select>
        <Select value={filterType} onChange={e => setFilterType(e.target.value)}>
          <MenuItem value="all">Tous types</MenuItem>
          <MenuItem value="offer">Offre</MenuItem>
          <MenuItem value="request">Demande</MenuItem>
        </Select>
      </Paper>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Titre</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Utilisateur</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Date de création</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedTrocs.map((troc) => (
              <TableRow key={troc.id}>
                <TableCell>{troc.id}</TableCell>
                <TableCell>{troc.title}</TableCell>
                <TableCell>{troc.description}</TableCell>
                <TableCell>{troc.user ? `${troc.user.firstname} ${troc.user.lastname}` : 'N/A'}</TableCell>
                <TableCell>{troc.status}</TableCell>
                <TableCell>{troc.type}</TableCell>
                <TableCell>{new Date(troc.creation_date).toLocaleDateString()}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEditClick(troc)}><EditIcon /></IconButton>
                  <IconButton onClick={() => handleDeleteTroc(troc.id)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredAndSortedData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Modifier l'offre de troc</DialogTitle>
        <DialogContent>
          {editingTroc && (
            <>
              <TextField
                autoFocus
                margin="dense"
                label="Titre"
                fullWidth
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
              />
              <TextField
                margin="dense"
                label="Description"
                fullWidth
                multiline
                rows={4}
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
              />
              <FormControl fullWidth margin="dense">
                <InputLabel>Statut</InputLabel>
                <Select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                >
                  <MenuItem value="open">Disponible</MenuItem>
                  <MenuItem value="pending">En négociation</MenuItem>
                  <MenuItem value="closed">Terminé</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 2, mb: 1 }}>
                Type: {editFormData.type === 'offer' ? 'Offre' : 'Demande'} (non modifiable)
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Button
                  component="label"
                  variant="contained"
                  startIcon={<CloudUploadIcon />}
                  sx={{ mb: 2 }}
                >
                  Changer la photo
                  <VisuallyHiddenInput type="file" accept="image/*" onChange={handleImageChange} />
                </Button>
                {previewUrl && (
                  <Box sx={{ mt: 2 }}>
                    <img 
                      src={previewUrl} 
                      alt="Aperçu" 
                      style={{ maxWidth: '100%', maxHeight: '200px' }} 
                    />
                  </Box>
                )}
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Annuler</Button>
          <Button onClick={handleEditSubmit} variant="contained">
            Sauvegarder
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={alert.open} autoHideDuration={6000} onClose={() => setAlert({ ...alert, open: false })}>
        <Alert severity={alert.severity} onClose={() => setAlert({ ...alert, open: false })}>{alert.message}</Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminTrocs; 