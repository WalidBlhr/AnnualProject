import React, { useState, useEffect } from 'react';
import {
  Container, Typography, TextField, Button, Box, FormControl,
  InputLabel, Select, MenuItem, FormControlLabel, Switch, Alert,
  Paper, CircularProgress, SelectChangeEvent
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Category interface
interface Category {
  _id: string;
  name: string;
  description?: string;
}

// Article interface
interface Article {
  _id?: string;
  title: string;
  content: string;
  category: string;
  isPublic: boolean;
  imageUrl?: string;
}

const ArticleEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  
  const [article, setArticle] = useState<Article>({
    title: '',
    content: '',
    category: '',
    isPublic: true,
    imageUrl: ''
  });
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [alert, setAlert] = useState<{
    open: boolean,
    message: string,
    severity: 'success' | 'error'
  }>({ open: false, message: '', severity: 'success' });
  
  const navigate = useNavigate();
  
  useEffect(() => {
    // Charger les catégories au chargement du composant
    const fetchCategories = async () => {
      try {
        const { data } = await axios.get<Category[]>('http://localhost:3000/journal/categories');
        setCategories(data);
      } catch (error) {
        console.error('Erreur lors du chargement des catégories:', error);
      }
    };
    
    fetchCategories();
    
    if (isEditMode) {
      fetchArticle();
    }
  }, [id]);
  
  const fetchArticle = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      interface ArticleResponse {
        title: string;
        content: string;
        category: string;
        isPublic: boolean;
        imageUrl?: string;
      }
      
      const response = await axios.get<ArticleResponse>(
        `http://localhost:3000/journal/articles/${id}`,
        { headers }
      );
      
      setArticle({
        title: response.data.title,
        content: response.data.content,
        category: response.data.category,
        isPublic: response.data.isPublic,
        imageUrl: response.data.imageUrl || ''
      });
    } catch (error) {
      console.error('Error fetching article:', error);
      setAlert({
        open: true,
        message: 'Erreur lors du chargement de l\'article',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }> | SelectChangeEvent) => {
    const { name, value } = e.target;
    setArticle(prev => ({ ...prev, [name as string]: value }));
  };
  
  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = e.target;
    setArticle(prev => ({ ...prev, isPublic: checked }));
  };
  
  const handleEditorChange = (content: string) => {
    setArticle(prev => ({ ...prev, content }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      if (isEditMode) {
        await axios.put(
          `http://localhost:3000/journal/articles/${id}`,
          article,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        
        setAlert({
          open: true,
          message: 'Article mis à jour avec succès',
          severity: 'success'
        });
      } else {
        await axios.post(
          'http://localhost:3000/journal/articles',
          article,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        
        setAlert({
          open: true,
          message: 'Article créé avec succès',
          severity: 'success'
        });
        
        // Reset form after successful creation
        setArticle({
          title: '',
          content: '',
          category: '',
          isPublic: true,
          imageUrl: ''
        });
      }
  
      // Navigate to journal home after a short delay
      setTimeout(() => {
        navigate('/journal');
      }, 1500);
    } catch (error: any) {
      const showAlert = (message: string, severity: 'success' | 'error') => {
        setAlert({ open: true, message, severity });
      };
      const errorMessage = error.response?.data?.error || 'Erreur lors de la mise à jour de l\'article';
      showAlert(errorMessage, 'error');
      // setAlert({
      //   open: true,
      //   message: 'Erreur lors de l\'enregistrement de l\'article',
      //   severity: 'error'
      // });
    } finally {
      setLoading(false);
    }
  };
  
  // Quill editor modules/formats
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
      ['link', 'image'],
      ['clean']
    ],
  };
  
  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image'
  ];
  
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {isEditMode ? 'Modifier l\'article' : 'Rédiger un nouvel article'}
        </Typography>
        
        {alert.open && (
          <Alert 
            severity={alert.severity} 
            sx={{ my: 2 }}
            onClose={() => setAlert({ ...alert, open: false })}
          >
            {alert.message}
          </Alert>
        )}
        
        {loading && !isEditMode ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="title"
              label="Titre"
              name="title"
              value={article.title}
              onChange={handleChange}
              autoFocus
            />
            
            <FormControl fullWidth margin="normal">
              <InputLabel id="category-label">Catégorie</InputLabel>
              <Select
                labelId="category-label"
                id="category"
                value={article.category || ''}
                onChange={(e) => setArticle({ ...article, category: e.target.value })}
                label="Catégorie"
              >
                <MenuItem value="">
                  <em>Aucune catégorie</em>
                </MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category._id} value={category.name}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              margin="normal"
              fullWidth
              id="imageUrl"
              label="URL de l'image (optionnel)"
              name="imageUrl"
              value={article.imageUrl}
              onChange={handleChange}
            />
            
            <Box sx={{ mt: 2, mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Contenu de l'article
              </Typography>
              <ReactQuill
                theme="snow"
                value={article.content}
                onChange={handleEditorChange}
                modules={modules}
                formats={formats}
                style={{ height: '300px', marginBottom: '50px' }}
              />
            </Box>
            
            <FormControlLabel
              control={
                <Switch
                  checked={article.isPublic}
                  onChange={handleSwitchChange}
                  name="isPublic"
                  color="primary"
                />
              }
              label="Article public"
            />
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                type="button"
                variant="outlined"
                onClick={() => navigate('/journal')}
              >
                Annuler
              </Button>
              
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress size={24} />
                ) : isEditMode ? (
                  'Mettre à jour'
                ) : (
                  'Publier'
                )}
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default ArticleEditor;

function showAlert(errorMessage: any, arg1: string) {
  throw new Error('Function not implemented.');
}
