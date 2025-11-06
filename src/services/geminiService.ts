// aiService.ts
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Recipe, Ingredient, ShoppingListItem } from "../types";

// Custom error class per messaggi chiari all'utente
class UserFacingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserFacingError';
  }
}

// Funzione centralizzata per la gestione degli errori API
function handleApiError(error: any, context: string): never {
  // Log dettagliato per il debug in console
  console.error(`Errore durante ${context}:`, error);

  const errorString = error.toString();
  
  // Caso 1: Quota superata
  if (errorString.includes("RESOURCE_EXHAUSTED") || errorString.includes("429")) {
    throw new UserFacingError(
      "Limite richieste IA superato. Hai usato tutte le generazioni gratuite per oggi. Riprova più tardi o controlla il tuo piano di fatturazione."
    );
  }
  
  // Caso 2: Errore di parsing JSON
  if (error instanceof SyntaxError) {
      throw new UserFacingError(
          "L'IA ha risposto in un formato imprevisto. Prova a modificare la tua richiesta o a rigenerare."
      );
  }

  // Caso 3: Errore generico
  throw new UserFacingError(
    `Oops! Qualcosa è andato storto con l'IA durante ${context}. Riprova.`
  );
}


//
// 🔐 Controllo variabili d’ambiente
//
// FIX: Switched from `import.meta.env.VITE_API_KEY` to `process.env.API_KEY` to resolve a TypeScript error and adhere to the coding guidelines for API key handling.
if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

//
// 🚀 Inizializzazione client Gemini
//
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


//
// 🔧 Schemi di risposta JSON (per Gemini)
//
const singleRecipeSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    description: { type: Type.STRING },
    prepTime: { type: Type.INTEGER },
    difficulty: { type: Type.STRING },
    costLevel: { type: Type.STRING },
    ingredients: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          quantity: { type: Type.STRING },
          unit: { type: Type.STRING },
        },
        required: ["name", "quantity", "unit"],
      },
    },
    instructions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: [
    "title",
    "description",
    "prepTime",
    "difficulty",
    "costLevel",
    "ingredients",
    "instructions",
  ],
};

const recipeSchema = { type: Type.ARRAY, items: singleRecipeSchema };

//
// 📸 Analisi immagine frigo (Gemini)
//
export async function analyzeFridgeImage(imageDataBase64: string, mimeType: string): Promise<string> {
  try {
    const imagePart = {
      inlineData: {
        data: imageDataBase64,
        mimeType: mimeType,
      },
    };
    const textPart = {
      text: "Analizza questa immagine del contenuto di un frigorifero. Elenca solo gli ingredienti commestibili che vedi, in italiano, separati da una virgola. Sii conciso. Esempio: pomodori, latte, uova, formaggio. Se non vedi ingredienti, rispondi con una stringa vuota.",
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
    });

    return response.text.trim();
  } catch (error) {
    handleApiError(error, "l'analisi dell'immagine del frigo");
  }
}

//
// 🖼️ Generazione immagine (Gemini)
//
export async function generateRecipeImage(recipeTitle: string): Promise<string> {
  try {
    const prompt = `Una foto realistica e appetitosa di questo piatto: "${recipeTitle}". Stile still-life, illuminazione naturale, su un tavolo rustico.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });
    
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        return `data:image/png;base64,${base64ImageBytes}`;
      }
    }
    
    throw new Error("Nessuna immagine generata dall'IA.");

  } catch (error) {
    console.error(`Errore durante la generazione dell'immagine per "${recipeTitle}":`, error);
    // Fallback a Unsplash in caso di errore per non bloccare l'UI
    const query = encodeURIComponent(recipeTitle.replace(/\s+/g, ' '));
    return `https://source.unsplash.com/400x300/?${query},food&random=${Math.random()}`;
  }
}

//
// 🍝 Generazione ricette (Gemini)
//
export async function generateRecipes(
  ingredients: string,
  servings: number,
  recipeCount: number,
  mealPreference: string,
  dietaryPreferences: string[],
  excludedIngredients: string
): Promise<Recipe[]> {
  try {
    let preferenceInstruction = "bilanciate";
    if (mealPreference === "fast")
      preferenceInstruction = "particolarmente veloci (massimo 20 minuti)";
    if (mealPreference === "economical")
      preferenceInstruction = "economiche e con pochi ingredienti";

    let dietaryInstruction = "";
    if (dietaryPreferences.length > 0) {
      dietaryInstruction = ` Rispetta queste preferenze: ${dietaryPreferences.join(
        ", "
      )}.`;
    }

    let exclusionInstruction = "";
    if (excludedIngredients.trim()) {
      exclusionInstruction = ` Non usare: ${excludedIngredients}.`;
    }

    const prompt = `Sei un'IA di cucina universitaria. Con questi ingredienti: "${ingredients}", genera ${recipeCount} ricette ${preferenceInstruction} per ${servings} persone.${dietaryInstruction}${exclusionInstruction} Fornisci JSON secondo lo schema fornito.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: recipeSchema,
      },
    });

    const recipesData: Omit<Recipe, 'imageUrl'>[] = JSON.parse(response.text || "[]");

    // Aggiunge l'URL dell'immagine a ogni ricetta in parallelo
    const recipesWithImages: Recipe[] = await Promise.all(
      recipesData.map(async (recipe) => ({
        ...recipe,
        imageUrl: await generateRecipeImage(recipe.title),
      }))
    );

    return recipesWithImages;
  } catch (error) {
    handleApiError(error, "la generazione delle ricette");
  }
}

//
// 🔁 Rigenera singola ricetta
//
export async function regenerateSingleRecipe(
  ingredients: string,
  servings: number,
  mealPreference: string,
  dietaryPreferences: string[],
  excludedIngredients: string,
  existingTitles: string[]
): Promise<Recipe> {
  try {
    const prompt = `Genera UNA sola ricetta diversa da queste: "${existingTitles.join(
      '", "'
    )}", per ${servings} persone, usando "${ingredients}".`;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: singleRecipeSchema,
      },
    });

    const newRecipeData = JSON.parse(response.text);
    const imageUrl = await generateRecipeImage(newRecipeData.title);

    return { ...newRecipeData, imageUrl };
  } catch (error) {
    handleApiError(error, "la rigenerazione della ricetta");
  }
}

//
// 🛒 Generazione lista spesa
//
export async function generateShoppingList(
  recipeIngredients: Ingredient[],
  availableIngredients: string
): Promise<ShoppingListItem[]> {
  try {
    const prompt = `Dati gli ingredienti disponibili: "${availableIngredients}", e la lista di ricetta: ${JSON.stringify(
      recipeIngredients.map(
        (i) => `${i.quantity} ${i.unit} ${i.name}`.trim()
      )
    )}, restituisci solo gli ingredienti mancanti come JSON [{name, quantity, unit}].`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              quantity: { type: Type.STRING },
              unit: { type: Type.STRING },
            },
            required: ["name", "quantity", "unit"],
          },
        },
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    handleApiError(error, "la creazione della lista della spesa");
  }
}
