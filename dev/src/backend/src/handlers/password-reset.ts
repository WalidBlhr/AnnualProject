import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { AppDataSource } from '../db/database';
import { User } from '../db/models/user';
import { PasswordResetToken } from '../db/models/passwordResetToken';
import { sendEmail, generatePasswordResetEmail } from '../config/email';
import { forgotPasswordValidation, resetPasswordValidation, verifyTokenValidation } from './validators/password-reset';
import { generateValidationErrorMessage } from './validators/generate-validation-message';

/**
 * Demande de réinitialisation du mot de passe
 * POST /auth/forgot-password
 */
export const forgotPasswordHandler = async (req: Request, res: Response) => {
  try {
    const validation = forgotPasswordValidation.validate(req.body);
    if (validation.error) {
      res.status(400).send(generateValidationErrorMessage(validation.error.details));
      return;
    }

    const { email } = validation.value;
    
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { email } });

    // Toujours renvoyer un message de succès pour éviter l'énumération d'emails
    if (!user) {
      res.status(200).send({ 
        message: 'Si un compte avec cet email existe, un lien de réinitialisation a été envoyé.' 
      });
      return;
    }

    // Générer un token sécurisé
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 3600000); // 1 heure

    // Sauvegarder le token en base
    const tokenRepository = AppDataSource.getRepository(PasswordResetToken);
    
    // Supprimer les anciens tokens non utilisés pour cet utilisateur
    await tokenRepository.delete({ user: { id: user.id }, used: false });
    
    const passwordResetToken = tokenRepository.create({
      token: resetToken,
      expires_at: tokenExpiry,
      user: user
    });

    await tokenRepository.save(passwordResetToken);

    // Créer le lien de réinitialisation
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost'}/reset-password?token=${resetToken}`;

    // Envoyer l'email
    const emailContent = generatePasswordResetEmail(
      `${user.firstname} ${user.lastname}`,
      resetLink
    );

    await sendEmail(user.email, emailContent.subject, emailContent.html, emailContent.text);

    res.status(200).send({ 
      message: 'Si un compte avec cet email existe, un lien de réinitialisation a été envoyé.' 
    });

  } catch (error) {
    console.error('Erreur lors de la demande de réinitialisation:', error);
    res.status(500).send({ message: 'Erreur interne du serveur' });
  }
};

/**
 * Vérification de la validité d'un token
 * GET /auth/verify-reset-token/:token
 */
export const verifyResetTokenHandler = async (req: Request, res: Response) => {
  try {
    const validation = verifyTokenValidation.validate(req.params);
    if (validation.error) {
      res.status(400).send(generateValidationErrorMessage(validation.error.details));
      return;
    }

    const { token } = validation.value;
    
    const tokenRepository = AppDataSource.getRepository(PasswordResetToken);
    const resetToken = await tokenRepository.findOne({
      where: { token, used: false },
      relations: ['user']
    });

    if (!resetToken) {
      res.status(400).send({ message: 'Token invalide ou expiré' });
      return;
    }

    if (resetToken.expires_at < new Date()) {
      res.status(400).send({ message: 'Token expiré' });
      return;
    }

    res.status(200).send({ 
      message: 'Token valide',
      user: {
        email: resetToken.user.email,
        firstname: resetToken.user.firstname,
        lastname: resetToken.user.lastname
      }
    });

  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error);
    res.status(500).send({ message: 'Erreur interne du serveur' });
  }
};

/**
 * Réinitialisation du mot de passe
 * POST /auth/reset-password
 */
export const resetPasswordHandler = async (req: Request, res: Response) => {
  try {
    const validation = resetPasswordValidation.validate(req.body);
    if (validation.error) {
      res.status(400).send(generateValidationErrorMessage(validation.error.details));
      return;
    }

    const { token, password } = validation.value;
    
    const tokenRepository = AppDataSource.getRepository(PasswordResetToken);
    const resetToken = await tokenRepository.findOne({
      where: { token, used: false },
      relations: ['user']
    });

    if (!resetToken) {
      res.status(400).send({ message: 'Token invalide ou expiré' });
      return;
    }

    if (resetToken.expires_at < new Date()) {
      res.status(400).send({ message: 'Token expiré' });
      return;
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Mettre à jour le mot de passe de l'utilisateur
    const userRepository = AppDataSource.getRepository(User);
    const user = resetToken.user;
    user.password = hashedPassword;
    await userRepository.save(user);

    // Marquer le token comme utilisé
    await tokenRepository.update(resetToken.id, { used: true });

    res.status(200).send({ message: 'Mot de passe réinitialisé avec succès' });

  } catch (error) {
    console.error('Erreur lors de la réinitialisation du mot de passe:', error);
    res.status(500).send({ message: 'Erreur interne du serveur' });
  }
};
