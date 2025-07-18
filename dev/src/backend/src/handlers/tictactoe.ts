import { Request, Response } from 'express';
import { AppDataSource } from '../db/database';
import { TicTacToeGame } from '../db/models/tictactoe_game';
import { NotificationService } from '../utils/notificationService';
import { User } from '../db/models/user';

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
                { playerXId: opponentId, playerOId: userId, status: 'active' },
                { playerXId: userId, playerOId: opponentId, status: 'pending' },
                { playerXId: opponentId, playerOId: userId, status: 'pending' }
            ]
        });
        if (existing) {
            res.status(409).json({ error: 'Une partie est déjà en cours ou en attente avec cet adversaire', game: existing });
            return;
        }

        const game = repo.create({
            playerXId: userId,
            playerOId: opponentId,
            board: Array(9).fill(''),
            nextPlayer: 'X',
            status: 'pending',
            winner: null
        });
        await repo.save(game);

        // Récupérer les informations du joueur qui lance le défi
        const userRepo = AppDataSource.getRepository(User);
        const challenger = await userRepo.findOneBy({ id: userId });
        
        // Envoyer une notification au joueur défié
        if (challenger) {
            await NotificationService.sendNotification({
                type: 'game',
                title: 'Défi Morpion !',
                content: `${challenger.firstname} ${challenger.lastname} vous défie au Morpion ! La partie a commencé.`,
                receiverId: opponentId,
                senderId: userId,
                relatedId: game.id,
                sendEmail: false,
                actionUrl: `/mini-games`
            });
        }

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
                { playerXId: opponentId, playerOId: userId, status: 'active' },
                { playerXId: userId, playerOId: opponentId, status: 'pending' },
                { playerXId: opponentId, playerOId: userId, status: 'pending' },
                { playerXId: userId, playerOId: opponentId, status: 'finished' },
                { playerXId: opponentId, playerOId: userId, status: 'finished' }
            ],
            order: { updatedAt: 'DESC' }
        });
        if (!game) {
            res.status(404).json({ error: 'Aucune partie en cours' });
            return;
        }
        
        console.log('GET TicTacToe - Game found:', game.status, 'Winner:', game.winner, 'User requesting:', userId);
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
            
            // Notifier les joueurs de la fin de partie
            const userRepo = AppDataSource.getRepository(User);
            const winnerUser = await userRepo.findOneBy({ 
                id: winner === 'X' ? game.playerXId : game.playerOId 
            });
            const loserUser = await userRepo.findOneBy({ 
                id: winner === 'X' ? game.playerOId : game.playerXId 
            });
            
            if (winnerUser && loserUser) {
                // Notifier le gagnant
                await NotificationService.sendNotification({
                    type: 'game',
                    title: 'Victoire au Morpion !',
                    content: `Félicitations ! Vous avez battu ${loserUser.firstname} ${loserUser.lastname} au Morpion !`,
                    receiverId: winnerUser.id,
                    sendEmail: false
                });
                
                // Notifier le perdant
                await NotificationService.sendNotification({
                    type: 'game',
                    title: 'Défaite au Morpion',
                    content: `${winnerUser.firstname} ${winnerUser.lastname} vous a battu au Morpion. Bonne chance pour la prochaine !`,
                    receiverId: loserUser.id,
                    sendEmail: false
                });
            }
        } else if (game.board.every(cell => cell !== '')) {
            game.status = 'finished';
            game.winner = 'draw';
            
            // Notifier les joueurs du match nul
            const userRepo = AppDataSource.getRepository(User);
            await Promise.all([
                NotificationService.sendNotification({
                    type: 'game',
                    title: 'Match nul au Morpion',
                    content: 'Votre partie de Morpion s\'est terminée par un match nul !',
                    receiverId: game.playerXId,
                    sendEmail: false
                }),
                NotificationService.sendNotification({
                    type: 'game',
                    title: 'Match nul au Morpion',
                    content: 'Votre partie de Morpion s\'est terminée par un match nul !',
                    receiverId: game.playerOId,
                    sendEmail: false
                })
            ]);
        } else {
            game.nextPlayer = game.nextPlayer === 'X' ? 'O' : 'X';
        }
        
        console.log('Avant sauvegarde - Game status:', game.status, 'Winner:', game.winner);
        await repo.save(game);
        console.log('Après sauvegarde - Game status:', game.status, 'Winner:', game.winner);
        
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

// Accepter une invitation de partie
export const acceptTicTacToeInvitation = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const gameId = Number(req.params.id);
        
        const repo = AppDataSource.getRepository(TicTacToeGame);
        const game = await repo.findOneBy({ id: gameId });
        
        if (!game) {
            res.status(404).json({ error: 'Partie non trouvée' });
            return;
        }
        
        // Vérifier que l'utilisateur est bien le joueur O (celui qui a été défié)
        if (game.playerOId !== userId) {
            res.status(403).json({ error: 'Vous n\'êtes pas autorisé à accepter cette invitation' });
            return;
        }
        
        if (game.status !== 'pending') {
            res.status(400).json({ error: 'Cette invitation n\'est plus valide' });
            return;
        }
        
        // Accepter l'invitation
        game.status = 'active';
        await repo.save(game);
        
        // Notifier le challenger que l'invitation a été acceptée
        const userRepo = AppDataSource.getRepository(User);
        const accepter = await userRepo.findOneBy({ id: userId });
        
        if (accepter) {
            await NotificationService.sendNotification({
                type: 'game',
                title: 'Défi accepté !',
                content: `${accepter.firstname} ${accepter.lastname} a accepté votre défi au Morpion ! La partie commence.`,
                receiverId: game.playerXId,
                senderId: userId,
                relatedId: game.id,
                sendEmail: false,
                actionUrl: `/mini-games`
            });
        }
        
        res.status(200).json(game);
    } catch (e) {
        res.status(500).json({ error: 'Erreur serveur', details: e });
    }
};

// Refuser une invitation de partie
export const declineTicTacToeInvitation = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const gameId = Number(req.params.id);
        
        const repo = AppDataSource.getRepository(TicTacToeGame);
        const game = await repo.findOneBy({ id: gameId });
        
        if (!game) {
            res.status(404).json({ error: 'Partie non trouvée' });
            return;
        }
        
        // Vérifier que l'utilisateur est bien le joueur O (celui qui a été défié)
        if (game.playerOId !== userId) {
            res.status(403).json({ error: 'Vous n\'êtes pas autorisé à refuser cette invitation' });
            return;
        }
        
        if (game.status !== 'pending') {
            res.status(400).json({ error: 'Cette invitation n\'est plus valide' });
            return;
        }
        
        // Refuser l'invitation
        game.status = 'declined';
        await repo.save(game);
        
        // Notifier le challenger que l'invitation a été refusée
        const userRepo = AppDataSource.getRepository(User);
        const decliner = await userRepo.findOneBy({ id: userId });
        
        if (decliner) {
            await NotificationService.sendNotification({
                type: 'game',
                title: 'Défi refusé',
                content: `${decliner.firstname} ${decliner.lastname} a refusé votre défi au Morpion.`,
                receiverId: game.playerXId,
                senderId: userId,
                relatedId: game.id,
                sendEmail: false
            });
        }
        
        res.status(200).json({ message: 'Invitation refusée' });
    } catch (e) {
        res.status(500).json({ error: 'Erreur serveur', details: e });
    }
};

// Obtenir les invitations en attente pour un utilisateur
export const getPendingTicTacToeInvitations = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        
        const repo = AppDataSource.getRepository(TicTacToeGame);
        const userRepo = AppDataSource.getRepository(User);
        
        const invitations = await repo.find({
            where: { playerOId: userId, status: 'pending' },
            order: { createdAt: 'DESC' }
        });
        
        // Récupérer les informations des challengers
        const invitationsWithUsers = await Promise.all(
            invitations.map(async (invitation) => {
                const challenger = await userRepo.findOneBy({ id: invitation.playerXId });
                return {
                    ...invitation,
                    challenger: challenger ? {
                        id: challenger.id,
                        firstname: challenger.firstname,
                        lastname: challenger.lastname,
                        email: challenger.email
                    } : null
                };
            })
        );
        
        res.status(200).json(invitationsWithUsers);
    } catch (e) {
        res.status(500).json({ error: 'Erreur serveur', details: e });
    }
}; 