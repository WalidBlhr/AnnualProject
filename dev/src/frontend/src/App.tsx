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
import { NotificationProvider } from './contexts/NotificationContext';
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
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import CommunityEvents from './pages/Events/CommunityEvents';
import CreateEvent from './pages/Events/CreateEvent';
import EditEvent from './pages/Events/EditEvent';
import EventDetail from './pages/Events/EventDetail';
import Events from './pages/Events/Events';
import MyEvents from './pages/Events/MyEvents';
import Home from './pages/Home';
import ArticleDetail from './pages/Journal/ArticleDetail';
import ArticleEditor from './pages/Journal/ArticleEditor';
import AllArticles from './pages/Journal/AllArticles';
import MyArticles from './pages/Journal/MyArticles';
import Categories from './pages/Journal/Categories';
import JournalHome from './pages/Journal/JournalHome';
import Login from './pages/Login';
import Conversation from './pages/Messages/Conversation';
import Messages from './pages/Messages/Messages';
import NewMessage from './pages/Messages/NewMessage';
import MiniGames from './pages/MiniGames/MiniGames';
import Profile from './pages/Profile/Profile';
import ServiceDetail from './pages/Services/ServiceDetail';
import ServicesList from './pages/Services/ServicesList';
import MyServices from './pages/Services/MyServices';
import { MyBookings, ReceivedBookings } from './pages/Bookings';
import Signup from './pages/Signup';
import TrocOfferDetail from './pages/TrocOffers/TrocOfferDetail';
import TrocOffersList from './pages/TrocOffers/TrocOffersList';
import MyTrocOffers from './pages/TrocOffers/MyTrocOffers';
import SuggestionsPage from './components/Suggestions/SuggestionsPage';
import './services/axios';
import NewGroup from './pages/Messages/NewGroup';
import AdminMessageGroups from './pages/Admin/AdminMessageGroups';

const App: React.FC = () => {
    return (
        <ThemeProvider theme={theme}>
            <Router>
                <AuthProvider>
                    <NotificationProvider>
                        <SocketProvider>
                        <Box sx={{display: 'flex', flexDirection: 'column', minHeight: '100vh'}}>
                            <Header />
                            <Box sx={{flex: 1}}>
                                <Routes>
                                    <Route path="/" element={<Home />} />
                                    <Route path="/login" element={<Login />} />
                                    <Route path="/signup" element={<Signup />} />
                                    <Route path="/forgot-password" element={<ForgotPassword />} />
                                    <Route path="/reset-password" element={<ResetPassword />} />
                                    <Route path="/trocs" element={<TrocOffersList />} />
                                    <Route path="/my-trocs" element={<ProtectedRoute><MyTrocOffers /></ProtectedRoute>} />
                                    <Route path="/trocs/:id" element={<TrocOfferDetail />} />
                                    <Route path="trocs/:trocId/messages/:userId" element={<Conversation />} />
                                    <Route path="/messages/:userId" element={<Conversation />} />
                                    <Route path="/messages" element={<Messages />} />
                                    <Route path="/message-groups/:groupId/messages" element={<Conversation />} />
                                    <Route path="/services" element={<ServicesList />} />
                                    <Route path="/my-services" element={<ProtectedRoute><MyServices /></ProtectedRoute>} />
                                    <Route path="/services/:id" element={<ServiceDetail />} />
                                    <Route path="/my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
                                    <Route path="/received-bookings" element={<ProtectedRoute><ReceivedBookings /></ProtectedRoute>} />
                                    <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
                                    <Route path="/events/:id" element={<ProtectedRoute><EventDetail /></ProtectedRoute>} />
                                    <Route path="/my-events" element={<ProtectedRoute><MyEvents /></ProtectedRoute>} />
                                    <Route path="/new-message" element={<NewMessage />} />
                                    <Route path="/new-group" element={<NewGroup />} />
                                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                                    <Route path="/suggestions" element={<ProtectedRoute><SuggestionsPage /></ProtectedRoute>} />
                                    <Route path="/mini-games" element={<MiniGames />} />
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
                                    <Route path="/admin/message-groups" element={
                                        <ProtectedRoute>
                                            <AdminMessageGroups />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="/absences" element={
                                        <ProtectedRoute>
                                            <Absences />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="/community-events" element={<ProtectedRoute><CommunityEvents /></ProtectedRoute>} />
                                    <Route path="/create-event" element={<ProtectedRoute><CreateEvent /></ProtectedRoute>} />
                                    <Route path="/events/:id/edit" element={<ProtectedRoute><EditEvent /></ProtectedRoute>} />
                                    <Route path="/journal" element={<ProtectedRoute><JournalHome /></ProtectedRoute>} />
                                    <Route path="/journal/all" element={<ProtectedRoute><AllArticles /></ProtectedRoute>} />
                                    <Route path="/journal/my-articles" element={<ProtectedRoute><MyArticles /></ProtectedRoute>} />
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
                    </NotificationProvider>
                </AuthProvider>
            </Router>
        </ThemeProvider>
    );
};

export default App;