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

interface Service {
  id: number;
  title: string;
  description: string;
  type: string;
  status: string;
  provider: {
    id: number;
    firstname: string;
    lastname: string;
  };
  date_start: string;
  date_end: string;
}

const AdminServices: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [totalServices, setTotalServices] = useState<number>(0);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    type: '',
    status: ''
  });
  const [alert, setAlert] = useState<{ open: boolean; message: string; severity: 'success' | 'error'; }>({ open: false, message: '', severity: 'success' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchServices();
  }, [page, rowsPerPage, filterStatus, filterType]);

  const fetchServices = async () => {
    try {
      let url = `http://localhost:3000/services?page=${page + 1}&limit=${rowsPerPage}`;
      if (filterStatus !== 'all') url += `&status=${filterStatus}`;
      if (filterType !== 'all') url += `&type=${filterType}`;
      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setServices(data.data);
      setTotalServices(data.total);
    } catch (error) {
      showAlert('Erreur lors du chargement des services', 'error');
    }
  };

  const handleEditClick = (service: Service) => {
    setEditingService(service);
    setEditFormData({
      title: service.title,
      description: service.description,
      type: service.type,
      status: service.status
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editingService) return;
    try {
      await axios.put(`http://localhost:3000/services/${editingService.id}`, editFormData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      showAlert('Service modifié avec succès', 'success');
      setEditDialogOpen(false);
      fetchServices();
    } catch (error) {
      showAlert('Erreur lors de la modification', 'error');
    }
  };

  const handleDeleteService = async (serviceId: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce service ?')) return;
    try {
      await axios.delete(`http://localhost:3000/services/${serviceId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      showAlert('Service supprimé avec succès', 'success');
      fetchServices();
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
      <Typography variant="h4" gutterBottom>Gestion des Services</Typography>
      <Paper sx={{ mb: 2, p: 2 }}>
        <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} sx={{ mr: 2 }}>
          <MenuItem value="all">Tous statuts</MenuItem>
          <MenuItem value="available">Disponible</MenuItem>
          <MenuItem value="booked">Réservé</MenuItem>
          <MenuItem value="completed">Terminé</MenuItem>
        </Select>
        <Select value={filterType} onChange={e => setFilterType(e.target.value)}>
          <MenuItem value="all">Tous types</MenuItem>
          <MenuItem value="help">Aide</MenuItem>
          <MenuItem value="other">Autre</MenuItem>
        </Select>
      </Paper>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Titre</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Prestataire</TableCell>
              <TableCell>Date début</TableCell>
              <TableCell>Date fin</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {services.map((service) => (
              <TableRow key={service.id}>
                <TableCell>{service.id}</TableCell>
                <TableCell>{service.title}</TableCell>
                <TableCell>{service.description}</TableCell>
                <TableCell>{service.type}</TableCell>
                <TableCell>{service.status}</TableCell>
                <TableCell>{service.provider ? `${service.provider.firstname} ${service.provider.lastname}` : 'N/A'}</TableCell>
                <TableCell>{new Date(service.date_start).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(service.date_end).toLocaleDateString()}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEditClick(service)}><EditIcon /></IconButton>
                  <IconButton onClick={() => handleDeleteService(service.id)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalServices}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Modifier le service</DialogTitle>
        <DialogContent>
          <TextField margin="normal" fullWidth label="Titre" value={editFormData.title} onChange={e => setEditFormData({ ...editFormData, title: e.target.value })} />
          <TextField margin="normal" fullWidth label="Description" value={editFormData.description} onChange={e => setEditFormData({ ...editFormData, description: e.target.value })} />
          <TextField margin="normal" fullWidth label="Type" value={editFormData.type} onChange={e => setEditFormData({ ...editFormData, type: e.target.value })} />
          <TextField margin="normal" fullWidth label="Statut" value={editFormData.status} onChange={e => setEditFormData({ ...editFormData, status: e.target.value })} />
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

export default AdminServices; 