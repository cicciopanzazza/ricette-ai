import React from 'react';
import { ClocheIcon } from './Icons';

export const Welcome: React.FC = () => {
  return (
    <div className="text-center p-8 bg-white/50 rounded-xl shadow-sm animate-fade-in max-w-2xl mx-auto">
      <ClocheIcon className="h-16 w-16 mx-auto text-orange-400 mb-4" />
      <h2 className="text-2xl font-bold text-orange-900">Non sai cosa cucinare?</h2>
      <p className="mt-2 text-stone-600 max-w-prose mx-auto">
        Inserisci gli ingredienti che hai a disposizione nel campo qui sopra. Puoi anche scattare una foto del tuo frigo!
        L'IA troverà per te delle ricette deliziose e facili da preparare.
      </p>
      <div className="mt-6">
        <p className="text-sm font-medium text-stone-500">Prova ad inserire qualcosa come:</p>
        <p className="mt-1 text-lg text-teal-700 font-mono tracking-tight bg-orange-50/80 px-2 py-1 rounded inline-block">pasta, uova, guanciale</p>
      </div>
    </div>
  );
};
