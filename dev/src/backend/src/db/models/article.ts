import mongoose, { Document, Schema } from 'mongoose';

export interface IArticle extends Document {
  title: string;
  content: string;
  author: number;
  authorName: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
  status: string; // draft, published, archived
  isPublic: boolean;
  imageUrl?: string;
}

const ArticleSchema = new Schema<IArticle>({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: Number, required: true }, // User ID from PostgreSQL
  authorName: { type: String, required: true },
  category: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  status: { type: String, default: 'published' },
  isPublic: { type: Boolean, default: true },
  imageUrl: { type: String }
});

export const Article = mongoose.model<IArticle>('Article', ArticleSchema);