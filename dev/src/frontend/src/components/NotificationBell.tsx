import React, { useState } from 'react';
import {
  Badge,
  IconButton,
  Menu,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Button,
  Tooltip
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Message as MessageIcon,
  Event as EventIcon,
  SwapHoriz as TrocIcon,
  HomeRepairService as ServiceIcon,
  Info as InfoIcon,
  MarkEmailRead as MarkReadIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { useNotifications, Notification } from '../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';

const NotificationBell: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotifications();
  const navigate = useNavigate();

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'message':
        return <MessageIcon fontSize="small" />;
      case 'event':
        return <EventIcon fontSize="small" />;
      case 'troc':
        return <TrocIcon fontSize="small" />;
      case 'service':
        return <ServiceIcon fontSize="small" />;
      default:
        return <InfoIcon fontSize="small" />;
    }
  };

  const getTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'message':
        return 'primary';
      case 'event':
        return 'secondary';
      case 'troc':
        return 'success';
      case 'service':
        return 'warning';
      default:
        return 'default';
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    handleClose();
    
    // Navigation selon le type de notification
    switch (notification.type) {
      case 'message':
        navigate('/messages');
        break;
      case 'event':
        navigate('/events');
        break;
      case 'troc':
        navigate('/trocs');
        break;
      case 'service':
        navigate('/services');
        break;
      default:
        break;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}j`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}min`;
    return 'maintenant';
  };

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          color="inherit"
          onClick={handleClick}
          sx={{ ml: 1 }}
        >
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 380,
            maxHeight: 500,
            overflow: 'visible'
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6">
              Notifications
            </Typography>
            <Chip
              label={unreadCount}
              color="error"
              size="small"
              sx={{ display: unreadCount > 0 ? 'flex' : 'none' }}
            />
          </Box>
          
          {notifications.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                startIcon={<MarkReadIcon />}
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
              >
                Tout marquer comme lu
              </Button>
              <Button
                size="small"
                startIcon={<ClearIcon />}
                onClick={clearNotifications}
                color="error"
              >
                Tout supprimer
              </Button>
            </Box>
          )}
        </Box>

        {notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <NotificationsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Aucune notification
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0, maxHeight: 300, overflow: 'auto' }}>
            {notifications.slice(0, 10).map((notification) => (
              <ListItem
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                sx={{
                  cursor: 'pointer',
                  backgroundColor: notification.isRead ? 'transparent' : 'action.hover',
                  '&:hover': {
                    backgroundColor: 'action.selected'
                  },
                  borderBottom: 1,
                  borderColor: 'divider'
                }}
              >
                <ListItemIcon>
                  {getNotificationIcon(notification.type)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box component="div" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography 
                        variant="body2" 
                        fontWeight={notification.isRead ? 'normal' : 'bold'}
                        noWrap
                        component="span"
                      >
                        {notification.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }} component="span">
                        {formatTime(notification.createdAt)}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box component="div">
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }} component="div">
                        {notification.message}
                      </Typography>
                      <Chip
                        label={notification.type}
                        color={getTypeColor(notification.type)}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  }
                  primaryTypographyProps={{ component: 'div' }}
                  secondaryTypographyProps={{ component: 'div' }}
                />
                {!notification.isRead && (
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: 'error.main',
                      ml: 1
                    }}
                  />
                )}
              </ListItem>
            ))}
          </List>
        )}
        
        {notifications.length > 10 && (
          <Box sx={{ p: 1, textAlign: 'center', borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary">
              Et {notifications.length - 10} autres notifications...
            </Typography>
          </Box>
        )}
      </Menu>
    </>
  );
};

export default NotificationBell;
