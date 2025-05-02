import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Box,
  Badge,
  Alert,
  Snackbar,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import axios from 'axios';
import jwtDecode from "jwt-decode";

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
}

interface Conversation {
  otherUserId: number;
  otherUserName: string;
  lastMessage: Message;
  unreadCount: number;
}

const Messages: React.FC = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [alert, setAlert] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showAlert('Utilisateur non connecté', 'error');
        return;
      }

      const decoded = jwtDecode<{ userId: number }>(token);
      const { data } = await axios.get('http://localhost:3000/messages', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Messages reçus:', data); // Pour debug

      // Grouper les messages par conversation
      const conversationsMap = new Map<number, Conversation>();
      
      if (Array.isArray(data.data)) {
        data.data.forEach((message: Message) => {
          const currentUserId = decoded.userId;
          const otherUser = message.sender.id === currentUserId ? message.receiver : message.sender;
          
          const existingConversation = conversationsMap.get(otherUser.id);
          if (!existingConversation) {
            conversationsMap.set(otherUser.id, {
              otherUserId: otherUser.id,
              otherUserName: `${otherUser.firstname} ${otherUser.lastname}`,
              lastMessage: message,
              unreadCount: message.status === 'non_lu' && message.receiver.id === currentUserId ? 1 : 0
            });
          } else {
            if (new Date(message.date_sent) > new Date(existingConversation.lastMessage.date_sent)) {
              existingConversation.lastMessage = message;
            }
            if (message.status === 'non_lu' && message.receiver.id === currentUserId) {
              existingConversation.unreadCount++;
            }
          }
        });
      }

      const sortedConversations = Array.from(conversationsMap.values())
        .sort((a, b) => 
          new Date(b.lastMessage.date_sent).getTime() - new Date(a.lastMessage.date_sent).getTime()
        );

      setConversations(sortedConversations);
    } catch (error) {
      console.error('Erreur:', error); // Pour debug
      showAlert('Erreur lors du chargement des conversations', 'error');
    }
  };

  const showAlert = (message: string, severity: 'success' | 'error') => {
    setAlert({ open: true, message, severity });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Mes conversations
        </Typography>

        <List>
          {conversations.length === 0 ? (
            <ListItem>
              <ListItemText primary="Aucune conversation" />
            </ListItem>
          ) : (
            conversations.map((conversation) => (
              <React.Fragment key={conversation.otherUserId}>
                <ListItem 
                  button 
                  onClick={() => navigate(`/messages/${conversation.otherUserId}`)}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar>
                      <PersonIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography component="span" variant="body1">
                          {conversation.otherUserName}
                        </Typography>
                        {conversation.unreadCount > 0 && (
                          <Badge 
                            badgeContent={conversation.unreadCount} 
                            color="primary"
                            sx={{ ml: 2 }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography component="span" variant="body2">
                          {conversation.lastMessage.content}
                        </Typography>
                        <br />
                        <Typography component="span" variant="caption" color="textSecondary">
                          {formatDate(conversation.lastMessage.date_sent)}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                <Divider variant="inset" component="li" />
              </React.Fragment>
            ))
          )}
        </List>
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

export default Messages;
