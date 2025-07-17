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
  ListItemButton,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { useSocket } from '../../contexts/SocketContext';
import { API_URL } from '../../const';
import { useAuth } from '../../contexts/AuthContext';
import { ListingResult } from '../../types/ListingResult';
import { GroupMessage, PrivateMessage } from '../../types/messages-types';

// Ajoutez ce type existant ou vérifiez s'il est déjà défini
interface Conversation {
  convId: string;
  convName: string;
  description?: string;
  lastMessage: {
    content: string;
    date_sent: string;
    status: string;
  };
  unreadCount: number;
}

// If !isConversationGroup(conv), the conversation is private
const isConversationGroup = (conv: Conversation) : boolean => {
  const prefix = conv.convId.slice(0,1);
  return prefix === 'g';
}

const getConversationUri = (conv: Conversation) : string => {
  const convType = conv.convId.slice(0,1);
  const convRealId = conv.convId.substring(1)
  if (convType === 'u') {
    return "/messages/" + convRealId;
  }

  if (convType === 'g') {
    return `/message-groups/${convRealId}/messages`;
  }

  return "/messages";
}

const Messages = () => {
  const navigate = useNavigate();
  const {isAuthenticated, user} = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [alert, setAlert] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });
  const { isOnline, fetchUserStatus } = useSocket(); // Utilisé pour vérifier si un utilisateur est en ligne

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    // Check if interlocuters is online or not
    if (conversations.length > 0) {
      const userIds = conversations.reduce((acc: number[], conv) => {
        if (isConversationGroup(conv)) {
          return acc;
        }
        return [...acc, parseInt(conv.convId.substring(1), 10)];
      }, []);

      userIds.forEach(id => {
        fetchUserStatus(id);
      });
    }
  }, [conversations, fetchUserStatus]);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token === null) {
        showAlert('Utilisateur non connecté', 'error');
        return;
      }

      const { data } = await axios.get<Conversation[]>(API_URL + '/me/conversations', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const sortedConversations = Array.from(data)
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

  const isOnlineWrapper = (conv: Conversation) : boolean => {
    if (isConversationGroup(conv)) {
      return false;
    }
    const otherUserId = parseInt(conv.convId.substring(1), 10);
    if (isNaN(otherUserId)) {
      console.warn("Other user id is NaN.");
      return false;
    }

    return isOnline(otherUserId);
  }

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
                      {conversation.convName}
                    </Typography>
                    {isOnlineWrapper(conversation) && (
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
                    {conversation.lastMessage.date_sent && new Date(conversation.lastMessage.date_sent).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Typography>
                </Box>
              );

              return (
                <React.Fragment key={conversation.convId}>
                  {index > 0 && <Divider />}
                  <ListItem disablePadding>
                    <ListItemButton onClick={() => navigate(getConversationUri(conversation))}>
                      <ListItemAvatar>
                        <Badge
                          overlap="circular"
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                          badgeContent={ isConversationGroup(conversation) ? undefined :
                            (<Tooltip title={isOnlineWrapper(conversation) ? "En ligne" : "Hors ligne"}>
                              <FiberManualRecordIcon 
                                sx={{ 
                                  fontSize: 14, 
                                  color: isOnlineWrapper(conversation) ? 'success.main' : 'text.disabled' 
                                }}
                              />
                            </Tooltip>)
                          }
                        >
                          <Avatar>
                            {conversation.convName.charAt(0)}
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText
                        primary={PrimaryText}
                        secondaryTypographyProps={{component: 'span'}}
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
                              {conversation.lastMessage.content === "" && isConversationGroup(conversation) ?
                                conversation.description :
                                conversation.lastMessage.content
                              }
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
                    </ListItemButton>
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
