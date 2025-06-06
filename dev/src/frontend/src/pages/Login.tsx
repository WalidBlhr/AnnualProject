import React, { useState } from 'react';
import { TextField, Button, Container, Typography, Alert } from '@mui/material';
import { login } from '../services/auth';
import { useNavigate } from 'react-router-dom';
import { io } from "socket.io-client";

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (event: React.FormEvent) => {
        event.preventDefault();
        setError('');
        
        try {
            const { token } = await login(email, password);

            const socket = io('http://localhost:3000', {
                auth: { token },
                autoConnect: true,
                reconnection: true,
                reconnectionAttempts: 5
            });
            // Redirection après connexion réussie
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Une erreur est survenue');
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
            </form>
        </Container>
    );
};

export default Login;