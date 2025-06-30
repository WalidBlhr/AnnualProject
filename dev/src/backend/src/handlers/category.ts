import { Request, Response } from "express";
import Joi from "joi";
import { Category } from "../db/models/category";

// Validation schemas
const CreateCategoryValidation = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow('', null)
});

// Validation pour la modification
const UpdateCategoryValidation = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow('', null)
});

// Create category handler
export const createCategoryHandler = async (req: Request, res: Response) => {
  try {
    const validation = CreateCategoryValidation.validate(req.body);
    
    if (validation.error) {
      return res.status(400).send({ message: validation.error.details[0].message });
    }
    
    const { name, description } = validation.value;
    
    // Check if category already exists
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).send({ message: "Category already exists" });
    }
    
    const category = new Category({
      name,
      description
    });
    
    await category.save();
    res.status(201).send(category);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Internal server error" });
  }
};

// Get all categories
export const listCategoriesHandler = async (_req: Request, res: Response) => {
  try {
    const {page = 1, limit = 10} = _req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const categories = await Category.find()
      .sort({ name: 1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const total = await Category.countDocuments();

    res.status(200).send({
      data: categories,
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

// Delete category
export const deleteCategoryHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).send({ message: "Category not found" });
    }
    
    await Category.findByIdAndDelete(id);
    res.status(200).send({ message: "Category deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Internal server error" });
  }
};

// Update category handler
export const updateCategoryHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validation = UpdateCategoryValidation.validate(req.body);
    if (validation.error) {
      return res.status(400).send({ message: validation.error.details[0].message });
    }
    const { name, description } = validation.value;
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).send({ message: "Category not found" });
    }
    category.name = name;
    category.description = description;
    await category.save();
    res.status(200).send(category);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Internal server error" });
  }
};