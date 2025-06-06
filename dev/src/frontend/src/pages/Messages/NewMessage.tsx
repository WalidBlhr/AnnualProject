import React, { useState, useEffect } from 'react';
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
  Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import jwtDecode from 'jwt-decode';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { useSocket } from '../../contexts/SocketContext';

interface User {
  id: number;
  firstname: string;
  lastname: string;
}

const NewMessage = () => {
  const navigate = useNavigate();
  const { isOnline } = useSocket();
  
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messageContent, setMessageContent] = useState('');
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
      const decoded = token ? jwtDecode<{ userId: number }>(token) : { userId: 0 };
      
      const { data } = await axios.get('http://localhost:3000/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Filtrer pour retirer l'utilisateur actuel
      const filteredUsers = data.data.filter((user: User) => user.id !== decoded.userId);
      setUsers(filteredUsers);
      setIsLoading(false);
    } catch (error) {
      showAlert('Erreur lors du chargement des utilisateurs', 'error');
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedUser || !messageContent.trim()) {
      showAlert('Veuillez sélectionner un destinataire et saisir un message', 'error');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const decoded = token ? jwtDecode<{ userId: number }>(token) : { userId: 0 };
      
      await axios.post(
        'http://localhost:3000/messages',
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
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Typography variant="h6" gutterBottom>
              Choisir un destinataire
            </Typography>
            
            <Autocomplete
              value={selectedUser}
              onChange={(event, newValue) => {
                setSelectedUser(newValue);
              }}
              options={users}
              getOptionLabel={(option) => `${option.firstname} ${option.lastname}`}
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Avatar sx={{ mr: 2 }}>{option.firstname.charAt(0)}</Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      {option.firstname} {option.lastname}
                    </Box>
                    <Chip
                      icon={<FiberManualRecordIcon sx={{ fontSize: 14 }} />}
                      label={isOnline(option.id) ? "En ligne" : "Hors ligne"}
                      color={isOnline(option.id) ? "success" : "default"}
                      size="small"
                    />
                  </Box>
                </Box>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Destinataire"
                  variant="outlined"
                  fullWidth
                  sx={{ mb: 3 }}
                />
              )}
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
                disabled={!selectedUser || !messageContent.trim()}
              >
                Envoyer
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

export default NewMessage;