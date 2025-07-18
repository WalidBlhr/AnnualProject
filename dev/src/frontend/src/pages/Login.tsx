import React, {useState} from 'react';
import {TextField, Button, Container, Typography, Alert, Box, Link} from '@mui/material';
import {useNavigate, Link as RouterLink} from 'react-router-dom';
import {io} from "socket.io-client";
import {useAuth} from '../contexts/AuthContext';
import {API_URL} from '../const';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [banInfo, setBanInfo] = useState<any>(null);
    const navigate = useNavigate();
    const {login} = useAuth();

    const handleLogin = async (event: React.FormEvent) => {
        event.preventDefault();
        setError('');
        setBanInfo(null);
        
        try {
            await login(email, password);
            const token = localStorage.getItem("token");
            
            const socket = io(API_URL, {
                auth: { token },
                autoConnect: true,
                reconnection: true,
                reconnectionAttempts: 5
            });
            // Redirection après connexion réussie
            navigate('/');
        } catch (err: any) {
            console.log('Login error:', err.response?.data);
            
            // Vérifier si c'est une erreur de bannissement
            if (err.response?.data?.message === 'Account Banned') {
                setBanInfo(err.response.data);
                setError('');
            } else {
                setError(err.response?.data?.message || 'Une erreur est survenue');
                setBanInfo(null);
            }
        }
    };

    return (
        <Container component="main" maxWidth="xs">
            <Typography component="h1" variant="h5" sx={{ mt: 4, mb: 2 }}>
                Connexion
            </Typography>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}
            {banInfo && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        🚫 Compte Banni
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                        {banInfo.details}
                    </Typography>
                    {banInfo.ban_info?.banned_at && (
                        <Typography variant="caption" display="block" sx={{ mt: 1, opacity: 0.8 }}>
                            Banni le : {new Date(banInfo.ban_info.banned_at).toLocaleString('fr-FR')}
                        </Typography>
                    )}
                    {banInfo.ban_info?.ban_until && (
                        <Typography variant="caption" display="block" sx={{ opacity: 0.8 }}>
                            Fin du bannissement : {new Date(banInfo.ban_info.ban_until).toLocaleString('fr-FR')}
                        </Typography>
                    )}
                </Alert>
            )}
            <form onSubmit={handleLogin}>
                <TextField
                    variant="outlined"
                    margin="normal"
                    required
                    fullWidth
                    label="Adresse email"
                    autoComplete="email"
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <TextField
                    variant="outlined"
                    margin="normal"
                    required
                    fullWidth
                    label="Mot de passe"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    color="primary"
                    sx={{ mt: 3, mb: 2 }}
                >
                    Se connecter
                </Button>
                
                <Box sx={{ textAlign: 'center' }}>
                    <Link component={RouterLink} to="/forgot-password" variant="body2">
                        Mot de passe oublié ?
                    </Link>
                </Box>
            </form>
        </Container>
    );
};

export default Login;