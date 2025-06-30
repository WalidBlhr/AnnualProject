import { SportsEsports } from '@mui/icons-material';
import { Box, Container, Typography } from '@mui/material';
import React from 'react';
import TicTacToe from './TicTacToe';

const MiniGames: React.FC = () => {
    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                    <SportsEsports sx={{ mr: 2, color: 'primary.main' }} />
                    Mini Jeux
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
                    Amusez-vous avec nos jeux communautaires !
                </Typography>
            </Box>
            
            <TicTacToe />
        </Container>
    );
};

export default MiniGames; 