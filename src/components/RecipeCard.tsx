import React from 'react';
import { Recipe } from '../types';
import { ClockIcon, HeartIcon, ReloadIcon, SwapIcon } from './Icons';
import { Loader } from './Loader';

interface RecipeCardProps {
  recipe: Recipe;
  onSelect: () => void;
  onToggleFavorite: (recipe: Recipe) => void;
  isFavorite: boolean;
  onRegenerateImage: () => void;
  isRegeneratingImage: boolean;
  onRegenerateRecipe: () => void;
  isRegeneratingRecipe: boolean;
  showSwapButton: boolean;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onSelect, onToggleFavorite, isFavorite, onRegenerateImage, isRegeneratingImage, onRegenerateRecipe, isRegeneratingRecipe, showSwapButton }) => {
  const getDifficultyClass = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'facile':
        return 'bg-green-100 text-green-800';
      case 'medio':
        return 'bg-yellow-100 text-yellow-800';
      case 'difficile':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-stone-100 text-stone-800';
    }
  };

  const getCostClass = (cost: string) => {
    switch (cost) {
      case '€':
        return 'bg-amber-100 text-amber-800';
      case '€€':
        return 'bg-amber-200 text-amber-900';
      case '€€€':
        return 'bg-amber-300 text-amber-900';
      default:
        return 'bg-stone-100 text-stone-800';
    }
  };
  
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(recipe);
  };

  const handleRegenerateImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRegenerateImage();
  };
  
  const handleRegenerateRecipeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRegenerateRecipe();
  };

  if (isRegeneratingRecipe) {
    return (
      <div className="bg-white rounded-xl shadow-lg flex flex-col items-center justify-center p-6 h-[436px]">
        <Loader />
      </div>
    );
  }

  return (
    <div onClick={onSelect} className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300 ease-in-out flex flex-col group cursor-pointer">
      <div className="relative">
        <img className="h-48 w-full object-cover" src={recipe.imageUrl} alt={`Immagine di ${recipe.title}`} />
        
        {/* Overlay with loader or button */}
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isRegeneratingImage ? 'bg-white/70 backdrop-blur-sm opacity-100' : 'bg-black/30 opacity-0 group-hover:opacity-100'}`}>
            {isRegeneratingImage ? (
                <Loader />
            ) : (
                <button
                    onClick={handleRegenerateImageClick}
                    className="bg-white/80 backdrop-blur-sm rounded-full p-2 text-stone-700 hover:text-teal-600 hover:scale-110 transition-all"
                    aria-label="Cambia immagine"
                  >
                    <ReloadIcon className="h-6 w-6" />
                </button>
            )}
        </div>
        
        <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
            <button 
              onClick={handleFavoriteClick} 
              className="bg-white/70 backdrop-blur-sm rounded-full p-2 text-stone-700 hover:text-red-500 hover:scale-110 transition-all"
              aria-label={isFavorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
            >
              <HeartIcon className={`h-6 w-6 ${isFavorite ? 'text-red-500 fill-current' : 'fill-none stroke-current'}`} />
            </button>
            {showSwapButton && (
                <button 
                  onClick={handleRegenerateRecipeClick}
                  className="bg-white/70 backdrop-blur-sm rounded-full p-2 text-stone-700 hover:text-teal-600 hover:scale-110 transition-all"
                  aria-label="Scambia ricetta"
                >
                  <SwapIcon className="h-6 w-6" />
                </button>
            )}
        </div>
      </div>
      <div className="p-6 flex-grow">
        <div className="flex justify-between items-start gap-2">
            <h3 className="text-xl font-semibold text-stone-800 mb-2">{recipe.title}</h3>
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <div className="flex items-center gap-1.5 bg-teal-100 text-teal-800 text-xs font-medium px-2.5 py-1 rounded-full">
                    <ClockIcon className="h-4 w-4" />
                    <span>{recipe.prepTime} min</span>
                </div>
                 <div className="flex gap-2">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getDifficultyClass(recipe.difficulty)}`}>
                        {recipe.difficulty}
                    </span>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getCostClass(recipe.costLevel)}`}>
                        {recipe.costLevel}
                    </span>
                 </div>
            </div>
        </div>
        <p className="text-stone-600 text-sm mt-2">{recipe.description}</p>
      </div>
      <div className="p-6 bg-orange-50/70 mt-auto">
        <div
          className="w-full px-4 py-2 text-center text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 group-hover:bg-teal-700 transition-colors"
        >
          Vedi Ricetta e Lista Spesa
        </div>
      </div>
    </div>
  );
}