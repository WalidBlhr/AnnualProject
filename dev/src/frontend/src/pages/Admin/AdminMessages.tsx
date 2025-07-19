import React, { useState, useEffect } from 'react';
import {
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
  TablePagination,
  Chip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import axios from 'axios';
import { API_URL } from '../../const';
import AdminPage from './AdminPage';
import { AnyMessage } from '../../types/messages-types';
import { ListingResult } from '../../types/ListingResult';
import AdminSearchAndSort, { SortOption } from '../../components/AdminSearchAndSort';
import { useAdminSearchAndSort } from '../../hooks/useAdminSearchAndSort';

function getReceiverName(message: AnyMessage) : string {
  if (message.receiver) {
    return `${message.receiver.firstname || ""} ${message.receiver.lastname || ""}`;
  }

  if (message.group) {
    return (message.group.name + " (Groupe)") || "";
  }

  return "Utilisateur inconnu";
}

const AdminMessages: React.FC = () => {
  const [messages, setMessages] = useState<AnyMessage[]>([]);
  const [totalMessages, setTotalMessages] = useState<number>(0);
  const [selectedMessage, setSelectedMessage] = useState<AnyMessage | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [alert, setAlert] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  // Options de tri pour les messages
  const sortOptions: SortOption[] = [
    { value: 'id', label: 'ID' },
    { value: 'content', label: 'Contenu' },
    { value: 'status', label: 'Statut' },
    { value: 'date_sent', label: 'Date d\'envoi' },
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
    data: messages,
    searchFields: ['content'],
    defaultSortField: 'date_sent'
  });

  // Pagination sur les données filtrées et triées
  const paginatedMessages = filteredAndSortedData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  useEffect(() => {
    fetchMessages();
  }, [page, rowsPerPage]);

  // Remettre la page à 0 quand on change la recherche
  useEffect(() => {
    setPage(0);
  }, [searchValue]);

  const fetchMessages = async () => {
    try {
      const { data } = await axios.get<ListingResult<AnyMessage[]>>(
        `${API_URL}/messages?page=${page + 1}&limit=${rowsPerPage}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        },
      );
      setMessages(data.data);
      setTotalMessages(data.total_count);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erreur lors du chargement des messages';
      showAlert(errorMessage, 'error');
    }
  };

  const handleViewMessage = (message: AnyMessage) => {
    setSelectedMessage(message);
    setViewDialogOpen(true);
  };

  const handleDeleteMessage = async (messageId: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) return;

    try {
      await axios.delete(`${API_URL}/messages/${messageId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      showAlert('Message supprimé avec succès', 'success');
      fetchMessages();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erreur lors de la suppression';
      showAlert(errorMessage, 'error');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'lu':
        return 'success';
      case 'non_lu':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <AdminPage
      title="Gestion des messages"
      alert={alert}
      setAlert={setAlert}
    >
      <AdminSearchAndSort
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        onSearchClear={handleSearchClear}
        sortConfig={sortConfig}
        onSortChange={handleSortChange}
        sortOptions={sortOptions}
        placeholder="Rechercher dans le contenu des messages..."
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Expéditeur</TableCell>
              <TableCell>Destinataire</TableCell>
              <TableCell>Contenu</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Date d'envoi</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedMessages.map((message) => (
              <TableRow key={message.id}>
                <TableCell>{message.id}</TableCell>
                <TableCell>
                  {message.sender ? 
                    `${message.sender.firstname || ''} ${message.sender.lastname || ''}` : 
                    'Utilisateur inconnu'
                  }
                </TableCell>
                <TableCell>
                  {getReceiverName(message)}
                </TableCell>
                <TableCell>
                  {message.content.length > 50
                    ? `${message.content.substring(0, 50)}...`
                    : message.content}
                </TableCell>
                <TableCell>
                  <Chip
                    label={message.status}
                    color={getStatusColor(message.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {new Date(message.date_sent).toLocaleString()}
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleViewMessage(message)}>
                    <VisibilityIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDeleteMessage(message.id)}>
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

      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Détails du message</DialogTitle>
        <DialogContent>
          {selectedMessage && (
            <>
              <Typography variant="subtitle2" gutterBottom>
                De: {selectedMessage.sender ? 
                  `${selectedMessage.sender.firstname || ''} ${selectedMessage.sender.lastname || ''}` : 
                  'Utilisateur inconnu'
                }
              </Typography>
              <Typography variant="subtitle2" gutterBottom>
                À: {selectedMessage.receiver ? 
                  `${selectedMessage.receiver.firstname || ''} ${selectedMessage.receiver.lastname || ''}` : 
                  'Utilisateur inconnu'
                }
              </Typography>
              <Typography variant="subtitle2" gutterBottom>
                Date: {new Date(selectedMessage.date_sent).toLocaleString()}
              </Typography>
              <Typography variant="subtitle2" gutterBottom>
                Statut: <Chip label={selectedMessage.status} color={getStatusColor(selectedMessage.status)} size="small" />
              </Typography>
              <Paper sx={{ p: 2, mt: 2, backgroundColor: 'background.default' }}>
                <Typography>{selectedMessage.content}</Typography>
              </Paper>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </AdminPage>
  );
};

export default AdminMessages;