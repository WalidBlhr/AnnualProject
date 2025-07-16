import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    Chip,
    Button,
    CircularProgress,
    Alert,
    Tabs,
    Tab,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Checkbox,
    FormControlLabel,
    TextField
} from '@mui/material';
import {
    TrendingUp,
    Category,
    AccessTime
} from '@mui/icons-material';
import axios from 'axios';
import { API_URL } from '../../const';

interface SuggestionItem {
    id: number;
    entityType: 'service' | 'troc' | 'event' | 'absence';
    title: string;
    description: string;
    category: string;
    userId: number;
    userName: string;
    score: number;
    reason: string;
    createdAt: string; // Le backend renvoie une chaîne de caractères (ISO string)
}

interface SuggestionFilters {
    categories?: string[];
    entityTypes?: string[];
    excludeOwn?: boolean;
    minScore?: number;
}

interface UserStats {
    totalInteractions: number;
    byType: Record<string, number>;
    byCategory: Record<string, number>;
    recentActivity: number;
    topCategories: Array<{ category: string; count: number }>;
    affinities: Array<{ userId: number; score: number; userName?: string }>;
}

const SuggestionsPage: React.FC = () => {
    const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedTab, setSelectedTab] = useState(0);
    const [userStats, setUserStats] = useState<UserStats | null>(null);
    
    // Filtres
    const [filters, setFilters] = useState<SuggestionFilters>({
        excludeOwn: false, // Désactivé pour débugger
        minScore: 0 // Temporairement mis à 0 pour débugger
    });

    // Configuration des headers d'authentification pour axios
    const getAuthConfig = () => ({
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
        }
    });

    // Chargement des suggestions via l'API
    const loadSuggestions = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Construire les paramètres de requête selon les filtres
            const params = new URLSearchParams();
            params.append('limit', '20');
            
            if (filters.categories && filters.categories.length > 0) {
                params.append('categories', filters.categories.join(','));
            }
            if (filters.entityTypes && filters.entityTypes.length > 0) {
                params.append('types', filters.entityTypes.join(','));
            }
            if (filters.excludeOwn !== undefined) {
                params.append('excludeOwn', filters.excludeOwn.toString());
            }
            if (filters.minScore !== undefined) {
                params.append('minScore', filters.minScore.toString());
            }

            const url = `${API_URL}/suggestions?${params.toString()}`;
            console.log('🔍 Appel API suggestions:', url);
            console.log('🔍 Filtres appliqués:', filters);

            const { data } = await axios.get(url, getAuthConfig());
            
            console.log('📥 Réponse API suggestions:', data);
            
            if (data.success && data.suggestions) {
                console.log('✅ Suggestions reçues:', data.suggestions.length);
                setSuggestions(data.suggestions);
            } else {
                console.log('❌ Format de réponse inattendu:', data);
                setError('Format de réponse inattendu du serveur');
            }
            
        } catch (err: any) {
            console.error('❌ Erreur lors du chargement des suggestions:', err);
            console.error('❌ Détails de l\'erreur:', err.response?.data);
            setError(
                err.response?.data?.message || 
                'Erreur lors du chargement des suggestions'
            );
        } finally {
            setLoading(false);
        }
    };

    // Chargement des statistiques utilisateur via l'API
    const loadUserStats = async () => {
        try {
            console.log('📊 Chargement des statistiques utilisateur...');
            const { data } = await axios.get(`${API_URL}/stats`, getAuthConfig());
            
            console.log('📊 Réponse API stats:', data);
            
            if (data.success && data.stats) {
                console.log('✅ Statistiques reçues:', data.stats);
                setUserStats(data.stats);
            }
            
        } catch (err: any) {
            console.error('❌ Erreur lors du chargement des statistiques:', err);
            console.error('❌ Détails de l\'erreur stats:', err.response?.data);
            // En cas d'erreur, on peut garder des statistiques par défaut ou vides
            setUserStats({
                totalInteractions: 0,
                byType: {},
                byCategory: {},
                recentActivity: 0,
                topCategories: [],
                affinities: []
            });
        }
    };

    // Couleur selon le type de suggestion
    const getTypeColor = (type: string): 'primary' | 'secondary' | 'success' | 'warning' => {
        switch (type) {
            case 'service': return 'primary';
            case 'troc': return 'secondary';
            case 'event': return 'success';
            case 'absence': return 'warning';
            default: return 'primary';
        }
    };

    // Effet de chargement initial
    useEffect(() => {
        loadSuggestions();
        loadUserStats();
    }, [filters]);

    // Génération de suggestions en temps réel via l'API
    const generateRealTimeSuggestions = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Utiliser une catégorie et un type d'entité basés sur les suggestions existantes
            // ou des valeurs par défaut intelligentes
            const recentCategory = suggestions.length > 0 ? suggestions[0].category : 'general';
            const recentEntityType = suggestions.length > 0 ? suggestions[0].entityType : 'service';
            
            const { data } = await axios.post(`${API_URL}/suggestions/realtime`, {
                type: recentEntityType,
                category: recentCategory,
                entityId: 1 // ID fictif pour déclencher la génération
            }, getAuthConfig());

            if (data.success && data.suggestions) {
                // Ajouter les nouvelles suggestions au début de la liste
                setSuggestions(prev => [...data.suggestions, ...prev]);
            }
            
        } catch (err: any) {
            console.error('Erreur lors de la génération de suggestions temps réel:', err);
            setError('Erreur lors de la génération de suggestions en temps réel');
        } finally {
            setLoading(false);
        }
    };

    // Statistiques sous forme de cards avec plus de détails
    const renderStatsCards = () => {
        if (!userStats) return null;

        return (
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={4}>
                    <Card variant="outlined">
                        <CardContent sx={{ textAlign: 'center' }}>
                            <TrendingUp color="primary" sx={{ fontSize: 40, mb: 1 }} />
                            <Typography variant="h6">{userStats.totalInteractions}</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Interactions totales
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <Card variant="outlined">
                        <CardContent sx={{ textAlign: 'center' }}>
                            <AccessTime color="secondary" sx={{ fontSize: 40, mb: 1 }} />
                            <Typography variant="h6">{userStats.recentActivity}</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Activités récentes
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <Card variant="outlined">
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Category color="success" sx={{ fontSize: 40, mb: 1 }} />
                            <Typography variant="h6">
                                {userStats.topCategories?.length || Object.keys(userStats.byCategory || {}).length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Catégories explorées
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                
                {/* Affichage des catégories préférées */}
                {userStats.topCategories && userStats.topCategories.length > 0 && (
                    <Grid item xs={12}>
                        <Card variant="outlined">
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Catégories préférées
                                </Typography>
                                <Box display="flex" gap={1} flexWrap="wrap">
                                    {userStats.topCategories.slice(0, 5).map((cat, index) => (
                                        <Chip 
                                            key={cat.category}
                                            label={`${cat.category} (${cat.count})`}
                                            color={index === 0 ? 'primary' : 'default'}
                                            variant={index === 0 ? 'filled' : 'outlined'}
                                        />
                                    ))}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                )}
                
                {/* Affichage des affinités */}
                {userStats.affinities && userStats.affinities.length > 0 && (
                    <Grid item xs={12}>
                        <Card variant="outlined">
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Utilisateurs avec affinités
                                </Typography>
                                <Box display="flex" gap={1} flexWrap="wrap">
                                    {userStats.affinities.slice(0, 3).map((affinity) => (
                                        <Chip 
                                            key={affinity.userId}
                                            label={`${affinity.userName || `Utilisateur ${affinity.userId}`} (${affinity.score}%)`}
                                            color="secondary"
                                            variant="outlined"
                                        />
                                    ))}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                )}
            </Grid>
        );
    };

    // Filtre interface
    const renderFilters = () => (
        <Card sx={{ mb: 3, p: 2 }}>
            <Typography variant="h6" gutterBottom>Filtres</Typography>
            <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Types</InputLabel>
                        <Select
                            multiple
                            value={filters.entityTypes || []}
                            onChange={(e) => setFilters({
                                ...filters,
                                entityTypes: e.target.value as string[]
                            })}
                        >
                            <MenuItem value="service">Services</MenuItem>
                            <MenuItem value="troc">Trocs</MenuItem>
                            <MenuItem value="event">Événements</MenuItem>
                            <MenuItem value="absence">Absences</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <TextField
                        fullWidth
                        size="small"
                        label="Score minimum"
                        type="number"
                        value={filters.minScore || ''}
                        onChange={(e) => setFilters({
                            ...filters,
                            minScore: parseInt(e.target.value) || undefined
                        })}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={filters.excludeOwn || false}
                                onChange={(e) => setFilters({
                                    ...filters,
                                    excludeOwn: e.target.checked
                                })}
                            />
                        }
                        label="Exclure mes contenus"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Button 
                        variant="outlined" 
                        onClick={loadSuggestions}
                        disabled={loading}
                        sx={{ mr: 1 }}
                    >
                        Actualiser
                    </Button>
                    <Button 
                        variant="contained" 
                        onClick={generateRealTimeSuggestions}
                        disabled={loading}
                        color="secondary"
                    >
                        Suggestions intelligentes
                    </Button>
                </Grid>
            </Grid>
        </Card>
    );

    // Carte de suggestion simplifiée
    const renderSuggestionCard = (suggestion: SuggestionItem) => (
        <Grid item xs={12} md={6} lg={4} key={suggestion.id}>
            <Card 
                sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'translateY(-2px)' }
                }}
            >
                <CardContent sx={{ flexGrow: 1 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                        <Chip 
                            label={suggestion.entityType} 
                            color={getTypeColor(suggestion.entityType)}
                            size="small"
                        />
                        <Box display="flex" alignItems="center">
                            <Typography variant="caption" color="primary" fontWeight="bold">
                                {suggestion.score}%
                            </Typography>
                        </Box>
                    </Box>
                    
                    <Typography variant="h6" gutterBottom>
                        {suggestion.title}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {suggestion.description.length > 100 
                            ? suggestion.description.substring(0, 100) + '...' 
                            : suggestion.description
                        }
                    </Typography>
                    
                    <Chip 
                        label={suggestion.category} 
                        variant="outlined" 
                        size="small" 
                        sx={{ mb: 1 }}
                    />
                    
                    <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 1 }}>
                        Par {suggestion.userName}
                    </Typography>
                    
                    <Typography variant="caption" display="block" color="info.main" sx={{ fontStyle: 'italic' }}>
                        {suggestion.reason}
                    </Typography>
                    
                    <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                        {new Date(suggestion.createdAt).toLocaleDateString()}
                    </Typography>
                </CardContent>
            </Card>
        </Grid>
    );

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Suggestions personnalisées
            </Typography>
            
            {renderStatsCards()}
            {renderFilters()}
            
            <Tabs value={selectedTab} onChange={(_, newValue) => setSelectedTab(newValue)} sx={{ mb: 3 }}>
                <Tab label="Toutes les suggestions" />
            </Tabs>

            {loading && (
                <Box display="flex" justifyContent="center" my={4}>
                    <CircularProgress />
                </Box>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {!loading && suggestions.length === 0 && (
                <Alert severity="info">
                    Aucune suggestion trouvée. Essayez d'interagir plus avec la plateforme pour améliorer les recommandations.
                </Alert>
            )}

            <Grid container spacing={3}>
                {suggestions.map(renderSuggestionCard)}
            </Grid>
        </Box>
    );
};

export default SuggestionsPage;
