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
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import axios from 'axios';
import { API_URL } from '../../const';

interface User {
  id: number;
  email: string;
  firstname: string;
  lastname: string;
  role: number;
  createdAt: string;
  is_banned?: boolean;
  banned_at?: string;
  ban_reason?: string;
  ban_until?: string;
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
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [banInfoDialogOpen, setBanInfoDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState<number | ''>('');
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
      await axios.delete(`${API_URL}/users/${userId}`, {
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

  const handleBanClick = (user: User) => {
    setSelectedUser(user);
    setBanReason('');
    setBanDuration('');
    setBanDialogOpen(true);
  };

  const handleBanSubmit = async () => {
    if (!selectedUser || !banReason.trim()) {
      showAlert('Le motif du bannissement est requis', 'error');
      return;
    }

    try {
      const banData: any = { reason: banReason };
      if (banDuration && typeof banDuration === 'number' && banDuration > 0) {
        banData.duration = banDuration;
      }

      await axios.post(
        `${API_URL}/users/${selectedUser.id}/ban`,
        banData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        },
      );
      showAlert('Utilisateur banni avec succès', 'success');
      setBanDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Erreur lors du bannissement';
      showAlert(errorMessage, 'error');
    }
  };

  const handleUnbanUser = async (userId: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir débannir cet utilisateur ?'))
      return;

    try {
      await axios.post(`${API_URL}/users/${userId}/unban`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      showAlert('Utilisateur débanni avec succès', 'success');
      fetchUsers();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Erreur lors du débannissement';
      showAlert(errorMessage, 'error');
    }
  };

  const handleShowBanInfo = async (user: User) => {
    try {
      const response = await axios.get(`${API_URL}/users/${user.id}/ban-status`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setSelectedUser({ ...user, ...response.data });
      setBanInfoDialogOpen(true);
    } catch (error) {
      showAlert('Erreur lors de la récupération des informations de bannissement', 'error');
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
              <TableCell>Statut</TableCell>
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
                  {user.is_banned ? (
                    <span style={{ color: 'red', fontWeight: 'bold' }}>
                      Banni
                      {user.ban_until && (
                        <span style={{ fontSize: '0.8em', display: 'block' }}>
                          Jusqu'au {new Date(user.ban_until).toLocaleDateString()}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span style={{ color: 'green' }}>Actif</span>
                  )}
                </TableCell>
                <TableCell>
                  {new Date(user.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEditClick(user)} title="Modifier">
                    <EditIcon />
                  </IconButton>
                  {user.is_banned ? (
                    <>
                      <IconButton 
                        onClick={() => handleUnbanUser(user.id)} 
                        title="Débannir"
                        style={{ color: 'green' }}
                      >
                        <CheckCircleIcon />
                      </IconButton>
                      <IconButton 
                        onClick={() => handleShowBanInfo(user)} 
                        title="Informations de bannissement"
                      >
                        <InfoIcon />
                      </IconButton>
                    </>
                  ) : (
                    <IconButton 
                      onClick={() => handleBanClick(user)} 
                      title="Bannir"
                      style={{ color: 'orange' }}
                    >
                      <BlockIcon />
                    </IconButton>
                  )}
                  <IconButton onClick={() => handleDeleteUser(user.id)} title="Supprimer">
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

      {/* ---- Modale de bannissement ---- */}
      <Dialog open={banDialogOpen} onClose={() => setBanDialogOpen(false)}>
        <DialogTitle>Bannir l'utilisateur</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Typography variant="body2" gutterBottom>
              Utilisateur : {selectedUser.firstname} {selectedUser.lastname} ({selectedUser.email})
            </Typography>
          )}
          <TextField
            margin="normal"
            fullWidth
            label="Motif du bannissement"
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
            multiline
            rows={3}
            required
          />
          <TextField
            margin="normal"
            fullWidth
            label="Durée (en jours - optionnel)"
            type="number"
            value={banDuration}
            onChange={(e) => setBanDuration(e.target.value ? parseInt(e.target.value, 10) : '')}
            helperText="Laissez vide pour un bannissement permanent"
            inputProps={{ min: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBanDialogOpen(false)}>Annuler</Button>
          <Button onClick={handleBanSubmit} variant="contained" color="warning">
            Bannir
          </Button>
        </DialogActions>
      </Dialog>

      {/* ---- Modale d'informations de bannissement ---- */}
      <Dialog open={banInfoDialogOpen} onClose={() => setBanInfoDialogOpen(false)}>
        <DialogTitle>Informations de bannissement</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <>
              <Typography variant="body1" gutterBottom>
                <strong>Utilisateur :</strong> {selectedUser.firstname} {selectedUser.lastname}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Email :</strong> {selectedUser.email}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Statut :</strong> {selectedUser.is_banned ? 'Banni' : 'Actif'}
              </Typography>
              {selectedUser.is_banned && (
                <>
                  <Typography variant="body2" gutterBottom>
                    <strong>Date de bannissement :</strong>{' '}
                    {selectedUser.banned_at
                      ? new Date(selectedUser.banned_at).toLocaleString()
                      : 'Non disponible'}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Motif :</strong> {selectedUser.ban_reason || 'Non spécifié'}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Fin du bannissement :</strong>{' '}
                    {selectedUser.ban_until
                      ? new Date(selectedUser.ban_until).toLocaleString()
                      : 'Bannissement permanent'}
                  </Typography>
                </>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBanInfoDialogOpen(false)}>Fermer</Button>
          {selectedUser?.is_banned && (
            <Button 
              onClick={() => {
                setBanInfoDialogOpen(false);
                if (selectedUser) handleUnbanUser(selectedUser.id);
              }} 
              variant="contained" 
              color="success"
            >
              Débannir
            </Button>
          )}
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
