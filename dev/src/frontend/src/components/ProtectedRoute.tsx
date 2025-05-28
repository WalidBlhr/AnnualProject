import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    // Vérifier si un token existe dans le localStorage
    const token = localStorage.getItem('token');
    
    // Rediriger vers la page de login si l'utilisateur n'est pas connecté
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // Si l'utilisateur est connecté, afficher le contenu protégé
    return <>{children}</>;
};

export default ProtectedRoute;