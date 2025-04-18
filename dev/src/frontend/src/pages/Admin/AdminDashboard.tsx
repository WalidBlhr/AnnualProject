import React from 'react';
import { 
    Container, 
    Card, 
    CardContent, 
    Typography, 
    CardActionArea,
    Box
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { Link } from 'react-router-dom';
import PeopleIcon from '@mui/icons-material/People';
import EventIcon from '@mui/icons-material/Event';
import MessageIcon from '@mui/icons-material/Message';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import HandymanIcon from '@mui/icons-material/Handyman';
import ArticleIcon from '@mui/icons-material/Article';

const AdminDashboard: React.FC = () => {
    const adminModules = [
        { title: 'Utilisateurs', icon: <PeopleIcon sx={{ fontSize: 40 }}/>, path: '/admin/users', description: 'Gérer les utilisateurs' },
        { title: 'Événements', icon: <EventIcon sx={{ fontSize: 40 }}/>, path: '/admin/events', description: 'Gérer les événements' },
        { title: 'Messages', icon: <MessageIcon sx={{ fontSize: 40 }}/>, path: '/admin/messages', description: 'Gérer la messagerie' },
        { title: 'Trocs', icon: <SwapHorizIcon sx={{ fontSize: 40 }}/>, path: '/admin/trocs', description: 'Gérer les offres de troc' },
        { title: 'Services', icon: <HandymanIcon sx={{ fontSize: 40 }}/>, path: '/admin/services', description: 'Gérer les services' },
        { title: 'Articles', icon: <ArticleIcon sx={{ fontSize: 40 }}/>, path: '/admin/articles', description: 'Gérer le journal' },
    ];

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom component="h1">
                Administration
            </Typography>
            <Grid container spacing={3}>
                {adminModules.map((module) => (
                    <Grid key={module.title}>
                        <Card 
                            sx={{ 
                                height: '100%',
                                backgroundColor: 'background.paper',
                                '&:hover': {
                                    backgroundColor: 'action.hover'
                                }
                            }}
                        >
                            <CardActionArea 
                                component={Link} 
                                to={module.path}
                                sx={{ height: '100%' }}
                            >
                                <CardContent>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: 2
                                        }}
                                    >
                                        {module.icon}
                                        <Typography variant="h6" component="h2">
                                            {module.title}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {module.description}
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Container>
    );
};

export default AdminDashboard;