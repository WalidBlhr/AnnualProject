import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Signup.css';

const Signup: React.FC = () => {
    const navigate = useNavigate();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const validatePassword = (password: string) => {
        if (password.length < 8) {
            return "Le mot de passe doit contenir au moins 8 caractères";
        }
        if (password.length > 20) {
            return "Le mot de passe ne doit pas dépasser 20 caractères";
        }
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (password !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas");
            setIsLoading(false);
            return;
        }

        const passwordError = validatePassword(password);
        if (passwordError) {
            setError(passwordError);
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:3001/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password,
                    firstname: firstName,
                    lastname: lastName,
                    role: 0
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Erreur lors de l\'inscription');
            }

            // Redirection vers la page de login après inscription réussie
            navigate('/login');
        } catch (err: any) {
            if (err.message.includes('Unexpected token')) {
                setError('Le serveur n\'est pas accessible. Veuillez vérifier que le serveur backend est en cours d\'exécution.');
            } else if (err.message.includes('email already exist')) {
                setError('Cet email est déjà utilisé. Veuillez en choisir un autre.');
            } else {
                setError(err.message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="signup-container">
            <form className="signup-form" onSubmit={handleSubmit}>
                <h2>Créer un compte</h2>
                {error && <p className="error">{error}</p>}
                <div className="form-group">
                    <label>Prénom</label>
                    <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Entrez votre prénom"
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Nom</label>
                    <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Entrez votre nom"
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Entrez votre email"
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Mot de passe (8-20 caractères)</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Entrez votre mot de passe"
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Confirmez le mot de passe</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirmez votre mot de passe"
                        required
                    />
                </div>
                <button type="submit" disabled={isLoading}>
                    {isLoading ? 'Inscription en cours...' : 'S\'inscrire'}
                </button>
            </form>
        </div>
    );
};

export default Signup;
