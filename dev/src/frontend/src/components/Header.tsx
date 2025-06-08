import React, { useState } from 'react';
import { 
    AppBar, Toolbar, Button, Box, Menu, MenuItem, IconButton,
    useMediaQuery, useTheme, Drawer, List, ListItem, ListItemText
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { isAdmin } from '../services/auth';
import logo from '../assets/logo.svg';
import MenuIcon from '@mui/icons-material/Menu';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

const Header: React.FC = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const userIsAdmin = isAdmin();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [eventsAnchorEl, setEventsAnchorEl] = useState<null | HTMLElement>(null);
    const [servicesAnchorEl, setServicesAnchorEl] = useState<null | HTMLElement>(null);

    const handleLogout = () => {
        localStorage.removeItem('token');
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
                        
                        <Button color="inherit" component={Link} to="/messages">
                            Messages
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
                    <ListItem button component={Link} to="/messages" onClick={() => setDrawerOpen(false)}>
                        <ListItemText primary="Messages" />
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