import { Box } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import React from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import AdminRoute from './components/AdminRoute';
import Footer from './components/Footer';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import theme from './components/ui/theme';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import Absences from './pages/Absences/Absences';
import AdminArticles from './pages/Admin/AdminArticles';
import AdminCategories from './pages/Admin/AdminCategories';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminEvents from './pages/Admin/AdminEvents';
import AdminMessages from './pages/Admin/AdminMessages';
import AdminServices from './pages/Admin/AdminServices';
import AdminTrocs from './pages/Admin/AdminTrocs';
import AdminUsers from './pages/Admin/AdminUsers';
import CommunityEvents from './pages/Events/CommunityEvents';
import CreateEvent from './pages/Events/CreateEvent';
import EventDetail from './pages/Events/EventDetail';
import Events from './pages/Events/Events';
import MyEvents from './pages/Events/MyEvents';
import Home from './pages/Home';
import ArticleDetail from './pages/Journal/ArticleDetail';
import ArticleEditor from './pages/Journal/ArticleEditor';
import Categories from './pages/Journal/Categories';
import JournalHome from './pages/Journal/JournalHome';
import Login from './pages/Login';
import Conversation from './pages/Messages/Conversation';
import Messages from './pages/Messages/Messages';
import NewMessage from './pages/Messages/NewMessage';
import ServiceDetail from './pages/Services/ServiceDetail';
import ServicesList from './pages/Services/ServicesList';
import Signup from './pages/Signup';
import TrocOfferDetail from './pages/TrocOffers/TrocOfferDetail';
import TrocOffersList from './pages/TrocOffers/TrocOffersList';
import './services/axios';

const App: React.FC = () => {
    return (
        <ThemeProvider theme={theme}>
            <Router>
                <AuthProvider>
                    <SocketProvider>
                        <Box sx={{display: 'flex', flexDirection: 'column', minHeight: '100vh'}}>
                            <Header />
                            <Box sx={{flex: 1}}>
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
                                    <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
                                    <Route path="/events/:id" element={<ProtectedRoute><EventDetail /></ProtectedRoute>} />
                                    <Route path="/my-events" element={<ProtectedRoute><MyEvents /></ProtectedRoute>} />
                                    <Route path="/new-message" element={<NewMessage />} />
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
                                    <Route path="/community-events" element={<ProtectedRoute><CommunityEvents /></ProtectedRoute>} />
                                    <Route path="/create-event" element={<ProtectedRoute><CreateEvent /></ProtectedRoute>} />
                                    <Route path="/journal" element={<ProtectedRoute><JournalHome /></ProtectedRoute>} />
                                    <Route path="/journal/editor/:id?" element={<ProtectedRoute><ArticleEditor /></ProtectedRoute>} />
                                    <Route path="/journal/editor" element={<ProtectedRoute><ArticleEditor /></ProtectedRoute>} />
                                    <Route path="/journal/article/:id" element={<ProtectedRoute><ArticleDetail /></ProtectedRoute>} />
                                    <Route path="/journal/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
                                    <Route 
                                        path="/admin/trocs" 
                                        element={
                                            <AdminRoute>
                                                <AdminTrocs />
                                            </AdminRoute>
                                        } 
                                    />
                                    <Route 
                                        path="/admin/services" 
                                        element={
                                            <AdminRoute>
                                                <AdminServices />
                                            </AdminRoute>
                                        } 
                                    />
                                    <Route 
                                        path="/admin/articles" 
                                        element={
                                            <AdminRoute>
                                                <AdminArticles />
                                            </AdminRoute>
                                        } 
                                    />
                                    <Route 
                                        path="/admin/categories" 
                                        element={
                                            <AdminRoute>
                                                <AdminCategories />
                                            </AdminRoute>
                                        } 
                                    />
                                </Routes>
                            </Box>
                            <Footer />
                        </Box>
                    </SocketProvider>
                </AuthProvider>
            </Router>
        </ThemeProvider>
    );
};

export default App;