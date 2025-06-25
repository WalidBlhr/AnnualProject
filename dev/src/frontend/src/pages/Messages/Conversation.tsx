import React, { useState, useEffect, useRef } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  TextField, 
  Button, 
  List, 
  ListItem, 
  ListItemText,
  Avatar,
  Snackbar,
  Alert,
  Divider,
  CircularProgress,
  IconButton,
  Badge,
  Tooltip,
  Chip
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import jwtDecode from 'jwt-decode';
import SendIcon from '@mui/icons-material/Send';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { useSocket } from '../../contexts/SocketContext';
import { API_URL } from '../../const';
import { MessageElement } from './MessageElement';

// Types existants ou à ajouter si nécessaire
export interface Message {
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
}

interface User {
  firstname: string;
  lastname: string;
}

const Conversation = () => {
  const { userId, trocId } = useParams<{ userId: string, trocId?: string }>();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { socket, isOnline, fetchUserStatuses } = useSocket();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchMessages();
    fetchUserDetails();

    // Scroll to bottom when messages change
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [userId]);

  // Listen for new messages via socket
  useEffect(() => {
    if (socket && userId) {
      const handleReceiveMessage = (message: Message) => {
        // Vérifier si le message appartient à cette conversation
        const token = localStorage.getItem('token');
        if (token) {
          const decoded = jwtDecode<{ userId: number }>(token);
          if (
            (message.sender.id === parseInt(userId) && message.receiver.id === decoded.userId) ||
            (message.sender.id === decoded.userId && message.receiver.id === parseInt(userId))
          ) {
            setMessages(prev => [...prev, message]);
            
            // Marquer le message comme lu si l'utilisateur est le destinataire
            if (message.receiver.id === decoded.userId && message.status === 'unread') {
              markMessageAsRead(message.id);
            }
            
            // Scroll to bottom on new message
            if (messagesEndRef.current) {
              messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
            }
          }
        }
      };
      
      socket.on('receive_message', handleReceiveMessage);
      
      return () => {
        socket.off('receive_message', handleReceiveMessage);
      };
    }
  }, [socket, userId]);

  const fetchUserDetails = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/users/${userId}`, {
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
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const decoded = jwtDecode<{ userId: number }>(token!);
      const { data } = await axios.get(`${API_URL}/messages`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          senderId: decoded.userId,
          receiverId: userId
        }
      });
      setMessages(data.data);
      
      // Marquer tous les messages non lus comme lus
      const unreadMessages = data.data.filter(
        (msg: Message) => msg.status === 'unread' && msg.receiver.id === decoded.userId
      );
      
      for (const msg of unreadMessages) {
        await markMessageAsRead(msg.id);
      }
      
      setIsLoading(false);
      
      // Scroll to bottom after loading messages
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    } catch (error) {
      showAlert('Erreur lors du chargement des messages', 'error');
      setIsLoading(false);
    }
  };

  const markMessageAsRead = async (messageId: number) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/messages/${messageId}`,
        { status: 'read' },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      console.error('Erreur lors du marquage du message comme lu:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    try {
      const token = localStorage.getItem('token');
      const decoded = jwtDecode<{ userId: number }>(token!);
      
      const messageData = {
        content: newMessage,
        date_sent: new Date().toISOString(),
        senderId: decoded.userId,
        receiverId: Number(userId),
        status: 'unread',
        ...(trocId && { trocOfferId: Number(trocId) })
      };

      const response = await axios.post(
        API_URL + '/messages',
        messageData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      // Émettre le message via socket
      if (socket) {
        socket.emit('new_message', response.data);
      }
      
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

  useEffect(() => {
    if (userId) {
      // Charger le statut initial de l'autre utilisateur
      fetchUserStatuses([parseInt(userId)]);
    }
  }, [userId, fetchUserStatuses]);

  if (isLoading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!otherUser) {
    return <Container>Chargement...</Container>;
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3, height: '70vh', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6">
              Conversation avec {otherUser.firstname} {otherUser.lastname}
              {trocId && ' (via une offre de troc)'}
            </Typography>
            
            <Tooltip title={isOnline(parseInt(userId!)) ? "En ligne" : "Hors ligne"}>
              <Chip 
                icon={<FiberManualRecordIcon sx={{ fontSize: 16 }} />} 
                label={isOnline(parseInt(userId!)) ? "En ligne" : "Hors ligne"}
                color={isOnline(parseInt(userId!)) ? "success" : "default"}
                size="small"
                sx={{ ml: 2 }}
              />
            </Tooltip>
          </Box>
          <Button variant="outlined" onClick={() => navigate(trocId ? `/trocs/${trocId}` : '/messages')}>
            Retour
          </Button>
        </Box>
        
        <Divider />
        
        <Box sx={{ flexGrow: 1, overflow: 'auto', mb: 2, p: 2 }}>
          {messages.length === 0 ? (
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography color="textSecondary">
                Aucun message. Commencez la conversation!
              </Typography>
            </Box>
          ) : (
            <List>
              {messages.map((message : Message) =>
                <MessageElement message={message} key={message.id}/>
              )}
              <div ref={messagesEndRef} />
            </List>
          )}
        </Box>
        
        <Divider />
        
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Votre message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            multiline
            maxRows={3}
          />
          <IconButton 
            color="primary" 
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            sx={{ ml: 1 }}
          >
            <SendIcon />
          </IconButton>
        </Box>
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

export default Conversation;
