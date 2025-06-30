import { Request, Response } from 'express';
import { AppDataSource } from '../db/database';
import { TicTacToeGame } from '../db/models/tictactoe_game';

// Créer une partie de morpion
export const createTicTacToeGame = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { opponentId } = req.body;
        if (!opponentId || opponentId === userId) {
            res.status(400).json({ error: 'Adversaire invalide' });
            return;
        }

        // Vérifier qu'il n'existe pas déjà une partie active entre ces deux joueurs
        const repo = AppDataSource.getRepository(TicTacToeGame);
        const existing = await repo.findOne({
            where: [
                { playerXId: userId, playerOId: opponentId, status: 'active' },
                { playerXId: opponentId, playerOId: userId, status: 'active' }
            ]
        });
        if (existing) {
            res.status(409).json({ error: 'Une partie est déjà en cours avec cet adversaire', game: existing });
            return;
        }

        const game = repo.create({
            playerXId: userId,
            playerOId: opponentId,
            board: Array(9).fill(''),
            nextPlayer: 'X',
            status: 'active',
            winner: null
        });
        await repo.save(game);
        res.status(201).json(game);
    } catch (e) {
        res.status(500).json({ error: 'Erreur serveur', details: e });
    }
};

// Récupérer la partie en cours entre deux joueurs
export const getTicTacToeGame = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const opponentId = Number(req.query.opponentId);
        if (!opponentId || opponentId === userId) {
            res.status(400).json({ error: 'Adversaire invalide' });
            return;
        }
        const repo = AppDataSource.getRepository(TicTacToeGame);
        const game = await repo.findOne({
            where: [
                { playerXId: userId, playerOId: opponentId, status: 'active' },
                { playerXId: opponentId, playerOId: userId, status: 'active' }
            ]
        });
        if (!game) {
            res.status(404).json({ error: 'Aucune partie en cours' });
            return;
        }
        res.status(200).json(game);
    } catch (e) {
        res.status(500).json({ error: 'Erreur serveur', details: e });
    }
};

// Jouer un coup
export const playTicTacToeMove = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const gameId = Number(req.params.id);
        const { index } = req.body;
        if (typeof index !== 'number' || index < 0 || index > 8) {
            res.status(400).json({ error: 'Index invalide' });
            return;
        }
        const repo = AppDataSource.getRepository(TicTacToeGame);
        const game = await repo.findOneBy({ id: gameId });
        if (!game) {
            res.status(404).json({ error: 'Partie non trouvée' });
            return;
        }
        if (game.status !== 'active') {
            res.status(400).json({ error: 'La partie est terminée' });
            return;
        }
        // Vérifier que c'est bien le tour du joueur
        const isPlayerX = userId === game.playerXId;
        const isPlayerO = userId === game.playerOId;
        if ((game.nextPlayer === 'X' && !isPlayerX) || (game.nextPlayer === 'O' && !isPlayerO)) {
            res.status(403).json({ error: 'Ce n\'est pas votre tour' });
            return;
        }
        // Vérifier que la case est vide
        if (game.board[index] !== '') {
            res.status(400).json({ error: 'Case déjà jouée' });
            return;
        }
        // Jouer le coup
        game.board[index] = game.nextPlayer;
        // Vérifier victoire ou nul
        const winner = checkWinner(game.board);
        if (winner) {
            game.status = 'finished';
            game.winner = winner;
        } else if (game.board.every(cell => cell !== '')) {
            game.status = 'finished';
            game.winner = 'draw';
        } else {
            game.nextPlayer = game.nextPlayer === 'X' ? 'O' : 'X';
        }
        await repo.save(game);
        res.status(200).json(game);
    } catch (e) {
        res.status(500).json({ error: 'Erreur serveur', details: e });
    }
};

// Fonction utilitaire pour vérifier le gagnant
function checkWinner(board: string[]): 'X' | 'O' | null {
    const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];
    for (const [a, b, c] of lines) {
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a] as 'X' | 'O';
        }
    }
    return null;
} 