# 🚀 Istruzioni per pubblicare l'app Ricette AI su Vercel

## 1️⃣ Carica su GitHub
1. Crea un nuovo repository su GitHub (es. `ricette-ai`).
2. Carica tutti i file di questa cartella.
   - Puoi farlo trascinando i file direttamente nella pagina del repository.

## 2️⃣ Crea un account su Vercel
1. Vai su [https://vercel.com/signup](https://vercel.com/signup)
2. Accedi con il tuo account **GitHub**.

## 3️⃣ Importa il progetto su Vercel
1. Clicca su **Add New Project → Import GitHub Repository**
2. Seleziona il tuo repository `ricette-ai`.

## 4️⃣ Imposta la chiave API
Quando Vercel ti chiede le *Environment Variables* aggiungi:

| Nome | Valore |
|------|---------|
| GEMINI_API_KEY | LA_TUA_CHIAVE_API_DA_AI_STUDIO |

## 5️⃣ Deploy!
Clicca **Deploy** e attendi.
Dopo meno di un minuto otterrai un link del tipo:

👉 https://ricette-ai.vercel.app

## 6️⃣ Fine!
Ora chiunque può usare la tua app senza modificare codice 🎉
