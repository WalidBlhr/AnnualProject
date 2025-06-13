import { Request, Response } from "express";
import { Category, ICategory } from "../db/models/category";
import Joi from "joi";

// Validation schemas
const CreateCategoryValidation = Joi.object({
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
    const categories = await Category.find().sort({ name: 1 });
    res.status(200).send(categories);
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