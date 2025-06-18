import React from 'react';
import {Navigate} from 'react-router-dom';
import {useAuth} from '../contexts/AuthContext';

interface AdminRouteProps {
    children: React.ReactNode;
};

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
    if (!useAuth().isAdmin()) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

export default AdminRoute;