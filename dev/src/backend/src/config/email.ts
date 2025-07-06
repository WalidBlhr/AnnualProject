import nodemailer from 'nodemailer';

// Configuration du transporteur email
export const createEmailTransporter = () => {
  // Configuration pour un service de test (Ethereal Email)
  // En production, utilisez un vrai service comme SendGrid, Mailgun, etc.
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true pour 465, false pour les autres ports
    auth: {
      user: process.env.SMTP_USER || 'ethereal.user@ethereal.email',
      pass: process.env.SMTP_PASS || 'ethereal.pass'
    }
  });
};

// Template d'email pour la réinitialisation du mot de passe
export const generatePasswordResetEmail = (userName: string, resetLink: string) => {
  return {
    subject: 'Réinitialisation de votre mot de passe - Quartissimo',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2196F3;">Quartissimo</h1>
        </div>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #333; margin-top: 0;">Réinitialisation de votre mot de passe</h2>
          <p style="color: #666; line-height: 1.6;">
            Bonjour ${userName},
          </p>
          <p style="color: #666; line-height: 1.6;">
            Vous avez demandé la réinitialisation de votre mot de passe sur Quartissimo. 
            Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="background-color: #2196F3; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Réinitialiser mon mot de passe
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6; font-size: 14px;">
            Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.
            Ce lien expirera dans 1 heure.
          </p>
          
          <p style="color: #666; line-height: 1.6; font-size: 14px;">
            Si le bouton ne fonctionne pas, vous pouvez copier et coller ce lien dans votre navigateur :
            <br>
            <a href="${resetLink}" style="color: #2196F3; word-break: break-all;">${resetLink}</a>
          </p>
        </div>
        
        <div style="text-align: center; color: #999; font-size: 12px;">
          <p>© 2025 Quartissimo - Tous droits réservés</p>
        </div>
      </div>
    `,
    text: `
      Bonjour ${userName},
      
      Vous avez demandé la réinitialisation de votre mot de passe sur Quartissimo.
      
      Cliquez sur ce lien pour créer un nouveau mot de passe :
      ${resetLink}
      
      Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.
      Ce lien expirera dans 1 heure.
      
      © 2025 Quartissimo
    `
  };
};

// Fonction pour envoyer un email
export const sendEmail = async (to: string, subject: string, html: string, text: string) => {
  try {
    const transporter = createEmailTransporter();
    
    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@quartissimo.com',
      to,
      subject,
      html,
      text
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email envoyé:', info.messageId);
    
    // En développement, afficher l'URL de prévisualisation
    if (process.env.NODE_ENV !== 'production') {
      console.log('Prévisualisation de l\'email:', nodemailer.getTestMessageUrl(info));
    }
    
    return info;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    throw error;
  }
};
