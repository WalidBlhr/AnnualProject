import React, { useState } from 'react';
import { TextField, Button, Typography, Container, Alert } from '@mui/material';
import { signup } from '../services/auth';
import { useNavigate } from 'react-router-dom';

const Signup: React.FC = () => {
    const [firstname, setFirstname] = useState('');
    const [lastname, setLastname] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError('');
        
        try {
            await signup({
                email,
                password,
                firstname,
                lastname
            });
            // Redirection vers la page de connexion après inscription réussie
            navigate('/login');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Une erreur est survenue lors de l\'inscription');
        }
    };

    return (
        <Container component="main" maxWidth="xs">
            <Typography component="h1" variant="h5" sx={{ mt: 4, mb: 2 }}>
                Inscription
            </Typography>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}
            <form onSubmit={handleSubmit}>
                <TextField
                    label="Prénom"
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    required
                    value={firstname}
                    onChange={(e) => setFirstname(e.target.value)}
                />
                <TextField
                    label="Nom"
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    required
                    value={lastname}
                    onChange={(e) => setLastname(e.target.value)}
                />
                <TextField
                    label="Email"
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <TextField
                    label="Mot de passe"
                    type="password"
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    required
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
                    S'inscrire
                </Button>
            </form>
        </Container>
    );
};

export default Signup;