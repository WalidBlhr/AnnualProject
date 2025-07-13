import {Request, Response} from "express";
import {Article} from "../db/models/article";
import {CreateArticleValidation, UpdateArticleValidation} from "./validators/article";

// Create article handler
export const createArticleHandler = async (req: Request, res: Response) => {
  try {
    const validation = CreateArticleValidation.validate(req.body);
    if (validation.error) {
      return res.status(400).send({ message: validation.error.details[0].message });
    }

    const { title, content, category, isPublic, imageUrl } = validation.value;
    const user = (req as any).user;

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    const article = new Article({
      title,
      content,
      author: user.userId,
      authorName: `${user.firstname} ${user.lastname}`,
      category,
      isPublic: isPublic !== undefined ? isPublic : true,
      imageUrl
    });

    await article.save();
    res.status(201).send(article);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Internal server error" });
  }
};

// Get all articles handler
export const listArticlesHandler = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, category, status, isPublic, exclude, search, author } = req.query;
    
    const query: any = {};
    
    if (category) {
      query.category = category;
    }
    
    if (status) {
      query.status = status;
    }
    
    // Recherche par mot-clé dans le titre et le contenu
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }
      // Exclure un article spécifique (utile pour les articles similaires)
    if (exclude) {
      query._id = { $ne: exclude };
    }

    // Gestion de la visibilité des articles
    const token = req.headers.authorization?.split(' ')[1];
    let currentUserId = null;
    let isAdmin = false;
    
    console.log('Token reçu:', !!token);
    
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, "valuerandom") as { userId: number; role?: number };
        currentUserId = decoded.userId;
        isAdmin = decoded.role === 1;
        console.log('Utilisateur authentifié:', currentUserId, 'isAdmin:', isAdmin);
      } catch (error) {
        console.log('Token invalide');
        // Token invalide, traiter comme non authentifié
      }
    }
    
    // Filtre par auteur (pour "Mes articles")
    if (author === 'me') {
      if (!currentUserId) {
        return res.status(401).send({ message: 'Authentication required' });
      }
      query.author = currentUserId;
      console.log('Filtre mes articles seulement');
    } else {
      // Gestion normale de la visibilité
      if (!currentUserId) {
        // Utilisateur non authentifié : seulement les articles publics
        query.isPublic = true;
        console.log('Filtre non-authentifié - articles publics seulement');
      } else if (isAdmin) {
        // Admin : peut voir tous les articles selon les filtres demandés
        if (isPublic === 'true') {
          query.isPublic = true;
          console.log('Filtre admin - articles publics seulement (paramètre explicite)');
        } else if (isPublic === 'false') {
          query.isPublic = false;
          console.log('Filtre admin - articles privés seulement');
        }
        // Si pas de filtre isPublic, l'admin voit tout
        console.log('Filtre admin - tous les articles');
      } else {
        // Utilisateur authentifié non-admin : articles publics OU articles privés de l'utilisateur
        if (isPublic === 'true') {
          query.isPublic = true;
          console.log('Filtre authentifié - articles publics seulement (paramètre explicite)');
        } else if (isPublic === 'false') {
          query.isPublic = false;
          query.author = currentUserId; // Seulement ses propres articles privés
          console.log('Filtre authentifié - articles privés de l\'utilisateur seulement');
        } else {
          // Par défaut : articles publics OU ses propres articles privés
          query.$or = [
            { isPublic: true },
            { isPublic: false, author: currentUserId }
          ];
          console.log('Filtre authentifié - articles publics OU privés de l\'utilisateur');
        }
      }
    }
    
    console.log('Query finale:', JSON.stringify(query, null, 2));
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    
    const articles = await Article.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);
      
    console.log(`Articles trouvés: ${articles.length}`);
    articles.forEach(article => {
      console.log(`- ${article.title}: isPublic=${article.isPublic}, author=${article.author}`);
    });
      
    const total = await Article.countDocuments(query);
    
    res.status(200).send({
      data: articles,
      page: pageNum,
      page_size: limitNum,
      total_count: total,
      total_pages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Internal server error" });
  }
};

// Get article by ID handler
export const getArticleHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const article = await Article.findById(id);
    
    if (!article) {
      return res.status(404).send({ message: "Article not found" });
    }
    
    // Vérifier l'accès aux articles privés
    if (!article.isPublic) {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(403).send({ message: "Access denied" });
      }
      
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, "valuerandom") as { userId: number };
        
        // L'utilisateur peut voir l'article seulement s'il en est l'auteur
        if (decoded.userId !== article.author) {
          return res.status(403).send({ message: "Access denied" });
        }
      } catch (error) {
        return res.status(403).send({ message: "Access denied" });
      }
    }
    
    res.status(200).send(article);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Internal server error" });
  }
};

// Update article handler
export const updateArticleHandler = async (req: Request, res: Response) => {
  try {
    console.log('Update article handler called with:', { params: req.params, body: req.body });
    
    const { id } = req.params;
    const validation = UpdateArticleValidation.validate(req.body);
    
    if (validation.error) {
      console.log('Validation error:', validation.error.details[0].message);
      return res.status(400).send({ message: validation.error.details[0].message });
    }
    
    const { title, content, category, status, isPublic, imageUrl } = validation.value;
    
    console.log('Finding article with id:', id);
    const article = await Article.findById(id);
    
    if (!article) {
      console.log('Article not found with id:', id);
      return res.status(404).send({ message: "Article not found" });
    }
    
    console.log('Article found:', { id: article._id, author: article.author });
    
    // Extraire l'ID utilisateur du token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      console.log('No token provided');
      return res.status(401).send({ message: "Authentication required" });
    }
    
    let currentUserId: number;
    let isAdmin = false;
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, "valuerandom") as { userId: number; role?: number };
      currentUserId = decoded.userId;
      isAdmin = decoded.role === 1;
      console.log('Decoded user ID:', currentUserId, 'isAdmin:', isAdmin);
    } catch (error) {
      console.log('Token verification error:', error);
      return res.status(401).send({ message: "Invalid token" });
    }
    
    // Vérifier que l'utilisateur est l'auteur de l'article ou admin
    if (article.author !== currentUserId && !isAdmin) {
      console.log('Permission denied:', { articleAuthor: article.author, currentUserId, isAdmin });
      return res.status(403).send({ message: "You don't have permission to update this article" });
    }
    
    console.log('Updating article with data:', { title, content, category, status, isPublic, imageUrl });
    
    if (title) article.title = title;
    if (content) article.content = content;
    if (category) article.category = category;
    if (status) article.status = status;
    if (isPublic !== undefined) article.isPublic = isPublic;
    if (imageUrl !== undefined) article.imageUrl = imageUrl;
    
    article.updatedAt = new Date();
    
    await article.save();
    console.log('Article updated successfully');
    res.status(200).send(article);
  } catch (error) {
    console.error('Update article error:', error);
    res.status(500).send({ message: "Internal server error" });
  }
};

// Delete article handler
export const deleteArticleHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const article = await Article.findById(id);
    
    if (!article) {
      return res.status(404).send({ message: "Article not found" });
    }
    
    // Extraire l'ID utilisateur du token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).send({ message: "Authentication required" });
    }
    
    let currentUserId: number;
    let isAdmin = false;
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, "valuerandom") as { userId: number; role?: number };
      currentUserId = decoded.userId;
      isAdmin = decoded.role === 1;
    } catch (error) {
      return res.status(401).send({ message: "Invalid token" });
    }
    
    // Vérifier que l'utilisateur est l'auteur de l'article ou admin
    if (article.author !== currentUserId && !isAdmin) {
      return res.status(403).send({ message: "You don't have permission to delete this article" });
    }
    
    await Article.findByIdAndDelete(id);
    res.status(200).send({ message: "Article deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Internal server error" });
  }
};