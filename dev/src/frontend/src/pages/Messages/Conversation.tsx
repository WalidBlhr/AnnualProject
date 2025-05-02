import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  Snackbar,
} from '@mui/material';
import axios from 'axios';
import jwtDecode from 'jwt-decode';

interface Message {
  id: number;
  content: string;
  date_sent: string;
  status: string;
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
  trocOffer?: {
    id: number;
    title: string;
  };
}

const Conversation: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const trocId = params.get('trocId');

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState<{firstname: string, lastname: string} | null>(null);
  const [alert, setAlert] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchMessages();
    fetchUserDetails();
  }, [userId]);

  const fetchUserDetails = async () => {
    try {
      const { data } = await axios.get(`http://localhost:3000/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setOtherUser({ firstname: data.firstname, lastname: data.lastname });
    } catch (error) {
      showAlert('Erreur lors du chargement des détails de l\'utilisateur', 'error');
    }
  };

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const decoded = jwtDecode<{ userId: number }>(token!);
      const { data } = await axios.get(`http://localhost:3000/messages`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          senderId: decoded.userId,
          receiverId: userId
        }
      });
      setMessages(data.data);
    } catch (error) {
      showAlert('Erreur lors du chargement des messages', 'error');
    }
  };

  const handleSendMessage = async () => {
    try {
      const token = localStorage.getItem('token');
      const decoded = jwtDecode<{ userId: number }>(token!);
      
      const messageData = {
        content: newMessage,
        date_sent: new Date().toISOString(),
        senderId: decoded.userId,
        receiverId: Number(userId),
        status: 'non_lu',
        ...(trocId && { trocOfferId: Number(trocId) }) // Ajouter trocOfferId seulement si trocId existe
      };

      await axios.post(
        'http://localhost:3000/messages',
        messageData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      setNewMessage('');
      fetchMessages();
      showAlert('Message envoyé', 'success');
    } catch (error) {
      showAlert('Erreur lors de l\'envoi du message', 'error');
    }
  };

  const showAlert = (message: string, severity: 'success' | 'error') => {
    setAlert({ open: true, message, severity });
  };

  if (!otherUser) {
    return <Container>Chargement...</Container>;
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3, height: '70vh', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Conversation avec {otherUser.firstname} {otherUser.lastname}
            {trocId && ' (via une offre de troc)'}
          </Typography>
          <Button variant="outlined" onClick={() => navigate(trocId ? `/trocs/${trocId}` : '/messages')}>
            Retour
          </Button>
        </Box>
        <Divider />
        
        <List sx={{ flexGrow: 1, overflow: 'auto', mb: 2 }}>
          {messages.map((message) => (
            <React.Fragment key={message.id}>
              <ListItem>
                <ListItemText
                  primary={message.content}
                  secondary={`${message.sender.firstname} ${message.sender.lastname} - ${new Date(message.date_sent).toLocaleString()}`}
                  sx={{
                    textAlign: message.sender.id === Number(userId) ? 'left' : 'right',
                  }}
                />
              </ListItem>
              <Divider variant="inset" component="li" />
            </React.Fragment>
          ))}
        </List>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            multiline
            rows={2}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Écrivez votre message..."
          />
          <Button
            variant="contained"
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
          >
            Envoyer
          </Button>
        </Box>
      </Paper>

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

export default Conversation;
