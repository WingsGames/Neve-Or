
import React from 'react';
import { Language } from '../../types';

interface Props {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  className?: string;
}

export const LanguageSwitcher: React.FC<Props> = ({ currentLang, onLanguageChange, className = '' }) => {
  // Determine if we are in a "dark mode" context based on custom className overrides (used in Intro)
  // If no className is provided (Hub), we default to the Light/White card style.
  const isDarkContext = className.includes('bg-black') || className.includes('text-white');
  
  const defaultContainer = "bg-white shadow-lg border border-gray-100";
  const containerClass = className || defaultContainer;

  return (
    <div className={`flex gap-0.5 p-1 rounded-full ${containerClass}`}>
      {(['he', 'ar', 'en'] as const).map((lang) => {
        const isActive = currentLang === lang;
        
        // Dynamic styles based on context and state
        // Reduced padding (px-3 py-1) and text size (text-xs) for compact look
        let buttonClass = "px-3 py-1 rounded-full text-xs font-bold transition-all duration-200 ";
        
        if (isDarkContext) {
           // Dark Context (Intro Screen)
           if (isActive) buttonClass += "bg-white text-blue-900 shadow-sm";
           else buttonClass += "text-white/80 hover:bg-white/10";
        } else {
           // Light Context (Hub Map - Default)
           if (isActive) buttonClass += "bg-blue-600 text-white shadow-md";
           else buttonClass += "text-gray-600 hover:bg-gray-100 hover:text-blue-600";
        }

        return (
          <button 
            key={lang}
            onClick={() => onLanguageChange(lang)}
            className={buttonClass}
          >
            {lang === 'he' ? 'עברית' : lang === 'ar' ? 'العربية' : 'English'}
          </button>
        );
      })}
    </div>
  );
};
