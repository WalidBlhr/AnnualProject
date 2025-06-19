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
    const { page = 1, limit = 10, category, status, isPublic } = req.query;
    
    const query: any = {};
    
    if (category) {
      query.category = category;
    }
    
    if (status) {
      query.status = status;
    }
    
    // If no token or isPublic is explicitly true, show only public articles
    // If authenticated user, show both public and private articles
    const token = req.headers.authorization?.split(' ')[1];
    if (!token && isPublic !== 'false') {
      query.isPublic = true;
    } else if (isPublic) {
      query.isPublic = isPublic === 'true';
    }
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    
    const articles = await Article.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);
      
    const total = await Article.countDocuments(query);
    
    res.status(200).send({
      data: articles,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
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
    
    // Check if article is private and user is not authenticated
    const token = req.headers.authorization?.split(' ')[1];
    if (!article.isPublic && !token) {
      return res.status(403).send({ message: "Access denied" });
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
    const { id } = req.params;
    const validation = UpdateArticleValidation.validate(req.body);
    
    if (validation.error) {
      return res.status(400).send({ message: validation.error.details[0].message });
    }
    
    const { title, content, category, status, isPublic, imageUrl } = validation.value;
    
    const article = await Article.findById(id);
    
    if (!article) {
      return res.status(404).send({ message: "Article not found" });
    }
    
    // Check if user is author or admin
    const userId = (req as any).decoded.userId;
    const isAdmin = (req as any).decoded.isAdmin;
    
    if (article.author !== userId && !isAdmin) {
      return res.status(403).send({ message: "You don't have permission to update this article" });
    }
    
    if (title) article.title = title;
    if (content) article.content = content;
    if (category) article.category = category;
    if (status) article.status = status;
    if (isPublic !== undefined) article.isPublic = isPublic;
    if (imageUrl !== undefined) article.imageUrl = imageUrl;
    
    article.updatedAt = new Date();
    
    await article.save();
    res.status(200).send(article);
  } catch (error) {
    console.error(error);
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
    
    // Check if user is author or admin
    const userId = (req as any).decoded.userId;
    const isAdmin = (req as any).decoded.isAdmin;
    
    if (article.author !== userId && !isAdmin) {
      return res.status(403).send({ message: "You don't have permission to delete this article" });
    }
    
    await Article.findByIdAndDelete(id);
    res.status(200).send({ message: "Article deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Internal server error" });
  }
};