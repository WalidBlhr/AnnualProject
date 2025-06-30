import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import MenuIcon from '@mui/icons-material/Menu';
import {
    AppBar,
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

const Header: React.FC = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const userIsAdmin = useAuth().isAdmin();
    const theme = useTheme();
    const {logout} = useAuth();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [eventsAnchorEl, setEventsAnchorEl] = useState<null | HTMLElement>(null);
    const [servicesAnchorEl, setServicesAnchorEl] = useState<null | HTMLElement>(null);
    const [journalAnchorEl, setJournalAnchorEl] = useState<null | HTMLElement>(null);

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
                        <Button color="inherit" component={Link} to="/trocs">
                            Trocs
                        </Button>
                        
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
                            {userIsAdmin && (
                                <MenuItem component={Link} to="/journal/manage" onClick={() => setJournalAnchorEl(null)}>
                                    Gérer les articles
                                </MenuItem>
                            )}
                        </Menu>
                        
                        <Button color="inherit" component={Link} to="/messages">
                            Messages
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
                            <Button color="inherit" component={Link} to="/admin">
                                Administration
                            </Button>
                        )}
                        <Button color="inherit" onClick={handleLogout}>
                            Déconnexion
                        </Button>
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
                        <ListItemText primary="Trocs" />
                    </ListItem>
                    <ListItem button component={Link} to="/services" onClick={() => setDrawerOpen(false)}>
                        <ListItemText primary="Services" />
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