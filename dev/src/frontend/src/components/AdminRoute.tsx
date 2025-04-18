import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAdmin } from '../services/auth';

interface AdminRouteProps {
    children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
    if (!isAdmin()) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

export default AdminRoute;