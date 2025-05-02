import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminRoute from './components/AdminRoute';
import { ThemeProvider } from '@mui/material/styles';
import theme from './components/ui/theme';
import './services/axios';
import AdminUsers from './pages/Admin/AdminUsers';
import AdminEvents from './pages/Admin/AdminEvents';

const App: React.FC = () => {
    return (
        <ThemeProvider theme={theme}>
            <Router>
                <Header />
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route 
                        path="/admin" 
                        element={
                            <AdminRoute>
                                <AdminDashboard />
                            </AdminRoute>
                        } 
                    />
                    <Route path="/admin/users" element={
                        <AdminRoute>
                            <AdminUsers />
                        </AdminRoute>
                    } />
                    <Route 
                        path="/admin/events" 
                        element={
                            <AdminRoute>
                                <AdminEvents />
                            </AdminRoute>
                        } 
                    />
                </Routes>
                <Footer />
            </Router>
        </ThemeProvider>
    );
};

export default App;