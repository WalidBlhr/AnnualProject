import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Snackbar,
  Alert,
  Autocomplete,
  CircularProgress,
  Avatar,
  Divider,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../const';
import { useAuth } from '../../contexts/AuthContext';

interface User {
  id: number;
  firstname: string;
  lastname: string;
}

const NewGroup = () => {
  const navigate = useNavigate();
  const {user: currentUser} = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [groupName, setGroupName] = useState<string>("");
  const [selectedMembers, setSelectedMembers] = useState<User[]>([]);
  const [groupDescription, setGroupDescription] = useState('');

  const [isDisabled, setIsDisabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      const { data } = await axios.get(API_URL + '/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const filteredUsers = data.data.filter((userData: User) => userData.id !== (currentUser?.userId ?? 0));
      setUsers(filteredUsers);
      setIsLoading(false);
    } catch (error) {
      console.error(error)
      showAlert('Erreur lors du chargement des utilisateurs', 'error');
      setIsLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    setIsDisabled(true)
    if (selectedMembers.length === 0 || !groupDescription.trim()) {
      showAlert('Veuillez sélectionner au moins un membre', 'error');
      setIsDisabled(false);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token || currentUser === null) {
      console.warn("Not connected");
      setIsDisabled(false);
      return;
    }

    try {
      const {data} = await axios.post<{id: number}>(
        API_URL + "/message-groups",
        {
          name: groupName,
          description: groupDescription,
          ownerId: currentUser.userId,
          membersIDs: selectedMembers.map(member => member.id),
        },
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );
      showAlert("Groupe créé.", "success");
      setTimeout(() => navigate(`/message-groups/${data.id}/messages`), 1000);
    } catch (error) {
      console.error(error);
      setIsDisabled(false);
      showAlert('Erreur lors de l\'envoi du message', 'error');
    }
  };

  const showAlert = (message: string, severity: 'success' | 'error') => {
    setAlert({ open: true, message, severity });
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>Nouveau groupe</Typography>

      <Paper sx={{ p: 3 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Typography variant="h6" gutterBottom>
              Nommer votre groupe
            </Typography>
            <TextField
              label="Nom du groupe"
              variant="outlined"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              fullWidth
            />

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>
              Choisir les membres du groupe
            </Typography>

            <Autocomplete
              multiple
              value={selectedMembers}
              onChange={(_, newValues) => {
                setSelectedMembers(newValues);
              }}
              options={users}
              getOptionLabel={(option) => `${option.firstname} ${option.lastname}`}
              renderOption={(props, option) => {
                const {key, ...rest} = props;
                return (
                <Box component="li" key={key} {...rest}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Avatar sx={{ mr: 2 }}>{option.firstname.charAt(0)}</Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      {option.firstname} {option.lastname}
                    </Box>
                  </Box>
                </Box>
              )}}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Membres"
                  variant="outlined"
                  fullWidth
                  sx={{ mb: 3 }}
                />
              )}
            />

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>
              Description
            </Typography>

            <TextField
              label="Description du groupe"
              multiline
              rows={4}
              fullWidth
              variant="outlined"
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              sx={{ mb: 3 }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button 
                variant="outlined" 
                onClick={() => navigate('/messages')}
              >
                Annuler
              </Button>
              <Button 
                variant="contained" 
                color="primary"
                onClick={handleCreateGroup}
                disabled={selectedMembers.length === 0 || isDisabled}
              >
                Créer
              </Button>
            </Box>
          </>
        )}
      </Paper>

      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={() => setAlert({ ...alert, open: false })}
      >
        <Alert onClose={() => setAlert({ ...alert, open: false })} severity={alert.severity}>
          {alert.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default NewGroup;