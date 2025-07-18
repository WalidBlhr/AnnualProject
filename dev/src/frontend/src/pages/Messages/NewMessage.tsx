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
import jwtDecode from 'jwt-decode';
import {API_URL} from '../../const';
import UsersAutocomplete from '../../components/UsersAutocomplete';

export interface User {
  id: number;
  firstname: string;
  lastname: string;
}

const NewMessage = () => {
  const navigate = useNavigate();
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messageContent, setMessageContent] = useState('');
  const [isDisabled, setIsDisabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const handleSendMessage = async () => {
    setIsDisabled(true);
    if (!selectedUser || !messageContent.trim()) {
      showAlert('Veuillez sélectionner un destinataire et saisir un message', 'error');
      setIsDisabled(false);
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const decoded = token ? jwtDecode<{ userId: number }>(token) : { userId: 0 };
      
      await axios.post(
        API_URL + '/messages',
        {
          content: messageContent,
          date_sent: new Date().toISOString(),
          senderId: decoded.userId,
          receiverId: selectedUser.id,
          status: 'unread'
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      showAlert('Message envoyé avec succès', 'success');
      
      // Rediriger vers la conversation avec cet utilisateur
      setTimeout(() => {
        navigate(`/messages/${selectedUser.id}`);
      }, 1500);
    } catch (error) {
      setIsDisabled(false);
      showAlert('Erreur lors de l\'envoi du message', 'error');
    }
  };

  const showAlert = (message: string, severity: 'success' | 'error') => {
    setAlert({ open: true, message, severity });
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>Nouveau message</Typography>
      
      <Paper sx={{ p: 3 }}>
        <>
          <Typography variant="h6" gutterBottom>
            Choisir un destinataire
          </Typography>

          <UsersAutocomplete
            selectedUser={selectedUser}
            setSelectedUser={setSelectedUser}
            showAlert={showAlert}
            withUsersStatus
            renderLabel="Destinataire"
          />

          <Divider sx={{ my: 2 }} />
          
          <Typography variant="h6" gutterBottom>
            Message
          </Typography>
          
          <TextField
            label="Votre message"
            multiline
            rows={4}
            fullWidth
            variant="outlined"
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
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
              onClick={handleSendMessage}
              disabled={!selectedUser || !messageContent.trim() || isDisabled}
            >
              Envoyer
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

export default NewMessage;