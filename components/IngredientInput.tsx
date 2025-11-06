
import React, { useState, useEffect, useRef } from 'react';
import { SparklesIcon, PantryIcon, BanIcon, CameraIcon } from './Icons';
import { analyzeFridgeImage } from '../services/geminiService';

interface IngredientInputProps {
  onSubmit: (data: { ingredients: string; recipeCount: number; mealPreference: string; usePantry: boolean; dietaryPreferences: string[]; servings: number; excludedIngredients: string; }) => void;
  isLoading: boolean;
  initialValue?: string;
  initialPantryValue: string;
  onSavePantry: (pantry: string) => void;
  initialExcludedValue: string;
  onSaveExclusions: (exclusions: string) => void;
}

// Helper function to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = (reader.result as string).split(',')[1];
            if (!result) {
                reject(new Error("Impossibile convertire il file in base64."));
                return;
            }
            resolve(result);
        };
        reader.onerror = error => reject(error);
    });
};


export function IngredientInput({ onSubmit, isLoading, initialValue = '', initialPantryValue, onSavePantry, initialExcludedValue, onSaveExclusions }: IngredientInputProps) {
  const [ingredients, setIngredients] = useState(initialValue);
  const [recipeCount, setRecipeCount] = useState(5);
  const [servings, setServings] = useState(1);
  const [mealPreference, setMealPreference] = useState('fast'); // Default a 'Veloce'
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([]);
  
  const [pantryInputValue, setPantryInputValue] = useState(initialPantryValue);
  const [usePantry, setUsePantry] = useState(true);
  const [isPantryOpen, setIsPantryOpen] = useState(false);

  const [excludedInputValue, setExcludedInputValue] = useState(initialExcludedValue);
  const [isExclusionsOpen, setIsExclusionsOpen] = useState(false);
  
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    setPantryInputValue(initialPantryValue);
  }, [initialPantryValue]);

  useEffect(() => {
    setExcludedInputValue(initialExcludedValue);
  }, [initialExcludedValue]);

  const handleSavePantryClick = () => {
    onSavePantry(pantryInputValue);
    setIsPantryOpen(false);
  };

  const handleSaveExclusionsClick = () => {
    onSaveExclusions(excludedInputValue);
    setIsExclusionsOpen(false);
  };
  
  const handleDietaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setDietaryPreferences(prev => 
        checked ? [...prev, value] : prev.filter(pref => pref !== value)
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ingredients.trim() || (usePantry && initialPantryValue.trim())) {
      onSubmit({ ingredients: ingredients.trim(), recipeCount, mealPreference, usePantry, dietaryPreferences, servings, excludedIngredients: initialExcludedValue });
    }
  };
  
  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsAnalyzingImage(true);
      setImageError(null);

      try {
          const base64Data = await fileToBase64(file);
          const identifiedIngredients = await analyzeFridgeImage(base64Data, file.type);
          
          if (identifiedIngredients) {
              setIngredients(prev => prev.trim() ? `${prev.trim()}, ${identifiedIngredients}` : identifiedIngredients);
          } else {
              setImageError("Nessun ingrediente riconosciuto nell'immagine. Prova con una foto più chiara.");
          }
      } catch (e: unknown) {
          const errorMessage = e instanceof Error ? e.message : 'Analisi immagine fallita.';
          setImageError(errorMessage);
      } finally {
          setIsAnalyzingImage(false);
          // Reset file input value to allow re-uploading the same file
          if (fileInputRef.current) {
              fileInputRef.current.value = "";
          }
      }
  };

  const isSubmitDisabled = isLoading || isAnalyzingImage || (!ingredients.trim() && (!usePantry || !initialPantryValue.trim()));

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-md">
      <div>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="ingredients" className="block text-xl font-medium text-orange-900">
                Ingredienti a disposizione
            </label>
            <button
              type="button"
              onClick={handleCameraClick}
              disabled={isAnalyzingImage}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-stone-700 rounded-lg hover:bg-stone-800 transition-colors disabled:bg-stone-400"
            >
              {isAnalyzingImage ? (
                  <>
                      <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                      <span>Analisi...</span>
                  </>
              ) : (
                  <>
                      <CameraIcon className="h-5 w-5" />
                      <span className="hidden sm:inline">Fotografa il frigo</span>
                  </>
              )}
            </button>
          </div>
          <textarea
              id="ingredients"
              name="ingredients"
              rows={3}
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              className="w-full p-3 border border-orange-300 rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition duration-150 ease-in-out text-base bg-orange-50 text-stone-800 placeholder:text-orange-400"
              placeholder="es. pasta, 1 uovo, parmigiano, pancetta..."
          />
          <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
                capture="environment"
           />
           {imageError && <p className="mt-2 text-sm text-red-600 animate-fade-in">{imageError}</p>}
      </div>

      <div className="flex flex-wrap items-end gap-x-4 gap-y-4">
        <div className="flex-grow sm:flex-grow-0">
            <label htmlFor="recipeCount" className="block text-sm font-medium text-orange-900 mb-1">
                N. ricette
            </label>
            <input
                type="number"
                id="recipeCount"
                name="recipeCount"
                min="1"
                max="5"
                value={recipeCount}
                onChange={(e) => setRecipeCount(parseInt(e.target.value, 10))}
                className="w-full sm:w-24 p-3 border border-orange-300 rounded-lg shadow-sm text-center text-base bg-orange-50 text-stone-800 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
            />
        </div>
         <div className="flex-grow sm:flex-grow-0">
            <label htmlFor="servings" className="block text-sm font-medium text-orange-900 mb-1">
                Porzioni
            </label>
            <div className="flex items-center gap-2">
                <input
                    type="number"
                    id="servings"
                    name="servings"
                    min="1"
                    max="20"
                    value={servings}
                    onChange={(e) => setServings(parseInt(e.target.value, 10) || 1)}
                    className="w-24 p-3 border border-orange-300 rounded-lg shadow-sm text-center text-base bg-orange-50 text-stone-800 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                />
                <button type="button" onClick={() => setServings(4)} className="px-3 py-3 bg-orange-100 text-orange-800 text-sm font-medium rounded-lg hover:bg-orange-200 transition-colors whitespace-nowrap">
                    Cena tra amici
                </button>
            </div>
        </div>
      </div>

      {/* Sezione Dispensa */}
      <div className="space-y-3 pt-4 border-t border-orange-100">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <input type="checkbox" id="usePantry" checked={usePantry} onChange={(e) => setUsePantry(e.target.checked)} className="h-5 w-5 rounded border-orange-300 text-teal-600 focus:ring-teal-500" style={{ colorScheme: 'light' }}/>
                <label htmlFor="usePantry" className="font-medium text-orange-900">Includi ingredienti dalla dispensa</label>
            </div>
            <button type="button" onClick={() => setIsPantryOpen(!isPantryOpen)} className="flex items-center gap-2 text-sm text-teal-600 hover:text-teal-800 font-medium">
                <PantryIcon className="h-5 w-5"/>
                {isPantryOpen ? 'Chiudi' : 'Modifica'} Dispensa
            </button>
        </div>
        {isPantryOpen && (
            <div className="p-4 bg-orange-50 rounded-lg space-y-3 animate-fade-in">
                <label htmlFor="pantry-ingredients" className="block text-sm font-medium text-orange-800">Ingredienti base (olio, sale, pasta...)</label>
                <textarea 
                    id="pantry-ingredients"
                    rows={4}
                    value={pantryInputValue}
                    onChange={(e) => setPantryInputValue(e.target.value)}
                    className="w-full p-3 border border-orange-200 rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition text-sm bg-orange-50 text-stone-800 placeholder:text-orange-400"
                    placeholder="Elenca gli ingredienti che hai quasi sempre in casa, separati da una virgola."
                />
                <button type="button" onClick={handleSavePantryClick} className="w-full sm:w-auto px-4 py-2 bg-orange-200 text-orange-800 hover:bg-orange-300 font-medium rounded-lg text-sm transition-colors">Salva Dispensa</button>
            </div>
        )}
      </div>

      <div className="space-y-4">
          <div>
              <h3 className="text-xl font-medium text-orange-900 mb-3">Scegli la tua preferenza</h3>
              <div className="grid grid-cols-3 gap-3">
                  {['Veloce', 'Economico', 'Bilanciato'].map((pref) => {
                      const prefValue = pref === 'Veloce' ? 'fast' : pref === 'Economico' ? 'economical' : 'balanced';
                      return (
                          <div key={prefValue}>
                              <input 
                                  type="radio" 
                                  id={prefValue} 
                                  name="preference" 
                                  value={prefValue}
                                  checked={mealPreference === prefValue}
                                  onChange={(e) => setMealPreference(e.target.value)}
                                  className="sr-only peer"
                              />
                              <label 
                                  htmlFor={prefValue}
                                  className="block w-full text-center p-3 border rounded-lg cursor-pointer transition-all duration-200 peer-checked:bg-teal-600 peer-checked:text-white peer-checked:shadow-lg peer-checked:border-teal-600 bg-orange-50 border-orange-200 text-orange-800 hover:bg-orange-100 hover:border-orange-300"
                              >
                                  {pref}
                              </label>
                          </div>
                      )
                  })}
              </div>
          </div>
          <div>
            <h3 className="text-xl font-medium text-orange-900 mb-3">Preferenze alimentari <span className="text-sm font-normal text-orange-500">(opzionale)</span></h3>
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2">
                    {['Vegetariano', 'Vegano', 'Senza Glutine', 'Senza Lattosio'].map((pref) => (
                    <div key={pref} className="relative flex items-center">
                        <input
                            id={pref}
                            name="dietaryPreferences"
                            value={pref}
                            type="checkbox"
                            onChange={handleDietaryChange}
                            className="h-4 w-4 rounded border-orange-300 text-teal-600 focus:ring-teal-500"
                            style={{ colorScheme: 'light' }}
                        />
                        <label htmlFor={pref} className="ml-2 block text-sm font-medium text-orange-900">
                            {pref}
                        </label>
                    </div>
                    ))}
                </div>
            </div>
          </div>
          <div className="pt-4 border-t border-orange-100">
            <button type="button" onClick={() => setIsExclusionsOpen(!isExclusionsOpen)} className="flex w-full items-center justify-between text-left font-medium text-orange-900 text-lg">
                <span>Ingredienti da Escludere <span className="text-sm font-normal text-orange-500">(opzionale)</span></span>
                <BanIcon className={`h-5 w-5 text-stone-500 transition-transform ${isExclusionsOpen ? 'rotate-45' : ''}`} />
            </button>
            {isExclusionsOpen && (
                 <div className="mt-3 p-4 bg-orange-50 rounded-lg space-y-3 animate-fade-in">
                     <label htmlFor="excluded-ingredients" className="block text-sm font-medium text-orange-800">Elenca gli ingredienti da non usare, separati da una virgola.</label>
                     <textarea 
                         id="excluded-ingredients"
                         rows={3}
                         value={excludedInputValue}
                         onChange={(e) => setExcludedInputValue(e.target.value)}
                         className="w-full p-3 border border-orange-200 rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition text-sm bg-orange-50 text-stone-800 placeholder:text-orange-400"
                         placeholder="es. funghi, cipolle, coriandolo..."
                     />
                     <button type="button" onClick={handleSaveExclusionsClick} className="w-full sm:w-auto px-4 py-2 bg-orange-200 text-orange-800 hover:bg-orange-300 font-medium rounded-lg text-sm transition-colors">Salva Esclusioni</button>
                 </div>
            )}
        </div>
      </div>
      
      <button
        type="submit"
        disabled={isSubmitDisabled}
        className="w-full flex justify-center items-center gap-3 px-6 py-3 border border-transparent text-base font-semibold rounded-lg shadow-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-orange-300 disabled:cursor-not-allowed transition-all duration-200 ease-in-out transform hover:scale-105"
      >
        {isLoading ? (
          'Sto generando...'
        ) : (
          <>
            <SparklesIcon className="h-6 w-6" />
            Trova Ricette
          </>
        )}
      </button>
    </form>
  );
}