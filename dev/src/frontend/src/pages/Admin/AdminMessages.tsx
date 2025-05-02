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
  Chip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import axios from 'axios';

interface Message {
  id: number;
  content: string;
  date_sent: string;
  sender: {
    id: number;
    firstname: string;
    lastname: string;
  };
  receiver: {
    id: number;
    firstname: string;
    lastname: string;
  };
  status: string;
}

interface MessagesResponse {
  data: Message[];
  total: number;
}

const AdminMessages: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [totalMessages, setTotalMessages] = useState<number>(0);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [alert, setAlert] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchMessages();
  }, [page, rowsPerPage]);

  const fetchMessages = async () => {
    try {
      const { data } = await axios.get<MessagesResponse>(
        `http://localhost:3000/messages?page=${page + 1}&limit=${rowsPerPage}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        },
      );
      setMessages(data.data);
      setTotalMessages(data.total);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erreur lors du chargement des messages';
      showAlert(errorMessage, 'error');
    }
  };

  const handleViewMessage = (message: Message) => {
    setSelectedMessage(message);
    setViewDialogOpen(true);
  };

  const handleDeleteMessage = async (messageId: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) return;

    try {
      await axios.delete(`http://localhost:3000/messages/${messageId}`, {
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
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Gestion des Messages
      </Typography>

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
            {messages.map((message) => (
              <TableRow key={message.id}>
                <TableCell>{message.id}</TableCell>
                <TableCell>
                  {message.sender ? 
                    `${message.sender.firstname || ''} ${message.sender.lastname || ''}` : 
                    'Utilisateur inconnu'
                  }
                </TableCell>
                <TableCell>
                  {message.receiver ? 
                    `${message.receiver.firstname || ''} ${message.receiver.lastname || ''}` : 
                    'Utilisateur inconnu'
                  }
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
          count={totalMessages}
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

      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={() => setAlert({ ...alert, open: false })}
      >
        <Alert
          severity={alert.severity}
          onClose={() => setAlert({ ...alert, open: false })}
          sx={{ whiteSpace: 'pre-line' }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminMessages;