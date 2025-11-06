import React from 'react';
import { HeartIcon, ClocheIcon } from './Icons';

interface HeaderProps {
    onHomeClick: () => void;
    onFavoritesClick: () => void;
    showFavorites: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onHomeClick, onFavoritesClick, showFavorites }) => {
    return (
        <header className="fixed top-0 left-0 right-0 z-20 bg-orange-50/80 backdrop-blur-md shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <button onClick={onHomeClick} className="flex items-center text-stone-800 hover:text-teal-600 transition-colors">
                        <ClocheIcon className="h-8 w-8 mr-2" />
                        <span className="text-xl font-bold">MasterChef AI</span>
                    </button>
                    <nav>
                        {showFavorites && (
                            <button 
                                onClick={onFavoritesClick}
                                className="flex items-center gap-2 text-stone-600 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50"
                                aria-label="Vedi preferiti"
                            >
                                <HeartIcon className="h-6 w-6" />
                                <span className="hidden sm:inline font-medium">Preferiti</span>
                            </button>
                        )}
                    </nav>
                </div>
            </div>
        </header>
    );
};