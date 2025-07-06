import Joi from 'joi';

// Validation pour la demande de réinitialisation de mot de passe
export const forgotPasswordValidation = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'L\'email doit être valide',
    'any.required': 'L\'email est requis'
  })
});

// Validation pour la réinitialisation du mot de passe
export const resetPasswordValidation = Joi.object({
  token: Joi.string().required().messages({
    'any.required': 'Le token est requis'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Le mot de passe doit contenir au moins 6 caractères',
    'any.required': 'Le mot de passe est requis'
  })
});

// Validation pour vérifier la validité d'un token
export const verifyTokenValidation = Joi.object({
  token: Joi.string().required().messages({
    'any.required': 'Le token est requis'
  })
});
