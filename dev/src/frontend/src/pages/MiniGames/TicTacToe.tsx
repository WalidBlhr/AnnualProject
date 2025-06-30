import { EmojiEvents, RestartAlt } from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    Container,
    Grid,
    Paper,
    Typography,
    useMediaQuery,
    useTheme
} from '@mui/material';
import React, { useState } from 'react';

type Player = 'X' | 'O' | null;

const TicTacToe: React.FC = () => {
    const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
    const [xIsNext, setXIsNext] = useState<boolean>(true);
    const [gameOver, setGameOver] = useState<boolean>(false);
    const [winner, setWinner] = useState<Player>(null);
    const [xScore, setXScore] = useState<number>(0);
    const [oScore, setOScore] = useState<number>(0);
    
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const calculateWinner = (squares: Player[]): Player => {
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
            [0, 4, 8], [2, 4, 6] // diagonals
        ];

        for (const [a, b, c] of lines) {
            if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
                return squares[a];
            }
        }
        return null;
    };

    const handleClick = (index: number) => {
        if (board[index] || gameOver) return;

        const newBoard = board.slice();
        newBoard[index] = xIsNext ? 'X' : 'O';
        setBoard(newBoard);
        setXIsNext(!xIsNext);

        const newWinner = calculateWinner(newBoard);
        if (newWinner) {
            setWinner(newWinner);
            setGameOver(true);
            if (newWinner === 'X') {
                setXScore(prev => prev + 1);
            } else {
                setOScore(prev => prev + 1);
            }
        } else if (newBoard.every(square => square !== null)) {
            setGameOver(true);
        }
    };

    const resetGame = () => {
        setBoard(Array(9).fill(null));
        setXIsNext(true);
        setGameOver(false);
        setWinner(null);
    };

    const resetScores = () => {
        setXScore(0);
        setOScore(0);
        resetGame();
    };

    const getStatus = () => {
        if (winner) {
            return `Joueur ${winner} a gagné !`;
        } else if (gameOver) {
            return 'Match nul !';
        } else {
            return `Prochain joueur : ${xIsNext ? 'X' : 'O'}`;
        }
    };

    const renderSquare = (index: number) => (
        <Paper
            elevation={3}
            sx={{
                width: isMobile ? '80px' : '100px',
                height: isMobile ? '80px' : '100px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: board[index] || gameOver ? 'default' : 'pointer',
                backgroundColor: board[index] ? 
                    (board[index] === 'X' ? 'primary.light' : 'secondary.light') : 
                    'background.paper',
                transition: 'all 0.3s ease',
                '&:hover': {
                    backgroundColor: board[index] || gameOver ? 
                        (board[index] === 'X' ? 'primary.light' : 'secondary.light') : 
                        'action.hover',
                    transform: board[index] || gameOver ? 'none' : 'scale(1.05)',
                }
            }}
            onClick={() => handleClick(index)}
        >
            <Typography
                variant={isMobile ? 'h4' : 'h3'}
                sx={{
                    fontWeight: 'bold',
                    color: board[index] === 'X' ? 'primary.main' : 'secondary.main',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
                }}
            >
                {board[index]}
            </Typography>
        </Paper>
    );

    return (
        <Container maxWidth="sm" sx={{ py: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                    <EmojiEvents sx={{ mr: 1, color: 'primary.main' }} />
                    Morpion
                </Typography>
                
                {/* Score Board */}
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    gap: 4, 
                    mb: 3,
                    flexWrap: 'wrap'
                }}>
                    <Paper elevation={2} sx={{ p: 2, minWidth: '120px' }}>
                        <Typography variant="h6" color="primary.main">Joueur X</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{xScore}</Typography>
                    </Paper>
                    <Paper elevation={2} sx={{ p: 2, minWidth: '120px' }}>
                        <Typography variant="h6" color="secondary.main">Joueur O</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{oScore}</Typography>
                    </Paper>
                </Box>

                {/* Game Status */}
                <Alert 
                    severity={winner ? 'success' : gameOver ? 'info' : 'info'}
                    sx={{ mb: 3, fontWeight: 'bold' }}
                >
                    {getStatus()}
                </Alert>

                {/* Game Board */}
                <Grid container spacing={1} sx={{ justifyContent: 'center', mb: 3 }}>
                    {Array(9).fill(null).map((_, index) => (
                        <Grid item key={index}>
                            {renderSquare(index)}
                        </Grid>
                    ))}
                </Grid>

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Button
                        variant="contained"
                        startIcon={<RestartAlt />}
                        onClick={resetGame}
                        size="large"
                    >
                        Nouvelle Partie
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={resetScores}
                        size="large"
                    >
                        Reset Scores
                    </Button>
                </Box>
            </Box>
        </Container>
    );
};

export default TicTacToe; 