import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Paper,
  Divider,
  Badge,
  Snackbar,
  Alert,
  Button,
  Tooltip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import jwtDecode from 'jwt-decode';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { useSocket } from '../../contexts/SocketContext';

const Messages = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [alert, setAlert] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });
  const { isOnline, fetchUserStatuses } = useSocket(); // Utilisé pour vérifier si un utilisateur est en ligne
  
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

  // Ajoutez ce type existant ou vérifiez s'il est déjà défini
  interface Conversation {
    otherUserId: number;
    otherUserName: string;
    lastMessage: {
      content: string;
      date_sent: string;
      status: string;
    };
    unreadCount: number;
  }

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (conversations.length > 0) {
      // Récupérer le statut initial de tous les utilisateurs de conversation
      const userIds = conversations.map(conv => conv.otherUserId);
      
      // Pour chaque utilisateur, faire un appel séparé
      // (puisque l'API ne prend qu'un seul userId à la fois)
      userIds.forEach(id => {
        fetchUserStatuses([id]);
      });
    }
  }, [conversations, fetchUserStatuses]);

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
  
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>Mes messages</Typography>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => navigate('/new-message')}
        >
          Nouveau message
        </Button>
      </Box>
      
      <Paper elevation={2}>
        <List>
          {conversations.length === 0 ? (
            <ListItem>
              <ListItemText primary="Aucune conversation" />
            </ListItem>
          ) : (
            conversations.map((conversation, index) => {
              const PrimaryText = (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="subtitle1" component="span">
                      {conversation.otherUserName}
                    </Typography>
                    {isOnline(conversation.otherUserId) && (
                      <Typography
                        variant="caption"
                        component="span"
                        sx={{ ml: 1, color: 'success.main' }}
                      >
                        (en ligne)
                      </Typography>
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(conversation.lastMessage.date_sent).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Typography>
                </Box>
              );

              return (
                <React.Fragment key={conversation.otherUserId}>
                  {index > 0 && <Divider />}
                  <ListItem button onClick={() => navigate(`/messages/${conversation.otherUserId}`)}>
                    <ListItemAvatar>
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        badgeContent={
                          <Tooltip title={isOnline(conversation.otherUserId) ? "En ligne" : "Hors ligne"}>
                            <FiberManualRecordIcon 
                              sx={{ 
                                fontSize: 14, 
                                color: isOnline(conversation.otherUserId) ? 'success.main' : 'text.disabled' 
                              }}
                            />
                          </Tooltip>
                        }
                      >
                        <Avatar>
                          {conversation.otherUserName.charAt(0)}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>

                    <ListItemText
                      primary={PrimaryText}
                      secondary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '250px'
                            }}
                          >
                            {conversation.lastMessage.content}
                          </Typography>
                          {conversation.unreadCount > 0 && (
                            <Badge 
                              badgeContent={conversation.unreadCount} 
                              color="primary" 
                              sx={{ ml: 1 }}
                            />
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                </React.Fragment>
              );
            })
          )}
        </List>
      </Paper>
      
      {/* Snackbar d'alerte */}
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={() => setAlert({ ...alert, open: false })}
      >
        <Alert severity={alert.severity} onClose={() => setAlert({ ...alert, open: false })}>
          {alert.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Messages;
