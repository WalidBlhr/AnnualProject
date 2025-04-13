import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home: React.FC = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <div className="home-container">
            <div className="welcome-card">
                <h1>Bienvenue {user.firstname} {user.lastname} !</h1>
                <p>Vous êtes maintenant connecté à votre compte.</p>
                <button onClick={handleLogout} className="logout-button">
                    Se déconnecter
                </button>
            </div>
        </div>
    );
};

export default Home;
