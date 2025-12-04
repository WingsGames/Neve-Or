
import React from 'react';
import { playSfx } from '../../services/audioService';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false,
  className = '',
  onClick,
  ...props 
}) => {
  // Reduced py-3 to py-2 for better mobile fit
  const baseStyles = "px-6 py-2 rounded-2xl font-bold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md";
  
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200",
    secondary: "bg-amber-400 text-blue-900 hover:bg-amber-500 shadow-amber-200",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-red-200",
    outline: "bg-white ring-1 ring-inset ring-blue-200 text-blue-600 hover:bg-blue-50 hover:ring-blue-300 shadow-sm"
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!props.disabled) {
      playSfx('click');
    }
    if (onClick) {
      onClick(e);
    }
  };

  const handleMouseEnter = () => {
    if (!props.disabled) {
        playSfx('hover');
    }
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      {...props}
    >
      {children}
    </button>
  );
};
