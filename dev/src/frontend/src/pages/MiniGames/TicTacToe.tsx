import { EmojiEvents, RestartAlt, Notifications, Check, Close } from '@mui/icons-material';
import {
    Alert,
    Badge,
    Box,
    Button,
    CircularProgress,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    Grid,
    IconButton,
    InputLabel,
    List,
    ListItem,
    ListItemText,
    MenuItem,
    Paper,
    Select,
    Snackbar,
    Typography,
    useMediaQuery,
    useTheme
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
    createTicTacToeGame, 
    fetchAllUsers, 
    getTicTacToeGame, 
    playTicTacToeMove,
    acceptTicTacToeInvitation,
    declineTicTacToeInvitation,
    getPendingTicTacToeInvitations
} from '../../services/api';

type Player = 'X' | 'O' | null;

const TicTacToe: React.FC = () => {
    const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
    const [xIsNext, setXIsNext] = useState<boolean>(true);
    const [gameOver, setGameOver] = useState<boolean>(false);
    const [winner, setWinner] = useState<Player>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = useState<boolean>(true);
    const [opponentId, setOpponentId] = useState<number | null>(null);
    const [game, setGame] = useState<any>(null);
    const [loadingGame, setLoadingGame] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [invitations, setInvitations] = useState<any[]>([]);
    const [invitationsDialogOpen, setInvitationsDialogOpen] = useState(false);
    const [loadingInvitations, setLoadingInvitations] = useState(false);
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: 'success' | 'error' | 'info';
    }>({ open: false, message: '', severity: 'info' });
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
        fetchInvitations();
    }, [user]);

    const fetchInvitations = async () => {
        setLoadingInvitations(true);
        try {
            const pendingInvitations = await getPendingTicTacToeInvitations();
            setInvitations(pendingInvitations);
        } catch (e) {
            console.error('Erreur lors du chargement des invitations:', e);
        } finally {
            setLoadingInvitations(false);
        }
    };

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
                        // Pas de partie en cours
                        setGame(null);
                        setLoadingGame(false);
                        return;
                    } else if (err.response && err.response.data && err.response.data.game) {
                        g = err.response.data.game;
                    } else {
                        throw err;
                    }
                }
                setGame(g);
            } catch (e: any) {
                setError('Impossible de charger la partie.');
                setGame(null);
            } finally {
                setLoadingGame(false);
            }
        };
        fetchOrCreateGame();
    }, [opponentId]);

    // Polling pour mettre à jour le jeu en temps réel
    useEffect(() => {
        if (!game || !opponentId) return;

        const interval = setInterval(async () => {
            try {
                const updatedGame = await getTicTacToeGame(opponentId);
                const previousStatus = game.status;
                setGame(updatedGame);
                
                // Arrêter le polling seulement après avoir affiché le résultat final
                if (updatedGame.status === 'finished') {
                    // Attendre un peu pour que l'utilisateur voit le résultat
                    setTimeout(() => {
                        clearInterval(interval);
                    }, 3000); // Arrêt après 3 secondes
                }
            } catch (e) {
                // La partie a peut-être été supprimée ou terminée
                console.error('Erreur lors de la mise à jour:', e);
            }
        }, 2000); // Mise à jour toutes les 2 secondes

        return () => clearInterval(interval);
    }, [game, opponentId, user?.userId]);

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
            showSnackbar('Défi envoyé ! En attente de la réponse de votre adversaire.', 'success');
        } catch (e: any) {
            setError('Impossible de créer une nouvelle partie.');
            showSnackbar('Erreur lors de la création du défi.', 'error');
        } finally {
            setLoadingGame(false);
        }
    };

    const handleAcceptInvitation = async (gameId: number) => {
        try {
            const acceptedGame = await acceptTicTacToeInvitation(gameId);
            setGame(acceptedGame);
            setOpponentId(acceptedGame.playerXId);
            setInvitationsDialogOpen(false);
            fetchInvitations();
            showSnackbar('Défi accepté ! La partie commence.', 'success');
        } catch (e: any) {
            showSnackbar('Erreur lors de l\'acceptation du défi.', 'error');
        }
    };

    const handleDeclineInvitation = async (gameId: number) => {
        try {
            await declineTicTacToeInvitation(gameId);
            fetchInvitations();
            showSnackbar('Défi refusé.', 'info');
        } catch (e: any) {
            showSnackbar('Erreur lors du refus du défi.', 'error');
        }
    };

    const showSnackbar = (message: string, severity: 'success' | 'error' | 'info') => {
        setSnackbar({ open: true, message, severity });
    };

    const getStatus = () => {
        if (!game) return '';
        
        console.log('Game status:', game.status, 'Winner:', game.winner, 'User ID:', user?.userId, 'PlayerX:', game.playerXId, 'PlayerO:', game.playerOId);
        
        if (game.status === 'pending') {
            const isChallenger = user?.userId === game.playerXId;
            return isChallenger ? 'En attente de la réponse de votre adversaire...' : 'Invitation reçue ! Acceptez ou refusez.';
        }
        
        if (game.status === 'finished') {
            if (game.winner === 'draw') return 'Match nul !';
            
            // Vérifier si c'est le joueur actuel qui a gagné
            const isPlayerX = user?.userId === game.playerXId;
            const isPlayerO = user?.userId === game.playerOId;
            const playerWon = (game.winner === 'X' && isPlayerX) || (game.winner === 'O' && isPlayerO);
            
            console.log('isPlayerX:', isPlayerX, 'isPlayerO:', isPlayerO, 'playerWon:', playerWon);
            
            if (playerWon) {
                return '🎉 Félicitations ! Vous avez gagné ! 🎉';
            } else {
                return '😔 Vous avez perdu... Bonne chance pour la prochaine !';
            }
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

                {/* Bouton pour les invitations */}
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={
                            <Badge badgeContent={invitations.length} color="error">
                                <Notifications />
                            </Badge>
                        }
                        onClick={() => setInvitationsDialogOpen(true)}
                        disabled={loadingInvitations}
                    >
                        Invitations ({invitations.length})
                    </Button>
                </Box>

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
                        severity={
                            game.status === 'finished' 
                                ? (game.winner === 'draw' 
                                    ? 'info' 
                                    : ((user?.userId === game.playerXId && game.winner === 'X') || 
                                       (user?.userId === game.playerOId && game.winner === 'O'))
                                        ? 'success' 
                                        : 'error')
                                : 'info'
                        }
                        sx={{ mb: 3, fontWeight: 'bold' }}
                    >
                        {getStatus()}
                    </Alert>
                )}

                {/* Game Board */}
                {game && (
                    <Box sx={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(3, 1fr)', 
                        gap: 1, 
                        maxWidth: isMobile ? 246 : 306, 
                        margin: '0 auto',
                        mb: 3
                    }}>
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
                            <Box key={index}>
                                {renderSquare(index)}
                            </Box>
                        ))}
                    </Box>
                )}

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', mb: 3 }}>
                    {!game && opponentId && (
                        <Button
                            variant="contained"
                            onClick={handleNewGame}
                            size="large"
                            disabled={loadingGame}
                        >
                            Lancer un Défi !
                        </Button>
                    )}
                    {game && game.status === 'pending' && user?.userId === game.playerOId && (
                        <>
                            <Button
                                variant="contained"
                                color="success"
                                startIcon={<Check />}
                                onClick={() => handleAcceptInvitation(game.id)}
                                size="large"
                            >
                                Accepter
                            </Button>
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<Close />}
                                onClick={() => handleDeclineInvitation(game.id)}
                                size="large"
                            >
                                Refuser
                            </Button>
                        </>
                    )}
                    {game && game.status === 'active' && (
                        <Button
                            variant="contained"
                            startIcon={<RestartAlt />}
                            onClick={handleNewGame}
                            size="large"
                            disabled={loadingGame}
                        >
                            Nouvelle Partie
                        </Button>
                    )}
                    {game && game.status === 'finished' && (
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<RestartAlt />}
                            onClick={handleNewGame}
                            size="large"
                            disabled={loadingGame}
                        >
                            Rejouer
                        </Button>
                    )}
                </Box>
            </Box>

            {/* Dialog des invitations */}
            <Dialog open={invitationsDialogOpen} onClose={() => setInvitationsDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    Invitations en attente ({invitations.length})
                </DialogTitle>
                <DialogContent>
                    {invitations.length === 0 ? (
                        <Typography>Aucune invitation en attente.</Typography>
                    ) : (
                        <List>
                            {invitations.map((invitation) => (
                                <ListItem key={invitation.id} divider>
                                    <ListItemText
                                        primary={`Défi de ${invitation.challenger?.firstname} ${invitation.challenger?.lastname}`}
                                        secondary={`Reçu le ${new Date(invitation.createdAt).toLocaleString()}`}
                                    />
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <IconButton
                                            color="success"
                                            onClick={() => handleAcceptInvitation(invitation.id)}
                                            size="small"
                                        >
                                            <Check />
                                        </IconButton>
                                        <IconButton
                                            color="error"
                                            onClick={() => handleDeclineInvitation(invitation.id)}
                                            size="small"
                                        >
                                            <Close />
                                        </IconButton>
                                    </Box>
                                </ListItem>
                            ))}
                        </List>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setInvitationsDialogOpen(false)}>Fermer</Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar pour les notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert
                    severity={snackbar.severity}
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default TicTacToe; 