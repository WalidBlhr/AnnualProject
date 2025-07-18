import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import MenuIcon from '@mui/icons-material/Menu';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import {
    AppBar,
    Avatar,
    Box,
    Button,
    Drawer,
    IconButton,
    List, ListItem, ListItemText,
    Menu, MenuItem,
    Toolbar,
    useMediaQuery, useTheme,
} from '@mui/material';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.svg';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import NotificationBell from './NotificationBell';

const Header: React.FC = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const userIsAdmin = useAuth().isAdmin();
    const { user, logout } = useAuth();
    const { addNotification } = useNotifications();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [eventsAnchorEl, setEventsAnchorEl] = useState<null | HTMLElement>(null);
    const [trocsAnchorEl, setTrocsAnchorEl] = useState<null | HTMLElement>(null);
    const [servicesAnchorEl, setServicesAnchorEl] = useState<null | HTMLElement>(null);
    const [journalAnchorEl, setJournalAnchorEl] = useState<null | HTMLElement>(null);
    const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);

    const getInitials = () => {
        if (!user) return '?';
        return `${user.firstname.charAt(0)}${user.lastname.charAt(0)}`.toUpperCase();
    };

    // Fonction de test pour ajouter des notifications (temporaire)
    const addTestNotification = () => {
        const types = ['message', 'event', 'troc', 'service'] as const;
        const randomType = types[Math.floor(Math.random() * types.length)];
        
        addNotification({
            type: randomType,
            title: `Test ${randomType}`,
            message: `Ceci est une notification de test pour ${randomType}`,
            isRead: false
        });
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
        window.location.reload();
    };

    // Desktop navigation with dropdown menus
    const desktopNav = (
        <>
            <Box sx={{ flexGrow: 1, display: 'flex' }}>
                {token && (
                    <>
                        {/* Trocs dropdown */}
                        <Button 
                            color="inherit"
                            endIcon={<KeyboardArrowDownIcon />}
                            onClick={(e) => setTrocsAnchorEl(e.currentTarget)}
                        >
                            Trocs
                        </Button>
                        <Menu
                            anchorEl={trocsAnchorEl}
                            open={Boolean(trocsAnchorEl)}
                            onClose={() => setTrocsAnchorEl(null)}
                        >
                            <MenuItem component={Link} to="/trocs" onClick={() => setTrocsAnchorEl(null)}>
                                Tous les trocs
                            </MenuItem>
                            <MenuItem component={Link} to="/my-trocs" onClick={() => setTrocsAnchorEl(null)}>
                                Mes trocs
                            </MenuItem>
                        </Menu>
                        
                        {/* Services dropdown */}
                        <Button 
                            color="inherit"
                            endIcon={<KeyboardArrowDownIcon />}
                            onClick={(e) => setServicesAnchorEl(e.currentTarget)}
                        >
                            Services
                        </Button>
                        <Menu
                            anchorEl={servicesAnchorEl}
                            open={Boolean(servicesAnchorEl)}
                            onClose={() => setServicesAnchorEl(null)}
                        >
                            <MenuItem component={Link} to="/services" onClick={() => setServicesAnchorEl(null)}>
                                Tous les services
                            </MenuItem>
                            <MenuItem component={Link} to="/my-services" onClick={() => setServicesAnchorEl(null)}>
                                Mes services
                            </MenuItem>
                            <MenuItem component={Link} to="/my-bookings" onClick={() => setServicesAnchorEl(null)}>
                                Mes réservations
                            </MenuItem>
                            <MenuItem component={Link} to="/received-bookings" onClick={() => setServicesAnchorEl(null)}>
                                Réservations reçues
                            </MenuItem>
                            <MenuItem component={Link} to="/absences" onClick={() => setServicesAnchorEl(null)}>
                                Surveillance logement
                            </MenuItem>
                        </Menu>
                        
                        {/* Events dropdown */}
                        <Button 
                            color="inherit"
                            endIcon={<KeyboardArrowDownIcon />}
                            onClick={(e) => setEventsAnchorEl(e.currentTarget)}
                        >
                            Événements
                        </Button>
                        <Menu
                            anchorEl={eventsAnchorEl}
                            open={Boolean(eventsAnchorEl)}
                            onClose={() => setEventsAnchorEl(null)}
                        >
                            <MenuItem component={Link} to="/events" onClick={() => setEventsAnchorEl(null)}>
                                Sorties
                            </MenuItem>
                            <MenuItem component={Link} to="/my-events" onClick={() => setEventsAnchorEl(null)}>
                                Mes sorties
                            </MenuItem>
                            <MenuItem component={Link} to="/community-events" onClick={() => setEventsAnchorEl(null)}>
                                Événements communautaires
                            </MenuItem>
                            <MenuItem component={Link} to="/create-event" onClick={() => setEventsAnchorEl(null)}>
                                Créer un événement
                            </MenuItem>
                        </Menu>
                        
                        {/* Journal dropdown - NEW */}
                        <Button 
                            color="inherit"
                            endIcon={<KeyboardArrowDownIcon />}
                            onClick={(e) => setJournalAnchorEl(e.currentTarget)}
                        >
                            Journal
                        </Button>
                        <Menu
                            anchorEl={journalAnchorEl}
                            open={Boolean(journalAnchorEl)}
                            onClose={() => setJournalAnchorEl(null)}
                        >
                            <MenuItem component={Link} to="/journal" onClick={() => setJournalAnchorEl(null)}>
                                Actualités
                            </MenuItem>
                            <MenuItem component={Link} to="/journal/categories" onClick={() => setJournalAnchorEl(null)}>
                                Catégories
                            </MenuItem>
                            <MenuItem component={Link} to="/journal/editor" onClick={() => setJournalAnchorEl(null)}>
                                Rédiger un article
                            </MenuItem>
                            <MenuItem component={Link} to="/journal/my-articles" onClick={() => setJournalAnchorEl(null)}>
                                Mes articles
                            </MenuItem>
                        </Menu>
                        
                        <Button color="inherit" component={Link} to="/messages">
                            Messages
                        </Button>
                        
                        <Button color="inherit" component={Link} to="/suggestions">
                            Suggestions
                        </Button>
                        
                        <Button color="inherit" component={Link} to="/mini-games">
                            Mini Jeux
                        </Button>
                    </>
                )}
                
                {/* Public journal access - accessible even when not logged in */}
                {!token && (
                    <>
                        <Button color="inherit" component={Link} to="/journal">
                            Journal
                        </Button>
                        <Button color="inherit" component={Link} to="/mini-games">
                            Mini Jeux
                        </Button>
                    </>
                )}
            </Box>
            
            <Box>
                {token ? (
                    <>
                        {userIsAdmin && (
                            <>
                                <Button color="inherit" component={Link} to="/admin">
                                    Administration
                                </Button>
                                {/* Bouton de test temporaire pour les notifications */}
                                <Button 
                                    color="inherit" 
                                    onClick={addTestNotification}
                                    sx={{ fontSize: '0.8rem' }}
                                >
                                    Test Notif
                                </Button>
                            </>
                        )}
                        
                        {/* Notifications Bell */}
                        <NotificationBell />
                        
                        {/* Profile dropdown */}
                        <IconButton
                            onClick={(e) => setProfileAnchorEl(e.currentTarget)}
                            sx={{ 
                                ml: 2,
                                p: 0,
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                }
                            }}
                        >
                            <Avatar
                                sx={{
                                    width: 40,
                                    height: 40,
                                    bgcolor: 'secondary.main',
                                    fontSize: '1rem',
                                    fontWeight: 'bold',
                                    border: '2px solid rgba(255, 255, 255, 0.2)',
                                    transition: 'all 0.2s ease-in-out',
                                    '&:hover': {
                                        transform: 'scale(1.05)',
                                        border: '2px solid rgba(255, 255, 255, 0.4)',
                                    }
                                }}
                            >
                                {getInitials()}
                            </Avatar>
                        </IconButton>
                        <Menu
                            anchorEl={profileAnchorEl}
                            open={Boolean(profileAnchorEl)}
                            onClose={() => setProfileAnchorEl(null)}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'right',
                            }}
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            sx={{
                                mt: 1,
                                '& .MuiPaper-root': {
                                    backgroundColor: 'background.paper',
                                    borderRadius: '12px',
                                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                                    border: '1px solid rgba(0, 0, 0, 0.05)',
                                    minWidth: 200,
                                },
                            }}
                        >
                            {/* User info header */}
                            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(0, 0, 0, 0.08)' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                    <Avatar
                                        sx={{
                                            width: 24,
                                            height: 24,
                                            bgcolor: 'secondary.main',
                                            fontSize: '0.75rem',
                                            mr: 1
                                        }}
                                    >
                                        {getInitials()}
                                    </Avatar>
                                    <Box sx={{ fontSize: '0.875rem', fontWeight: 'medium', color: 'text.primary' }}>
                                        {user?.firstname} {user?.lastname}
                                    </Box>
                                </Box>
                                <Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                                    {user?.email}
                                </Box>
                            </Box>
                            
                            <MenuItem 
                                component={Link} 
                                to="/profile" 
                                onClick={() => setProfileAnchorEl(null)}
                                sx={{
                                    py: 1.5,
                                    px: 2,
                                    '&:hover': {
                                        backgroundColor: 'rgba(233, 79, 55, 0.08)',
                                    }
                                }}
                            >
                                <PersonIcon sx={{ mr: 2, color: 'secondary.main' }} />
                                Mon Profil
                            </MenuItem>
                            <MenuItem 
                                onClick={() => { 
                                    handleLogout(); 
                                    setProfileAnchorEl(null); 
                                }}
                                sx={{
                                    py: 1.5,
                                    px: 2,
                                    '&:hover': {
                                        backgroundColor: 'rgba(233, 79, 55, 0.08)',
                                    }
                                }}
                            >
                                <LogoutIcon sx={{ mr: 2, color: 'secondary.main' }} />
                                Déconnexion
                            </MenuItem>
                        </Menu>
                    </>
                ) : (
                    <>
                        <Button color="inherit" component={Link} to="/login">
                            Connexion
                        </Button>
                        <Button color="inherit" component={Link} to="/signup">
                            Inscription
                        </Button>
                    </>
                )}
            </Box>
        </>
    );

    // Mobile drawer content
    const drawerContent = (
        <List>
            {token ? (
                <>
                    <ListItem button component={Link} to="/trocs" onClick={() => setDrawerOpen(false)}>
                        <ListItemText primary="Tous les trocs" />
                    </ListItem>
                    <ListItem button component={Link} to="/my-trocs" onClick={() => setDrawerOpen(false)}>
                        <ListItemText primary="Mes trocs" />
                    </ListItem>
                    <ListItem button component={Link} to="/services" onClick={() => setDrawerOpen(false)}>
                        <ListItemText primary="Tous les services" />
                    </ListItem>
                    <ListItem button component={Link} to="/my-services" onClick={() => setDrawerOpen(false)}>
                        <ListItemText primary="Mes services" />
                    </ListItem>
                    <ListItem button component={Link} to="/my-bookings" onClick={() => setDrawerOpen(false)}>
                        <ListItemText primary="Mes réservations" />
                    </ListItem>
                    <ListItem button component={Link} to="/received-bookings" onClick={() => setDrawerOpen(false)}>
                        <ListItemText primary="Réservations reçues" />
                    </ListItem>
                    <ListItem button component={Link} to="/absences" onClick={() => setDrawerOpen(false)}>
                        <ListItemText primary="Surveillance logement" />
                    </ListItem>
                    <ListItem button component={Link} to="/events" onClick={() => setDrawerOpen(false)}>
                        <ListItemText primary="Sorties" />
                    </ListItem>
                    <ListItem button component={Link} to="/my-events" onClick={() => setDrawerOpen(false)}>
                        <ListItemText primary="Mes sorties" />
                    </ListItem>
                    <ListItem button component={Link} to="/community-events" onClick={() => setDrawerOpen(false)}>
                        <ListItemText primary="Événements communautaires" />
                    </ListItem>
                    <ListItem button component={Link} to="/create-event" onClick={() => setDrawerOpen(false)}>
                        <ListItemText primary="Créer un événement" />
                    </ListItem>
                    {/* Journal menu items - NEW */}
                    <ListItem button component={Link} to="/journal" onClick={() => setDrawerOpen(false)}>
                        <ListItemText primary="Journal - Actualités" />
                    </ListItem>
                    <ListItem button component={Link} to="/journal/categories" onClick={() => setDrawerOpen(false)}>
                        <ListItemText primary="Journal - Catégories" />
                    </ListItem>
                    {token && (
                        <ListItem button component={Link} to="/journal/new" onClick={() => setDrawerOpen(false)}>
                            <ListItemText primary="Rédiger un article" />
                        </ListItem>
                    )}
                    {userIsAdmin && (
                        <ListItem button component={Link} to="/journal/manage" onClick={() => setDrawerOpen(false)}>
                            <ListItemText primary="Gérer les articles" />
                        </ListItem>
                    )}
                    <ListItem button component={Link} to="/messages" onClick={() => setDrawerOpen(false)}>
                        <ListItemText primary="Messages" />
                    </ListItem>
                    <ListItem button component={Link} to="/mini-games" onClick={() => setDrawerOpen(false)}>
                        <ListItemText primary="Mini Jeux" />
                    </ListItem>
                    {userIsAdmin && (
                        <ListItem button component={Link} to="/admin" onClick={() => setDrawerOpen(false)}>
                            <ListItemText primary="Administration" />
                        </ListItem>
                    )}
                    <ListItem button component={Link} to="/profile" onClick={() => setDrawerOpen(false)}>
                        <ListItemText primary="Mon Profil" />
                    </ListItem>
                    <ListItem button onClick={() => { handleLogout(); setDrawerOpen(false); }}>
                        <ListItemText primary="Déconnexion" />
                    </ListItem>
                </>
            ) : (
                <>
                    {/* Public journal access in mobile menu */}
                    <ListItem button component={Link} to="/journal" onClick={() => setDrawerOpen(false)}>
                        <ListItemText primary="Journal" />
                    </ListItem>
                    <ListItem button component={Link} to="/mini-games" onClick={() => setDrawerOpen(false)}>
                        <ListItemText primary="Mini Jeux" />
                    </ListItem>
                    <ListItem button component={Link} to="/login" onClick={() => setDrawerOpen(false)}>
                        <ListItemText primary="Connexion" />
                    </ListItem>
                    <ListItem button component={Link} to="/signup" onClick={() => setDrawerOpen(false)}>
                        <ListItemText primary="Inscription" />
                    </ListItem>
                </>
            )}
        </List>
    );

    return (
        <AppBar position="static">
            <Toolbar>
                <Box component={Link} to="/" sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    textDecoration: 'none', 
                    color: 'inherit',
                    flexGrow: isMobile ? 1 : 0
                }}>
                    <img 
                        src={logo} 
                        alt="Quartissimo Logo" 
                        style={{ 
                            height: '64px', 
                            marginRight: '10px' 
                        }} 
                    />
                </Box>
                
                {isMobile ? (
                    <>
                        <IconButton 
                            edge="end" 
                            color="inherit" 
                            onClick={() => setDrawerOpen(true)}
                        >
                            <MenuIcon />
                        </IconButton>
                        <Drawer
                            anchor="right"
                            open={drawerOpen}
                            onClose={() => setDrawerOpen(false)}
                        >
                            {drawerContent}
                        </Drawer>
                    </>
                ) : (
                    desktopNav
                )}
            </Toolbar>
        </AppBar>
    );
};

export default Header;