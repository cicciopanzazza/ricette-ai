import React, { useState, useCallback, useEffect } from 'react';
import { Recipe, ShoppingListItem } from './types';
import { generateRecipes, generateShoppingList, generateRecipeImage, regenerateSingleRecipe } from './services/geminiService';
import { IngredientInput } from './components/IngredientInput';
import { RecipeCard } from './components/RecipeCard';
import { RecipeView } from './components/RecipeView';
import { Loader } from './components/Loader';
import { Header } from './components/Header';

type View = 'input' | 'recipes' | 'details' | 'favorites';
interface LastRequest {
  ingredients: string;
  recipeCount: number;
  mealPreference: string;
  usePantry: boolean;
  dietaryPreferences: string[];
  servings: number;
  excludedIngredients: string;
}

export default function App() {
  const [view, setView] = useState<View>('input');
  const [freshIngredients, setFreshIngredients] = useState<string>('');
  const [pantryIngredients, setPantryIngredients] = useState<string>('');
  const [excludedIngredients, setExcludedIngredients] = useState<string>('');
  const [combinedIngredients, setCombinedIngredients] = useState<string>('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [servings, setServings] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [regeneratingImageTitle, setRegeneratingImageTitle] = useState<string | null>(null);
  const [regeneratingRecipeIndex, setRegeneratingRecipeIndex] = useState<number | null>(null);
  const [lastRequest, setLastRequest] = useState<LastRequest | null>(null);


  useEffect(() => {
    const savedPantry = localStorage.getItem('mealshare-pantry');
    if (savedPantry) {
      setPantryIngredients(savedPantry);
    }
    const savedFavorites = localStorage.getItem('mealshare-favorites');
    if(savedFavorites){
      setFavorites(JSON.parse(savedFavorites));
    }
    const savedExclusions = localStorage.getItem('mealshare-exclusions');
    if (savedExclusions) {
      setExcludedIngredients(savedExclusions);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('mealshare-favorites', JSON.stringify(favorites));
  }, [favorites]);

  const handlePantrySave = (newPantry: string) => {
    const trimmedPantry = newPantry.trim();
    setPantryIngredients(trimmedPantry);
    localStorage.setItem('mealshare-pantry', trimmedPantry);
  };
  
  const handleSaveExclusions = (newExclusions: string) => {
    const trimmedExclusions = newExclusions.trim();
    setExcludedIngredients(trimmedExclusions);
    localStorage.setItem('mealshare-exclusions', trimmedExclusions);
  };

  const handleToggleFavorite = (recipeToToggle: Recipe) => {
      setFavorites(prevFavorites => {
        const isAlreadyFavorite = prevFavorites.some(fav => fav.title === recipeToToggle.title);
        if (isAlreadyFavorite) {
          return prevFavorites.filter(fav => fav.title !== recipeToToggle.title);
        } else {
          return [...prevFavorites, recipeToToggle];
        }
      });
  };

  const handleGetRecipes = async (data: LastRequest) => {
    setIsLoading(true);
    setError(null);
    setLastRequest(data);
    setFreshIngredients(data.ingredients);
    setServings(data.servings);
    
    let ingredientsForAPI = data.ingredients.trim();
    if (data.usePantry && pantryIngredients) {
        const allIngredients = `${ingredientsForAPI} ${pantryIngredients}`.trim().split(/[, ]+/).filter(Boolean);
        ingredientsForAPI = [...new Set(allIngredients)].join(', ');
    }
    setCombinedIngredients(ingredientsForAPI);

    try {
      const result = await generateRecipes(ingredientsForAPI, data.servings, data.recipeCount, data.mealPreference, data.dietaryPreferences, data.excludedIngredients);
      setRecipes(result);
      setView('recipes');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Si è verificato un errore sconosciuto.');
      setView('input');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectRecipe = useCallback(async (recipe: Recipe) => {
    setIsLoading(true);
    setError(null);
    setSelectedRecipe(recipe);
    setView('details');
    try {
      const list = await generateShoppingList(recipe.ingredients, combinedIngredients);
      setShoppingList(list);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Impossibile generare la lista della spesa.');
    } finally {
      setIsLoading(false);
    }
  }, [combinedIngredients]);
  
  const handleRegenerateImage = async (recipeTitle: string) => {
    if (regeneratingImageTitle) return; // Prevent multiple regenerations

    setRegeneratingImageTitle(recipeTitle);
    setError(null);

    try {
        const newImageUrl = await generateRecipeImage(recipeTitle);

        const updateRecipeInArray = (arr: Recipe[]) =>
            arr.map(recipe =>
                recipe.title === recipeTitle ? { ...recipe, imageUrl: newImageUrl } : recipe
            );

        setRecipes(prevRecipes => updateRecipeInArray(prevRecipes));
        setFavorites(prevFavorites => updateRecipeInArray(prevFavorites));

        if (selectedRecipe?.title === recipeTitle) {
            setSelectedRecipe(prevRecipe => prevRecipe ? { ...prevRecipe, imageUrl: newImageUrl } : null);
        }
    } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Impossibile rigenerare l\'immagine.');
    } finally {
        setRegeneratingImageTitle(null);
    }
  };


  const handleRegenerateRecipe = async (recipeIndex: number) => {
    if (regeneratingRecipeIndex !== null || !lastRequest) return;
  
    setRegeneratingRecipeIndex(recipeIndex);
    setError(null);
    try {
      const existingTitles = recipes.map(r => r.title);
      const oldRecipeTitle = existingTitles[recipeIndex];
  
      const newRecipe = await regenerateSingleRecipe(
        combinedIngredients,
        lastRequest.servings,
        lastRequest.mealPreference,
        lastRequest.dietaryPreferences,
        lastRequest.excludedIngredients,
        existingTitles
      );
  
      // Update recipes list
      const updatedRecipes = [...recipes];
      updatedRecipes[recipeIndex] = newRecipe;
      setRecipes(updatedRecipes);
  
      // Sync with favorites list
      setFavorites(prevFavorites => {
        const isOldRecipeInFavorites = prevFavorites.some(fav => fav.title === oldRecipeTitle);
        if (isOldRecipeInFavorites) {
          // Replace the old favorite with the new recipe
          return prevFavorites.map(fav => fav.title === oldRecipeTitle ? newRecipe : fav);
        }
        return prevFavorites; // No change needed if it wasn't a favorite
      });
  
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Impossibile rigenerare la ricetta in questo momento.');
    } finally {
      setRegeneratingRecipeIndex(null);
    }
  };

  const handleServingsChange = async (newServings: number) => {
    const oldServings = servings;
    setServings(newServings);

    if (selectedRecipe) {
        const updatedIngredients = selectedRecipe.ingredients.map(ing => {
            const quantityMatch = ing.quantity.match(/^(\d+(\.\d+)?)$/);
            if (quantityMatch) {
                const oldQuantity = parseFloat(quantityMatch[0]);
                if (!isNaN(oldQuantity) && oldServings > 0) {
                  const newQuantity = (oldQuantity / oldServings) * newServings;
                  const roundedQuantity = newQuantity % 1 !== 0 ? Math.round(newQuantity * 100) / 100 : Math.round(newQuantity);
                  return { ...ing, quantity: String(roundedQuantity) };
                }
            }
            return ing;
        });
        setSelectedRecipe({ ...selectedRecipe, ingredients: updatedIngredients });
    }
  };

  const handleBack = () => {
    setError(null);
    setSelectedRecipe(null);
    setShoppingList([]);
    if(view === 'details') {
      setView(recipes.length > 0 ? 'recipes' : 'input');
    } else if (view === 'favorites') {
      setView('input');
    } else {
      setView('input');
    }
  };
  
  const isFavorite = (recipe: Recipe) => favorites.some(fav => fav.title === recipe.title);

  const renderContent = () => {
    if (isLoading && !selectedRecipe && regeneratingRecipeIndex === null) {
      return <div className="flex justify-center items-center h-64"><Loader /></div>;
    }
    
    if (error) {
       return <div className="text-center p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg animate-fade-in">{error}</div>
    }

    switch (view) {
      case 'recipes':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {recipes.map((recipe, index) => (
              <RecipeCard 
                key={recipe.title + index} 
                recipe={recipe} 
                onSelect={() => handleSelectRecipe(recipe)} 
                onToggleFavorite={handleToggleFavorite} 
                isFavorite={isFavorite(recipe)}
                onRegenerateImage={() => handleRegenerateImage(recipe.title)}
                isRegeneratingImage={regeneratingImageTitle === recipe.title}
                onRegenerateRecipe={() => handleRegenerateRecipe(index)}
                isRegeneratingRecipe={regeneratingRecipeIndex === index}
                showSwapButton={true}
              />
            ))}
          </div>
        );
      case 'favorites':
        return (
          <div>
            <h2 className="text-2xl font-bold text-center mb-6 text-orange-900">Le Tue Ricette Preferite</h2>
            {favorites.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                    {favorites.map((recipe, index) => (
                        <RecipeCard 
                          key={recipe.title + index} 
                          recipe={recipe} 
                          onSelect={() => handleSelectRecipe(recipe)} 
                          onToggleFavorite={handleToggleFavorite} 
                          isFavorite={isFavorite(recipe)}
                          onRegenerateImage={() => handleRegenerateImage(recipe.title)}
                          isRegeneratingImage={regeneratingImageTitle === recipe.title}
                          onRegenerateRecipe={() => {}}
                          isRegeneratingRecipe={false}
                          showSwapButton={false}
                        />
                    ))}
                </div>
            ) : (
                <p className="text-center text-stone-500">Non hai ancora salvato nessuna ricetta.</p>
            )}
          </div>
        );
      case 'details':
        if (selectedRecipe) {
          return (
            <RecipeView
              recipe={selectedRecipe}
              shoppingList={shoppingList}
              servings={servings}
              onServingsChange={handleServingsChange}
              onBack={handleBack}
              isLoadingShoppingList={isLoading}
              onToggleFavorite={handleToggleFavorite}
              isFavorite={isFavorite(selectedRecipe)}
              onRegenerateImage={() => handleRegenerateImage(selectedRecipe.title)}
              isRegeneratingImage={regeneratingImageTitle === selectedRecipe.title}
            />
          );
        }
        return null;
      case 'input':
      default:
        if (favorites.length > 0 && recipes.length === 0) {
            return (
                <div className="animate-fade-in">
                    <h2 className="text-2xl font-bold text-center mb-6 text-orange-900">Le Tue Ricette Preferite</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {favorites.map((recipe, index) => {
                            return (
                               <RecipeCard 
                                key={index} 
                                recipe={recipe} 
                                onSelect={() => handleSelectRecipe(recipe)} 
                                onToggleFavorite={handleToggleFavorite} 
                                isFavorite={isFavorite(recipe)}
                                onRegenerateImage={() => handleRegenerateImage(recipe.title)}
                                isRegeneratingImage={regeneratingImageTitle === recipe.title}
                                onRegenerateRecipe={() => {}}
                                isRegeneratingRecipe={false}
                                showSwapButton={false}
                            />
                            )
                        })}
                    </div>
                </div>
            );
        }
        return <p className="text-center text-stone-500 animate-fade-in">Usa il modulo sopra per trovare fantastiche ricette!</p>;
    }
  };

  return (
    <div className="min-h-screen">
      <Header 
        onHomeClick={() => setView('input')}
        onFavoritesClick={() => setView('favorites')}
        showFavorites={favorites.length > 0}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        {view !== 'details' && (
          <div className="max-w-3xl mx-auto mb-8 text-center">
              <h1 className="text-4xl sm:text-5xl font-bold text-stone-800">Chef Fuori-Sede</h1>
              <p className="text-lg text-orange-900 mt-2">Butta dentro quello che hai in frigo e scopri piatti facili e veloci.</p>
          </div>
        )}

        {view !== 'details' && (
          <div className="max-w-3xl mx-auto mb-8">
            <IngredientInput 
              onSubmit={handleGetRecipes} 
              isLoading={isLoading} 
              initialValue={freshIngredients}
              initialPantryValue={pantryIngredients}
              onSavePantry={handlePantrySave}
              initialExcludedValue={excludedIngredients}
              onSaveExclusions={handleSaveExclusions}
            />
             <div className="flex justify-center items-center gap-4 mt-4 text-sm font-medium">
                {view === 'recipes' && <button onClick={() => setView('input')} className="text-teal-600 hover:text-teal-800">Modifica ingredienti</button>}
                {view === 'input' && recipes.length > 0 && <button onClick={() => setView('recipes')} className="text-teal-600 hover:text-teal-800">Torna alle ricette</button>}
             </div>
          </div>
        )}
        
        {renderContent()}

      </main>
    </div>
  );
}