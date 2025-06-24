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
    Table, TableBody, TableCell, TableContainer, TableHead,
    TablePagination,
    TableRow,
    TextField,
    Typography
} from '@mui/material';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { API_URL } from '../../const';

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
}

const AdminTrocs: React.FC = () => {
  const [trocs, setTrocs] = useState<TrocOffer[]>([]);
  const [totalTrocs, setTotalTrocs] = useState<number>(0);
  const [editingTroc, setEditingTroc] = useState<TrocOffer | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
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

  useEffect(() => {
    fetchTrocs();
  }, [page, rowsPerPage, filterStatus, filterType]);

  const fetchTrocs = async () => {
    try {
      let url = `${API_URL}/trocoffers?page=${page + 1}&limit=${rowsPerPage}`;
      if (filterStatus !== 'all') url += `&status=${filterStatus}`;
      if (filterType !== 'all') url += `&type=${filterType}`;
      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setTrocs(data.data);
      setTotalTrocs(data.total);
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
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editingTroc) return;
    try {
      await axios.put(`${API_URL}/trocoffers/${editingTroc.id}`, editFormData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      showAlert('Offre de troc modifiée avec succès', 'success');
      setEditDialogOpen(false);
      fetchTrocs();
    } catch (error) {
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
            {trocs.map((troc) => (
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
          count={totalTrocs}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Modifier l'offre de troc</DialogTitle>
        <DialogContent>
          <TextField margin="normal" fullWidth label="Titre" value={editFormData.title} onChange={e => setEditFormData({ ...editFormData, title: e.target.value })} />
          <TextField margin="normal" fullWidth label="Description" value={editFormData.description} onChange={e => setEditFormData({ ...editFormData, description: e.target.value })} />
          <TextField margin="normal" fullWidth label="Statut" value={editFormData.status} onChange={e => setEditFormData({ ...editFormData, status: e.target.value })} />
          <TextField margin="normal" fullWidth label="Type" value={editFormData.type} onChange={e => setEditFormData({ ...editFormData, type: e.target.value })} />
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

export default AdminTrocs; 