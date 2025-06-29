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

interface User {
  id: number;
  email: string;
  firstname: string;
  lastname: string;
  role: number;
  createdAt: string;
}

interface EditUserData {
  lastname: string;
  firstname: string;
  email: string;
  role: number;
}

interface UsersResponse {
  data: User[];
  page_size: number;
  page: number;
  total_count: number;
  total_pages: number;
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<EditUserData>({
    lastname: '',
    firstname: '',
    email: '',
    role: 0,
  });
  const [alert, setAlert] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage]);

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get<UsersResponse>(
        `${API_URL}/users?page=${page + 1}&limit=${rowsPerPage}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        },
      );
      setUsers(data.data);
      setTotalUsers(data.total_count);
    } catch (error) {
      showAlert('Erreur lors du chargement des utilisateurs', 'error');
    }
  };

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setEditFormData({
      lastname: user.lastname,
      firstname: user.firstname,
      email: user.email,
      role: user.role,
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editingUser) return;

    try {
      await axios.put(
        `${API_URL}/users/${editingUser.id}`,
        editFormData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        },
      );
      showAlert('Utilisateur modifié avec succès', 'success');
      setEditDialogOpen(false);
      fetchUsers();
    } catch (error) {
      showAlert('Erreur lors de la modification', 'error');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (
      !window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')
    )
      return;

    try {
      await axios.delete(`${API_URL}users/${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      showAlert('Utilisateur supprimé avec succès', 'success');
      fetchUsers();
    } catch (error) {
      showAlert('Erreur lors de la suppression', 'error');
    }
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const showAlert = (message: string, severity: 'success' | 'error') => {
    setAlert({ open: true, message, severity });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Gestion des Utilisateurs
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Nom</TableCell>
              <TableCell>Prénom</TableCell>
              <TableCell>Rôle</TableCell>
              <TableCell>Date de création</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.id}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.lastname}</TableCell>
                <TableCell>{user.firstname}</TableCell>
                <TableCell>
                  {user.role === 1 ? 'Admin' : 'Utilisateur'}
                </TableCell>
                <TableCell>
                  {new Date(user.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEditClick(user)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDeleteUser(user.id)}>
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
          count={totalUsers}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* ---- Modale d'édition ---- */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Modifier l'utilisateur</DialogTitle>
        <DialogContent>
          <TextField
            margin="normal"
            fullWidth
            label="Nom"
            value={editFormData.lastname}
            onChange={(e) =>
              setEditFormData({ ...editFormData, lastname: e.target.value })
            }
          />
          <TextField
            margin="normal"
            fullWidth
            label="Prénom"
            value={editFormData.firstname}
            onChange={(e) =>
              setEditFormData({ ...editFormData, firstname: e.target.value })
            }
          />
          <TextField
            margin="normal"
            fullWidth
            label="Email"
            value={editFormData.email}
            onChange={(e) =>
              setEditFormData({ ...editFormData, email: e.target.value })
            }
          />
          <TextField
            margin="normal"
            fullWidth
            label="Rôle"
            type="number"
            value={editFormData.role}
            onChange={(e) =>
              setEditFormData({
                ...editFormData,
                role: parseInt(e.target.value, 10),
              })
            }
            inputProps={{ min: 0, max: 1 }}
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
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminUsers;
