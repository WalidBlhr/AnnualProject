export interface Article {
  _id: string;
  title: string;
  summary: string;
  content: string;
  imageUrl?: string;
  author: {
    id: number;
    firstname: string;
    lastname: string;
  };
  authorName: string;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'published' | 'archived';
  visibility: 'public' | 'restricted';
  isPublic: boolean;
  featured: boolean;
  comments: any[];
}

export interface ArticleCategory{
  _id: string;
  name: string;
  decription: string;
  createdAt: string;
  __v: number;
}
