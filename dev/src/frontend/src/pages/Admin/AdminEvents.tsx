import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  TablePagination,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import axios from 'axios';
import { API_URL } from '../../const';
import AdminSearchAndSort, { SortOption } from '../../components/AdminSearchAndSort';
import { useAdminSearchAndSort } from '../../hooks/useAdminSearchAndSort';

interface Event {
  id: number;
  name: string;
  date: string;
  location: string;
  max_participants: number;
  min_participants: number;
  status: string;
  createdAt: string;
}

interface EditEventData {
  name: string;
  date: string;
  location: string;
  max_participants: number;
  min_participants: number;
  status: string;
}

interface CreateEventData {
  name: string;
  date: string;
  location: string;
  max_participants: number;
  min_participants: number;
  status: string;
}

interface EventsResponse {
  data: Event[];
  page_size: number;
  page: number;
  total_count: number;
  total_pages: number;
}

const AdminEvents: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [totalEvents, setTotalEvents] = useState<number>(0);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<EditEventData>({
    name: '',
    date: '',
    location: '',
    max_participants: 0,
    min_participants: 0,
    status: ''
  });
  const [createFormData, setCreateFormData] = useState<CreateEventData>({
    name: '',
    date: '',
    location: '',
    max_participants: 0,
    min_participants: 0,
    status: 'draft'
  });
  const [alert, setAlert] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Options de tri pour les événements
  const sortOptions: SortOption[] = [
    { value: 'id', label: 'ID' },
    { value: 'name', label: 'Nom' },
    { value: 'date', label: 'Date' },
    { value: 'location', label: 'Lieu' },
    { value: 'status', label: 'Statut' },
    { value: 'createdAt', label: 'Date de création' },
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
    data: events,
    searchFields: ['name', 'location', 'status'],
    defaultSortField: 'date'
  });

  // Pagination sur les données filtrées et triées
  const paginatedEvents = filteredAndSortedData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  useEffect(() => {
    fetchEvents();
  }, [page, rowsPerPage]);

  // Remettre la page à 0 quand on change la recherche
  useEffect(() => {
    setPage(0);
  }, [searchValue]);

  const fetchEvents = async () => {
    try {
      const { data } = await axios.get<EventsResponse>(
        `${API_URL}/events?page=${page + 1}&limit=${rowsPerPage}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        },
      );
      setEvents(data.data);
      setTotalEvents(data.total_count);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erreur lors du chargement des événements';
      showAlert(errorMessage, 'error');
    }
  };

  const handleEditClick = (event: Event) => {
    setEditingEvent(event);
    setEditFormData({
      name: event.name,
      date: event.date,
      location: event.location,
      max_participants: event.max_participants,
      min_participants: event.min_participants,
      status: event.status,
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editingEvent) return;

    try {
      await axios.put(
        `${API_URL}/events/${editingEvent.id}`,
        editFormData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        },
      );
      showAlert('Événement modifié avec succès', 'success');
      setEditDialogOpen(false);
      fetchEvents();
    } catch (error: any) {
      if (error.response?.data) {
        const errorMessages = Object.values(error.response.data).join('\n');
        showAlert(errorMessages, 'error');
      } else {
        showAlert('Erreur lors de la modification', 'error');
      }
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet événement ?'))
      return;

    try {
      await axios.delete(`${API_URL}/events/${eventId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      showAlert('Événement supprimé avec succès', 'success');
      fetchEvents();
    } catch (error: any) {
      if (error.response?.data) {
        const errorMessages = Object.values(error.response.data).join('\n');
        showAlert(errorMessages, 'error');
      } else {
        showAlert('Erreur lors de la suppression', 'error');
      }
    }
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const showAlert = (message: string, severity: 'success' | 'error') => {
    setAlert({ open: true, message, severity });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Gestion des Événements
      </Typography>

      <AdminSearchAndSort
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        onSearchClear={handleSearchClear}
        sortConfig={sortConfig}
        onSortChange={handleSortChange}
        sortOptions={sortOptions}
        placeholder="Rechercher par nom, lieu ou statut..."
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nom</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Lieu</TableCell>
              <TableCell>Participants max</TableCell>
              <TableCell>Participants min</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedEvents.map((event) => (
              <TableRow key={event.id}>
                <TableCell>{event.id}</TableCell>
                <TableCell>{event.name}</TableCell>
                <TableCell>{new Date(event.date).toLocaleDateString()}</TableCell>
                <TableCell>{event.location}</TableCell>
                <TableCell>{event.max_participants}</TableCell>
                <TableCell>{event.min_participants}</TableCell>
                <TableCell>{event.status}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEditClick(event)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDeleteEvent(event.id)}>
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
          count={filteredAndSortedData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Modifier l'événement</DialogTitle>
        <DialogContent>
          <TextField
            margin="normal"
            fullWidth
            label="Nom"
            value={editFormData.name}
            onChange={(e) =>
              setEditFormData({ ...editFormData, name: e.target.value })
            }
          />
          <TextField
            margin="normal"
            fullWidth
            label="Date"
            type="datetime-local"
            value={editFormData.date}
            onChange={(e) =>
              setEditFormData({ ...editFormData, date: e.target.value })
            }
            InputLabelProps={{
              shrink: true,
            }}
          />
          <TextField
            margin="normal"
            fullWidth
            label="Lieu"
            value={editFormData.location}
            onChange={(e) =>
              setEditFormData({ ...editFormData, location: e.target.value })
            }
          />
          <TextField
            margin="normal"
            fullWidth
            label="Participants maximum"
            type="number"
            value={editFormData.max_participants}
            onChange={(e) =>
              setEditFormData({
                ...editFormData,
                max_participants: parseInt(e.target.value, 10),
              })
            }
          />
          <TextField
            margin="normal"
            fullWidth
            label="Participants minimum"
            type="number"
            value={editFormData.min_participants}
            onChange={(e) =>
              setEditFormData({
                ...editFormData,
                min_participants: parseInt(e.target.value, 10),
              })
            }
          />
          <TextField
            margin="normal"
            fullWidth
            label="Statut"
            value={editFormData.status}
            onChange={(e) =>
              setEditFormData({ ...editFormData, status: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Annuler</Button>
          <Button onClick={handleEditSubmit} variant="contained">
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={() => setAlert({ ...alert, open: false })}
      >
        <Alert
          severity={alert.severity}
          onClose={() => setAlert({ ...alert, open: false })}
          sx={{ whiteSpace: 'pre-line' }} // Ajoutez cette ligne pour gérer les retours à la ligne
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminEvents;