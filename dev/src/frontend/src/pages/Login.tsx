import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            // Login request
            const response = await fetch('http://localhost:3001/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Email ou mot de passe invalide');
            }

            const data = await response.json();
            console.log('Login successful, token received:', data.token);
            
            // Get user info
            const userResponse = await fetch('http://localhost:3001/users/me', {
                headers: {
                    'Authorization': `Bearer ${data.token}`
                }
            });

            console.log('User info response status:', userResponse.status);
            
            if (!userResponse.ok) {
                const errorData = await userResponse.json();
                console.error('Error getting user info:', errorData);
                throw new Error(errorData.message || 'Erreur lors de la récupération des informations utilisateur');
            }

            const userData = await userResponse.json();
            console.log('User info received:', userData);

            // Store token and user info
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(userData));

            // Redirect to home
            navigate('/');
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message);
        }
    };

    return (
        <div className="login-container">
            <form className="login-form" onSubmit={handleSubmit}>
                <h2>Se connecter</h2>
                {error && <p className="error">{error}</p>}
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
                    <label>Mot de passe</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Entrez votre mot de passe"
                        required
                    />
                </div>
                <button type="submit">Se connecter</button>
            </form>
        </div>
    );
};

export default Login;
