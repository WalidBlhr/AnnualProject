import React from 'react';
import { AppBar, Toolbar, Button, Box } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { isAdmin } from '../services/auth';
import logo from '../assets/Final_logo.svg';

const Header: React.FC = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const userIsAdmin = isAdmin();

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
        window.location.reload();
    };

    return (
        <AppBar position="static">
            <Toolbar>
                <Box component={Link} to="/" sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
                    <img 
                        src={logo} 
                        alt="Quartissimo Logo" 
                        style={{ 
                            height: '64px', 
                            marginRight: '10px' 
                        }} 
                    />
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                    {token && (
                        <>
                            <Button 
                                color="inherit" 
                                component={Link} 
                                to="/trocs"
                                sx={{
                                    mr: 2,
                                    '&:hover': {
                                        backgroundColor: 'rgba(231, 79, 55, 0.1)'
                                    }
                                }}
                            >
                                Trocs
                            </Button>
                            <Button 
                                color="inherit" 
                                component={Link} 
                                to="/messages"
                                sx={{
                                    mr: 2,
                                    '&:hover': {
                                        backgroundColor: 'rgba(231, 79, 55, 0.1)'
                                    }
                                }}
                            >
                                Messages
                            </Button>
                        </>
                    )}
                </Box>
                <Box>
                    {token ? (
                        <>
                            {userIsAdmin && (
                                <Button 
                                    color="inherit" 
                                    component={Link} 
                                    to="/admin"
                                    sx={{
                                        mr: 2,
                                        '&:hover': {
                                            backgroundColor: 'rgba(231, 79, 55, 0.1)'
                                        }
                                    }}
                                >
                                    Administration
                                </Button>
                            )}
                            <Button 
                                color="inherit" 
                                onClick={handleLogout}
                                sx={{
                                    '&:hover': {
                                        backgroundColor: 'rgba(231, 79, 55, 0.1)'
                                    }
                                }}
                            >
                                Déconnexion
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button 
                                color="inherit" 
                                component={Link} 
                                to="/login"
                                sx={{ 
                                    mr: 1,
                                    '&:hover': {
                                        backgroundColor: 'rgba(231, 79, 55, 0.1)'
                                    }
                                }}
                            >
                                Connexion
                            </Button>
                            <Button 
                                color="inherit" 
                                component={Link} 
                                to="/signup"
                                sx={{
                                    '&:hover': {
                                        backgroundColor: 'rgba(231, 79, 55, 0.1)'
                                    }
                                }}
                            >
                                Inscription
                            </Button>
                        </>
                    )}
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Header;