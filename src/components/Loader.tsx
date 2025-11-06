
import React from 'react';

export function Loader() {
  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div className="w-12 h-12 border-4 border-orange-200 border-t-teal-600 rounded-full animate-spin"></div>
      <p className="text-orange-800 text-sm">L'AI sta pensando...</p>
    </div>
  );
}