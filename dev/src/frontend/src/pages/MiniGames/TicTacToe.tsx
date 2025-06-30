import { EmojiEvents, RestartAlt } from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Container,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Typography,
    useMediaQuery,
    useTheme
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { createTicTacToeGame, fetchAllUsers, getTicTacToeGame, playTicTacToeMove } from '../../services/api';

type Player = 'X' | 'O' | null;

const TicTacToe: React.FC = () => {
    const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
    const [xIsNext, setXIsNext] = useState<boolean>(true);
    const [gameOver, setGameOver] = useState<boolean>(false);
    const [winner, setWinner] = useState<Player>(null);
    const [xScore, setXScore] = useState<number>(0);
    const [oScore, setOScore] = useState<number>(0);
    const [users, setUsers] = useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = useState<boolean>(true);
    const [opponentId, setOpponentId] = useState<number | null>(null);
    const [game, setGame] = useState<any>(null);
    const [loadingGame, setLoadingGame] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();
    
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    useEffect(() => {
        const fetchUsersList = async () => {
            setLoadingUsers(true);
            try {
                const allUsers = await fetchAllUsers();
                setUsers(allUsers.filter((u: any) => u.id !== user?.userId));
            } catch (e) {
                setUsers([]);
            } finally {
                setLoadingUsers(false);
            }
        };
        fetchUsersList();
    }, [user]);

    useEffect(() => {
        if (!opponentId) {
            setGame(null);
            setError(null);
            return;
        }
        const fetchOrCreateGame = async () => {
            setLoadingGame(true);
            setError(null);
            try {
                let g;
                try {
                    g = await getTicTacToeGame(opponentId);
                } catch (err: any) {
                    if (err.response && err.response.status === 404) {
                        g = await createTicTacToeGame(opponentId);
                    } else if (err.response && err.response.data && err.response.data.game) {
                        g = err.response.data.game;
                    } else {
                        throw err;
                    }
                }
                setGame(g);
            } catch (e: any) {
                setError('Impossible de charger ou créer la partie.');
                setGame(null);
            } finally {
                setLoadingGame(false);
            }
        };
        fetchOrCreateGame();
    }, [opponentId]);

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

    const handlePlay = async (index: number) => {
        if (!game || game.status !== 'active') return;
        if (game.board[index] !== '') return;
        const isPlayerX = user?.userId === game.playerXId;
        const isPlayerO = user?.userId === game.playerOId;
        if ((game.nextPlayer === 'X' && !isPlayerX) || (game.nextPlayer === 'O' && !isPlayerO)) return;
        setLoadingGame(true);
        setError(null);
        try {
            const updated = await playTicTacToeMove(game.id, index);
            setGame(updated);
        } catch (e: any) {
            setError('Erreur lors du coup.');
        } finally {
            setLoadingGame(false);
        }
    };

    const handleNewGame = async () => {
        if (!opponentId) return;
        setGame(null);
        setError(null);
        setLoadingGame(true);
        try {
            const g = await createTicTacToeGame(opponentId);
            setGame(g);
        } catch (e: any) {
            setError('Impossible de créer une nouvelle partie.');
        } finally {
            setLoadingGame(false);
        }
    };

    const getStatus = () => {
        if (!game) return '';
        if (game.status === 'finished') {
            if (game.winner === 'draw') return 'Match nul !';
            return `Joueur ${game.winner} a gagné !`;
        }
        const isPlayerX = user?.userId === game.playerXId;
        const isPlayerO = user?.userId === game.playerOId;
        if ((game.nextPlayer === 'X' && isPlayerX) || (game.nextPlayer === 'O' && isPlayerO)) {
            return 'À vous de jouer !';
        } else {
            return "En attente de l'adversaire...";
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
                cursor: !game || game.status !== 'active' || game.board[index] !== '' || loadingGame ? 'default' : 'pointer',
                backgroundColor: game && game.board[index] ? 
                    (game.board[index] === 'X' ? 'primary.light' : 'secondary.light') : 
                    'background.paper',
                transition: 'all 0.3s ease',
                '&:hover': {
                    backgroundColor: game && game.board[index] ? 
                        (game.board[index] === 'X' ? 'primary.light' : 'secondary.light') : 
                        'action.hover',
                    transform: game && game.board[index] ? 'none' : 'scale(1.05)',
                }
            }}
            onClick={() => handlePlay(index)}
        >
            <Typography
                variant={isMobile ? 'h4' : 'h3'}
                sx={{
                    fontWeight: 'bold',
                    color: game && game.board[index] === 'X' ? 'primary.main' : 'secondary.main',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
                }}
            >
                {game ? game.board[index] : ''}
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

                {/* Sélection de l'adversaire */}
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
                    <FormControl sx={{ minWidth: 220 }}>
                        <InputLabel id="opponent-label">Défier un utilisateur</InputLabel>
                        <Select
                            labelId="opponent-label"
                            value={opponentId ?? ''}
                            label="Défier un utilisateur"
                            onChange={e => setOpponentId(Number(e.target.value))}
                            disabled={loadingUsers || loadingGame}
                        >
                            <MenuItem value=""><em>Choisir...</em></MenuItem>
                            {loadingUsers ? (
                                <MenuItem value="" disabled>
                                    <CircularProgress size={20} /> Chargement...
                                </MenuItem>
                            ) : (
                                users.map(u => (
                                    <MenuItem key={u.id} value={u.id}>
                                        {u.firstname} {u.lastname} ({u.email})
                                    </MenuItem>
                                ))
                            )}
                        </Select>
                    </FormControl>
                </Box>

                {/* Affichage des joueurs */}
                {opponentId && (
                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center', gap: 4 }}>
                        <Paper elevation={2} sx={{ p: 2, minWidth: '120px', background: '#e3f2fd' }}>
                            <Typography variant="h6" color="primary.main">Vous ({game && user?.userId === game.playerXId ? 'X' : 'O'})</Typography>
                            <Typography variant="body1">{user?.firstname} {user?.lastname}</Typography>
                        </Paper>
                        <Paper elevation={2} sx={{ p: 2, minWidth: '120px', background: '#fff3e0' }}>
                            <Typography variant="h6" color="secondary.main">Adversaire ({game && user?.userId === game.playerXId ? 'O' : 'X'})</Typography>
                            <Typography variant="body1">
                                {users.find(u => u.id === opponentId)?.firstname} {users.find(u => u.id === opponentId)?.lastname}
                            </Typography>
                        </Paper>
                    </Box>
                )}

                {/* Statut et erreurs */}
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {loadingGame && <Box sx={{ mb: 2 }}><CircularProgress /></Box>}
                {game && (
                    <Alert 
                        severity={game.status === 'finished' ? (game.winner === 'draw' ? 'info' : 'success') : 'info'}
                        sx={{ mb: 3, fontWeight: 'bold' }}
                    >
                        {getStatus()}
                    </Alert>
                )}

                {/* Game Board */}
                {game && (
                    <Grid container spacing={1} sx={{ justifyContent: 'center', mb: 3, width: isMobile ? 246 : 306, margin: '0 auto' }}>
                        {[0, 1, 2].map(row => (
                            <Grid container item key={row} spacing={1} justifyContent="center">
                                {[0, 1, 2].map(col => {
                                    const index = row * 3 + col;
                                    return (
                                        <Grid item key={index}>
                                            {renderSquare(index)}
                                        </Grid>
                                    );
                                })}
                            </Grid>
                        ))}
                    </Grid>
                )}

                {/* Action Buttons */}
                {game && (
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Button
                            variant="contained"
                            startIcon={<RestartAlt />}
                            onClick={handleNewGame}
                            size="large"
                            disabled={loadingGame}
                        >
                            Nouvelle Partie
                        </Button>
                    </Box>
                )}
            </Box>
        </Container>
    );
};

export default TicTacToe; 