import {useState, useEffect, useRef} from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  TextField, 
  Button, 
  List,
  Snackbar,
  Alert,
  Divider,
  CircularProgress,
  IconButton,
  Tooltip,
  Chip,
} from '@mui/material';
import {useParams, useNavigate} from 'react-router-dom';
import axios, { AxiosRequestConfig } from 'axios';
import SendIcon from '@mui/icons-material/Send';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import {useSocket} from '../../contexts/SocketContext';
import {API_URL} from '../../const';
import {MessageElement} from './MessageElement';
import {useAuth} from '../../contexts/AuthContext';
import { DetailedMessageGroup, GroupMessage, PrivateMessage } from '../../types/messages-types';
import { ListingResult } from '../../types/ListingResult';
import MessageGroupEditingModal from '../../components/modals/MessageGroupEditingModal';
import { Settings } from '@mui/icons-material';

const Conversation = () => {
  const { userId, trocId, groupId } = useParams<{userId?: string, trocId?: string, groupId?: string}>();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { socket, isOnline, fetchUserStatus } = useSocket();
  const {user} = useAuth();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<DetailedMessageGroup>();
  const [editedGroup, setEditedGroup] = useState<DetailedMessageGroup>();

  const [messages, setMessages] = useState<(PrivateMessage | GroupMessage)[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [convTitle, setConvTitle] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const scrollDown = () => messagesEndRef.current?.scrollIntoView({behavior: "smooth"});

  useEffect(() => {
    fetchMessages();
    fetchConvTitle();
  }, [userId]);

  useEffect(() => {
    scrollDown();
  }, [messages]);

  // Listen for new messages via socket
  useEffect(() => {
    if (socket && (userId || groupId)) {
      const handleReceiveMessage = (message: PrivateMessage | GroupMessage) => {
        // Vérifier si le message appartient à cette conversation
        const token = localStorage.getItem('token');

        if (token && (
          (message.group && groupId && message.group.id === parseInt(groupId, 10)) || (
          message.receiver && userId && (
          (message.sender.id === parseInt(userId, 10) && message.receiver.id === (user?.userId ?? 0)) ||
          (message.sender.id === (user?.userId ?? 0) && message.receiver.id === parseInt(userId, 10))
        )))) {
          setMessages(prev => [...prev, message]);

          // Marquer le message comme lu si l'utilisateur est le destinataire
          if (message.sender.id !== (user?.userId ?? 0) && message.status === 'unread') {
            markMessageAsRead(message.id);
          }
        }
      };

      socket.on('receive_message', handleReceiveMessage);

      return () => {
        socket.off('receive_message', handleReceiveMessage);
      };
    }
  }, [socket, userId]);

  const fetchConvTitle = async () => {
    const reqOptions : AxiosRequestConfig<any> = {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    };

    try {
      let newTitle : string = "";

      if (userId !== undefined) {
        const {data} = await axios.get<{firstname: string, lastname:string}>(
          API_URL + "/users/" + userId,
          reqOptions
        );
        newTitle = `Conversation avec ${data.firstname} ${data.lastname}`;
      } else if (groupId !== undefined) {
        const {data} = await axios.get<DetailedMessageGroup>(
          API_URL + "/message-groups/" + groupId,
          reqOptions
        );
        newTitle = data.name + " (Groupe)";
        setCurrentGroup(data);
        setEditedGroup(data);
      }

      setConvTitle(newTitle);
    } catch (error) {
      showAlert("Erreur lors du chargement des détails de l'utilisateur", 'error');
    }
  };

  const fetchMessages = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('token');
    const headers = {Authorization: `Bearer ${token}`};

    try {
      let messagesData : (PrivateMessage | GroupMessage)[] = [];

      if (userId !== undefined) {
        const {data} = await axios.get<ListingResult<(PrivateMessage | GroupMessage)[]>>(
          `${API_URL}/messages`,
          {
            headers,
            params: {
              senderId: (user?.userId ?? 0),
              receiverId: userId,
              limit: 500,
            },
          }
        );
        messagesData = data.data;
      } else if (groupId !== undefined) {
        const {data} = await axios.get<ListingResult<(PrivateMessage | GroupMessage)[]>>(
          API_URL + `/message-groups/${groupId}/messages/`,
          {
            headers,
            params: {
              limit: 500,
            },
          }
        );
        messagesData = data.data;
      }

      setMessages(messagesData);

      // Marquer tous les messages non lus comme lus
      const unreadMessages = messagesData.filter(
        (msg: PrivateMessage | GroupMessage) => msg.status === 'unread' && msg.sender.id !== (user?.userId ?? 0)
      );

      for (const msg of unreadMessages) {
        await markMessageAsRead(msg.id);
      }

      setIsLoading(false);

      // Scroll to bottom after loading messages
      setTimeout(() => {
        scrollDown();
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
    const headers = {Authorization: `Bearer ${localStorage.getItem('token')}`}

    let savedMessage : PrivateMessage | GroupMessage;
    try {
      if (userId !== undefined) {
        const messageData = {
          content: newMessage,
          date_sent: new Date().toISOString(),
          senderId: (user?.userId ?? 0),
          receiverId: Number(userId),
          status: 'unread',
        };
        const {data} = await axios.post<PrivateMessage>(
          API_URL + '/messages',
          messageData,
          {headers}
        );
        savedMessage = data;
      } else if (groupId !== undefined) {
        const messageData = {
          content: newMessage,
          date_sent: new Date().toISOString(),
          senderId: (user?.userId ?? 0),
        };
        const {data} = await axios.post<GroupMessage>(
          API_URL + `/message-groups/${groupId}/messages/`,
          messageData,
          {headers}
        );
        savedMessage = data; 
      } else {
        console.error("userId nor groupId are defined.");
        return;
      }

      // Émettre le message via socket
      if (socket) {
        socket.emit('new_message', savedMessage);
      }

      setMessages(prev => [...prev, savedMessage]);
      setNewMessage('');
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
      fetchUserStatus(parseInt(userId));
    }
  }, [userId, fetchUserStatus]);

  if (isLoading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!convTitle) {
    return <Container>Chargement...</Container>;
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3, height: '70vh', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6">
              {convTitle}
              {trocId && ' (via une offre de troc)'}
            </Typography>

            {userId &&
              <Tooltip title={isOnline(parseInt(userId)) ? "En ligne" : "Hors ligne"}>
                <Chip 
                  icon={<FiberManualRecordIcon sx={{ fontSize: 16 }} />} 
                  label={isOnline(parseInt(userId)) ? "En ligne" : "Hors ligne"}
                  color={isOnline(parseInt(userId)) ? "success" : "default"}
                  size="small"
                  sx={{ ml: 2 }}
                />
              </Tooltip>
            }
            { currentGroup !== undefined && currentGroup.owner.id === (user?.userId ?? 0) &&
              <IconButton onClick={() => setEditDialogOpen(true)} sx={{ ml: 1 }}>
                <Settings />
              </IconButton>
            }
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
              {currentGroup && currentGroup.description && (
                <Typography color="textSecondary" sx={{mt: 3}}>
                  {currentGroup.description}
                </Typography>
              )}
            </Box>
          ) : (
            <List>
              {messages.map((message : PrivateMessage | GroupMessage) =>
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
            onKeyDown={(e) => {
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

      <MessageGroupEditingModal
        dialogOpen={editDialogOpen}
        setDialogOpen={setEditDialogOpen}
        showAlert={showAlert}
        editedGroup={editedGroup}
        setEditedGroup={setEditedGroup}
        onGroupSave={(data) => {
          setConvTitle(data.name);
          setCurrentGroup(data);
          if (data.members.filter(m => m.id === (user?.userId ?? 0)).length === 0) {
            navigate("/messages");
          }
        }}
        onCancel={() => setEditedGroup(currentGroup ? {...currentGroup} : undefined)}
        onGroupDelete={() => navigate("/messages")}
      />

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
