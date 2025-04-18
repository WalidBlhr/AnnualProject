import React, { useEffect, useState } from 'react';
import { Container, Typography, Button } from '@mui/material';
import axios from 'axios';
import { getUser } from '../services/auth';

interface UserDetails {
  firstname: string;
  lastname: string;
}

const Home: React.FC = () => {
    const [user, setUser] = useState<UserDetails | null>(null);
    const decodedToken = getUser();

    useEffect(() => {
        const fetchUserDetails = async () => {
            if (decodedToken?.userId) {
                try {
                    const response = await axios.get<UserDetails>(`http://localhost:3000/users/${decodedToken.userId}`, {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`
                        }
                    });
                    setUser(response.data);
                } catch (error) {
                    console.error('Error fetching user details:', error);
                }
            }
        };

        fetchUserDetails();
    }, [decodedToken?.userId]);

    return (
        <Container>
            <Typography variant="h4" component="h1" gutterBottom>
                {user ? `Bienvenue ${user.firstname} ${user.lastname}` : 'Bienvenue sur Quartissimo'}
            </Typography>
            <Typography variant="body1" paragraph>
                {user 
                    ? "Vous êtes connecté à votre espace personnel."
                    : "Connectez-vous pour accéder à toutes les fonctionnalités."}
            </Typography>
            {!user && (
                <Button 
                    variant="contained" 
                    color="primary" 
                    href="/login"
                >
                    Se connecter
                </Button>
            )}
        </Container>
    );
};

export default Home;