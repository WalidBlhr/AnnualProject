import {
    Article,Category, Event,
    Forum, Handyman, Message,
    People, SwapHoriz,
} from '@mui/icons-material';
import {
    Box,
    Card,
    CardActionArea,
    CardContent,
    Container,
    Typography
} from '@mui/material';
import Grid from '@mui/material/Grid';
import React from 'react';
import { Link } from 'react-router-dom';

const adminModules = [
    { title: 'Utilisateurs', icon: <People sx={{ fontSize: 40 }}/>, path: '/admin/users', description: 'Gérer les utilisateurs' },
    { title: 'Événements', icon: <Event sx={{ fontSize: 40 }}/>, path: '/admin/events', description: 'Gérer les événements' },
    { title: 'Messages', icon: <Message sx={{ fontSize: 40 }}/>, path: '/admin/messages', description: 'Gérer la messagerie' },
    { title: 'Trocs', icon: <SwapHoriz sx={{ fontSize: 40 }}/>, path: '/admin/trocs', description: 'Gérer les offres de troc' },
    { title: 'Services', icon: <Handyman sx={{ fontSize: 40 }}/>, path: '/admin/services', description: 'Gérer les services' },
    { title: 'Articles', icon: <Article sx={{ fontSize: 40 }}/>, path: '/admin/articles', description: 'Gérer le journal' },
    { title: 'Catégories', icon: <Category sx={{ fontSize: 40 }}/>, path: '/admin/categories', description: 'Gérer les catégories d\'articles' },
    { title: 'Messageries', icon: <Forum sx={{ fontSize: 40 }}/>, path: '/admin/message-groups', description: 'Gérer les groupes' },
];

const AdminDashboard: React.FC = () => {
    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h3" gutterBottom component="h3" marginBottom={5}>
                Administration
            </Typography>
            <Grid container spacing={3}>
                {adminModules.map((module) => (
                    <Grid key={module.title} margin={2} minWidth={201}>
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