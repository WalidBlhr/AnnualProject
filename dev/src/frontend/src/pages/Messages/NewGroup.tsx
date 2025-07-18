import {useState} from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Snackbar,
  Alert,
  Divider,
} from '@mui/material';
import {useNavigate} from 'react-router-dom';
import axios from 'axios';
import {API_URL} from '../../const';
import {useAuth} from '../../contexts/AuthContext';
import {User} from './NewMessage';
import UsersAutocomplete from '../../components/UsersAutocomplete';

const NewGroup = () => {
  const navigate = useNavigate();
  const {user: currentUser} = useAuth();

  const [groupName, setGroupName] = useState<string>("");
  const [selectedMembers, setSelectedMembers] = useState<User[]>([]);
  const [groupDescription, setGroupDescription] = useState('');

  const [isDisabled, setIsDisabled] = useState(false);
  const [alert, setAlert] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

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

          <UsersAutocomplete
            multipleSelection={true}
            selectedUser={selectedMembers}
            setSelectedUser={setSelectedMembers}
            showAlert={showAlert}
            withUsersStatus
            renderLabel="Membres"
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