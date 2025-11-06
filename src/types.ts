
export interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
}

export interface Recipe {
  title: string;
  description: string;
  prepTime: number; // in minutes
  difficulty: string;
  costLevel: string; // E.g., '€', '€€', '€€€'
  ingredients: Ingredient[];
  instructions: string[];
  imageUrl: string;
}

export interface ShoppingListItem {
  name:string;
  quantity: string;
  unit: string;
}