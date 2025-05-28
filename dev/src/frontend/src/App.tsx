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
import TrocOffersList from './pages/TrocOffers/TrocOffersList';
import TrocOfferDetail from './pages/TrocOffers/TrocOfferDetail';
import Conversation from './pages/Messages/Conversation';
import Messages from './pages/Messages/Messages';
import AdminUsers from './pages/Admin/AdminUsers';
import AdminEvents from './pages/Admin/AdminEvents';
import AdminMessages from './pages/Admin/AdminMessages';
import { AuthProvider } from './contexts/AuthContext';
import ServicesList from './pages/Services/ServicesList';
import ServiceDetail from './pages/Services/ServiceDetail';
import Events from './pages/Events/Events';
import EventDetail from './pages/Events/EventDetail';
import MyEvents from './pages/Events/MyEvents';
import Absences from './pages/Absences/Absences';
import ProtectedRoute from './components/ProtectedRoute';

const App: React.FC = () => {
    return (
        <ThemeProvider theme={theme}>
            <Router>
                <AuthProvider>
                    <Header />
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/trocs" element={<TrocOffersList />} />
                        <Route path="/trocs/:id" element={<TrocOfferDetail />} />
                        <Route path="/messages/:userId" element={<Conversation />} />
                        <Route path="/messages" element={<Messages />} />
                        <Route path="/services" element={<ServicesList />} />
                        <Route path="/services/:id" element={<ServiceDetail />} />
                        <Route path="/events" element={<Events />} />
                        <Route path="/events/:id" element={<EventDetail />} />
                        <Route path="/my-events" element={<MyEvents />} />
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
                        <Route 
                            path="/admin/messages" 
                            element={
                                <AdminRoute>
                                    <AdminMessages />
                                </AdminRoute>
                            } 
                        />
                        <Route path="/absences" element={
                            <ProtectedRoute>
                                <Absences />
                            </ProtectedRoute>
                        } />
                    </Routes>
                    <Footer />
                </AuthProvider>
            </Router>
        </ThemeProvider>
    );
};

export default App;