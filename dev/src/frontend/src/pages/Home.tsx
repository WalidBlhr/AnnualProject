import React, { useEffect, useState } from 'react';
import { 
    Container, 
    Typography, 
    Button, 
    Box, 
    Grid, 
    Card, 
    CardContent,
    CardMedia,
    Paper,
    Stack,
    Divider
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getUser } from '../services/auth';
import neighborhoodImage from '../assets/neighborhood.png';
import trocImage from '../assets/troc.png';
import eventsImage from '../assets/events.png';
import helpImage from '../assets/help.png';
import axios from 'axios';

interface UserDetails {
    firstname: string;
    lastname: string;
    email: string;
    role: number;
    createdAt: string;
}

// Définition des cartes de services
const serviceCards = [
    {
        title: "Troc entre voisins",
        description: "Échangez des objets et services dans votre quartier",
        image: trocImage,
        path: "/trocs",
        color: "#2A9D8F"
    },
    {
        title: "Événements locaux",
        description: "Participez aux activités et rencontres du quartier",
        image: eventsImage,
        path: "/events",
        color: "#E9C46A"
    },
    {
        title: "Entraide",
        description: "Donnez un coup de main ou demandez de l'aide",
        image: helpImage,
        path: "/services",
        color: "#E76F51"
    }
];

const Home: React.FC = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<UserDetails | null>(null);
    const decodedToken = getUser();
    console.log("User data:", user); // Ajoutez ce log pour débugger

    useEffect(() => {
        const fetchUserDetails = async () => {
            if (decodedToken?.userId) {
                try {
                    const response = await axios.get<UserDetails>(`http://localhost:3000/users/${decodedToken.userId}`, {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`
                        }
                    });
                    setUser(response.data);
                } catch (error) {
                    console.error('Error fetching user details:', error);
                }
            }
        };

        fetchUserDetails();
    }, [decodedToken?.userId]);
    
    return (
        <Box sx={{ 
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            margin: 0,
            padding: 0
        }}>
            {/* Hero Section */}
            <Paper 
                elevation={0}
                sx={{
                    position: 'relative',
                    backgroundColor: 'primary.main',
                    color: 'white',
                    mb: 4,
                    backgroundSize: 'cover',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center',
                    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${neighborhoodImage})`,
                    py: 8
                }}
            >
                <Container maxWidth="lg">
                    <Grid container spacing={4} alignItems="center">
                        <Grid item xs={12} md={6}>
                            {user ? (
                                <Box sx={{ mb: 4 }}>
                                    <Typography
                                        component="h1"
                                        variant="h2"
                                        color="inherit"
                                        gutterBottom
                                        sx={{
                                            fontFamily: "'Courgette', cursive",
                                            fontSize: { xs: '2.5rem', md: '3.5rem' }
                                        }}
                                    >
                                        Bienvenue {user?.firstname} {user?.lastname} !
                                    </Typography>
                                    <Box sx={{ 
                                        bgcolor: 'rgba(255, 255, 255, 0.9)', 
                                        p: 3, 
                                        borderRadius: 2,
                                        color: 'text.primary'
                                    }}>
                                        <Typography variant="h6" gutterBottom>
                                            Vos informations personnelles :
                                        </Typography>
                                        <Typography variant="body1">
                                            Email : {user.email}
                                        </Typography>
                                        <Typography variant="body1">
                                            Statut : {user.role === 1 ? 'Administrateur' : 'Membre'}
                                        </Typography>
                                        <Typography variant="body1">
                                            Membre depuis : {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Date inconnue'}
                                        </Typography>
                                    </Box>
                                </Box>
                            ) : null}
                            <Typography
                                variant="h5"
                                color="inherit"
                                paragraph
                                sx={{ fontFamily: "'Nunito', sans-serif" }}
                            >
                                Découvrez une nouvelle façon de vivre votre quartier, 
                                ensemble créons une communauté solidaire et bienveillante.
                            </Typography>
                            {!localStorage.getItem('token') && (
                                <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
                                    <Button
                                        variant="contained"
                                        size="large"
                                        color="secondary"
                                        onClick={() => navigate('/signup')}
                                        sx={{ 
                                            borderRadius: '50px',
                                            px: 4,
                                            py: 1.5,
                                            fontSize: '1.1rem'
                                        }}
                                    >
                                        Rejoindre la communauté
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        size="large"
                                        color="inherit"
                                        onClick={() => navigate('/login')}
                                        sx={{ 
                                            borderRadius: '50px',
                                            px: 4,
                                            py: 1.5,
                                            fontSize: '1.1rem'
                                        }}
                                    >
                                        Se connecter
                                    </Button>
                                </Stack>
                            )}
                        </Grid>
                    </Grid>
                </Container>
            </Paper>

            {/* Services Section */}
            <Container maxWidth="lg" sx={{ mb: 8 }}>
                {user ? (
                    // Section pour utilisateurs connectés
                    <>
                        <Typography
                            variant="h4"
                            component="h2"
                            gutterBottom
                            sx={{ 
                                color: 'primary.main',
                                textAlign: 'center',
                                mb: 4
                            }}
                        >
                            Que souhaitez-vous faire aujourd'hui ?
                        </Typography>
                        <Grid container spacing={4}>
                            {serviceCards.map((card) => (
                                <Grid item key={card.title} xs={12} sm={6} md={4}>
                                    <Card
                                        sx={{
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            transition: 'transform 0.2s ease-in-out',
                                            '&:hover': {
                                                transform: 'translateY(-8px)',
                                                boxShadow: 6
                                            },
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => navigate(card.path)}
                                    >
                                        <CardMedia
                                            component="img"
                                            height="200"
                                            image={card.image}
                                            alt={card.title}
                                        />
                                        <CardContent sx={{ flexGrow: 1, bgcolor: card.color, color: 'white' }}>
                                            <Typography gutterBottom variant="h5" component="h3">
                                                {card.title}
                                            </Typography>
                                            <Typography>
                                                {card.description}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </>
                ) : (
                    // Section pour visiteurs non connectés
                    <>
                        <Box textAlign="center" mb={6}>
                            <Typography
                                variant="h4"
                                component="h2"
                                gutterBottom
                                sx={{ color: 'primary.main' }}
                            >
                                Découvrez ce que Quartissimo peut vous apporter
                            </Typography>
                        </Box>
                        <Grid container spacing={4}>
                            {serviceCards.map((card, index) => (
                                <Grid item key={card.title} xs={12}>
                                    <Paper 
                                        elevation={3}
                                        sx={{ 
                                            p: 3,
                                            display: 'flex',
                                            flexDirection: index % 2 === 0 ? 'row' : 'row-reverse',
                                            gap: 4,
                                            alignItems: 'center'
                                        }}
                                    >
                                        <Box 
                                            component="img"
                                            src={card.image}
                                            sx={{
                                                width: 200,
                                                height: 200,
                                                objectFit: 'cover',
                                                borderRadius: 2
                                            }}
                                        />
                                        <Box>
                                            <Typography
                                                variant="h5"
                                                gutterBottom
                                                sx={{ color: card.color }}
                                            >
                                                {card.title}
                                            </Typography>
                                            <Typography variant="body1">
                                                {card.description}
                                            </Typography>
                                        </Box>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    </>
                )}
            </Container>
        </Box>
    );
};

export default Home;