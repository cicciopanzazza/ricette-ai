import React, { useState } from 'react';
import { Recipe, ShoppingListItem } from '../types';
import { BackIcon, ClipboardIcon, ShareIcon, ServingsIcon, ShoppingCartIcon, DifficultyIcon, HeartIcon, ReloadIcon, ClockIcon } from './Icons';
import { Loader } from './Loader';

interface RecipeViewProps {
  recipe: Recipe;
  shoppingList: ShoppingListItem[];
  servings: number;
  onServingsChange: (servings: number) => void;
  onBack: () => void;
  isLoadingShoppingList: boolean;
  onToggleFavorite: (recipe: Recipe) => void;
  isFavorite: boolean;
  onRegenerateImage: () => void;
  isRegeneratingImage: boolean;
}

export function RecipeView({ recipe, shoppingList, servings, onServingsChange, onBack, isLoadingShoppingList, onToggleFavorite, isFavorite, onRegenerateImage, isRegeneratingImage }: RecipeViewProps) {
  const [checkedItems, setCheckedItems] = useState<string[]>([]);

  const handleToggleCheckItem = (itemName: string) => {
    setCheckedItems(prev => 
      prev.includes(itemName) ? prev.filter(item => item !== itemName) : [...prev, itemName]
    );
  };

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

  const formatRecipeForSharing = () => {
    let text = `🍳 Ricetta: ${recipe.title}\n\n`;
    
    text += "📜 Ingredienti:\n";
    recipe.ingredients.forEach(item => {
        text += `- ${item.quantity} ${item.unit} ${item.name}\n`;
    });
    
    text += "\n📋 Istruzioni:\n";
    recipe.instructions.forEach((step, index) => {
        text += `${index + 1}. ${step}\n`;
    });

    if (shoppingList.length > 0) {
      text += `\n🛒 Lista della spesa (ingredienti mancanti):\n`;
      shoppingList.forEach(item => {
        text += `- ${item.name} (${item.quantity} ${item.unit})\n`;
      });
    } else {
      text += "\n🎉 Hai già tutti gli ingredienti!";
    }
    return text;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(formatRecipeForSharing()).then(() => {
        alert('Ricetta e lista della spesa copiate negli appunti!');
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Ricetta: ${recipe.title}`,
        text: formatRecipeForSharing(),
      }).catch(console.error);
    } else {
      handleCopy();
    }
  };
  
  const backButtonText = recipe.ingredients.length > 0 ? "Torna alle Ricette" : "Torna Indietro";

  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg animate-fade-in">
       <button onClick={onBack} className="flex items-center gap-2 text-sm text-teal-600 hover:text-teal-800 font-medium mb-4">
            <BackIcon className="h-4 w-4" />
            {backButtonText}
        </button>

      {/* Sezione Header con immagine */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-6">
        <div className="md:col-span-2">
            <div className="flex items-start gap-4">
                <h2 className="text-3xl font-bold text-stone-800 flex-1">{recipe.title}</h2>
                <button 
                    onClick={() => onToggleFavorite(recipe)}
                    className="flex-shrink-0 text-stone-600 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition"
                    aria-label={isFavorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
                >
                    <HeartIcon className={`h-7 w-7 ${isFavorite ? 'text-red-500 fill-current' : 'fill-none stroke-current'}`} />
                </button>
            </div>
          <p className="text-orange-900 mt-2">{recipe.description}</p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4 mt-4">
              <div className="flex items-center gap-2">
                  <label htmlFor="servings" className="text-sm font-medium text-orange-900 flex items-center"><ServingsIcon className="h-5 w-5 inline-block mr-1"/>Porzioni:</label>
                  <input 
                      type="number" 
                      id="servings" 
                      min="1" 
                      max="20"
                      value={servings}
                      onChange={(e) => onServingsChange(parseInt(e.target.value, 10) || 1)}
                      className="w-20 p-2 border border-orange-300 rounded-md text-center bg-orange-50 text-stone-800 focus:ring-teal-500 focus:border-teal-500"
                  />
              </div>
              <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-orange-900 flex items-center"><DifficultyIcon className="h-5 w-5 inline-block mr-1"/>Difficoltà:</span>
                  <span className={`text-sm font-semibold px-3 py-1 rounded-full ${getDifficultyClass(recipe.difficulty)}`}>
                      {recipe.difficulty}
                  </span>
              </div>
              <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-orange-900 flex items-center"><ClockIcon className="h-5 w-5 inline-block mr-1"/>Tempo:</span>
                  <span className="text-sm font-semibold px-3 py-1 rounded-full bg-teal-100 text-teal-800">
                      {recipe.prepTime} min
                  </span>
              </div>
          </div>
        </div>
        <div className="md:col-span-1 relative group">
            <img src={recipe.imageUrl} alt={`Immagine di ${recipe.title}`} className="rounded-lg shadow-md w-full object-cover aspect-video" />
            <div className={`absolute inset-0 flex items-center justify-center rounded-lg transition-opacity duration-300 ${isRegeneratingImage ? 'bg-white/70 backdrop-blur-sm opacity-100' : 'bg-black/30 opacity-0 group-hover:opacity-100'}`}>
              {isRegeneratingImage ? (
                <Loader />
              ) : (
                <button
                  onClick={onRegenerateImage}
                  className="bg-white/80 backdrop-blur-sm rounded-full p-2 text-stone-700 hover:text-teal-600 hover:scale-110 transition-all"
                  aria-label="Cambia immagine"
                >
                  <ReloadIcon className="h-6 w-6" />
                </button>
              )}
            </div>
        </div>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Colonna sinistra: Ingredienti e Lista Spesa */}
        <div className="md:col-span-1 space-y-6">
          <div className="p-4 bg-orange-50 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Ingredienti</h3>
            <ul className="space-y-2 list-disc list-inside text-orange-900">
              {recipe.ingredients.map((ing, i) => (
                <li key={i}>{`${ing.quantity} ${ing.unit} ${ing.name}`}</li>
              ))}
            </ul>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg">
            <h3 className="text-xl font-semibold mb-3 flex items-center gap-2"><ShoppingCartIcon className="h-6 w-6 text-teal-600" />Lista della Spesa</h3>
            {isLoadingShoppingList ? <div className="flex justify-center items-center h-24"><Loader /></div> :
              shoppingList.length > 0 ? (
                <>
                  <ul className="space-y-2 text-orange-900">
                    {shoppingList.map((item, i) => (
                       <li key={i} className="flex items-center">
                         <input
                           type="checkbox"
                           id={`item-${i}`}
                           checked={checkedItems.includes(item.name)}
                           onChange={() => handleToggleCheckItem(item.name)}
                           className="h-5 w-5 rounded border-orange-300 text-teal-600 focus:ring-teal-500 mr-3"
                           style={{ colorScheme: 'light' }}
                         />
                         <label htmlFor={`item-${i}`} className={`flex-1 transition-colors ${checkedItems.includes(item.name) ? 'line-through text-stone-400' : ''}`}>
                           {`${item.name} (${item.quantity} ${item.unit})`}
                         </label>
                       </li>
                    ))}
                  </ul>
                  <div className="flex gap-2 mt-4">
                    <button onClick={handleCopy} className="flex-1 flex justify-center items-center gap-2 text-sm bg-orange-200 hover:bg-orange-300 text-orange-800 font-medium py-2 px-3 rounded-lg transition-colors"><ClipboardIcon className="h-4 w-4" /> Copia</button>
                    {navigator.share && <button onClick={handleShare} className="flex-1 flex justify-center items-center gap-2 text-sm bg-orange-200 hover:bg-orange-300 text-orange-800 font-medium py-2 px-3 rounded-lg transition-colors"><ShareIcon className="h-4 w-4" /> Condividi</button>}
                  </div>
                </>
              ) : (
                <p className="text-sm p-3 bg-teal-50 text-teal-800 rounded-lg">Hai già tutti gli ingredienti! 🎉</p>
              )
            }
          </div>
        </div>
        
        {/* Colonna destra: Istruzioni */}
        <div className="md:col-span-2">
           <div className="p-4 bg-orange-50 rounded-lg h-full">
            <h3 className="text-xl font-semibold mb-3">Istruzioni</h3>
            <ol className="space-y-4">
              {recipe.instructions.map((step, i) => (
                <li key={i} className="flex items-start">
                  <span className="mr-4 flex-shrink-0 bg-teal-600 text-white h-7 w-7 rounded-full text-base font-bold flex items-center justify-center">{i + 1}</span>
                  <span className="text-orange-900 pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
           </div>
        </div>
      </div>
    </div>
  );
}