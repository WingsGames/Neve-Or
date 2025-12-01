
import React from 'react';
import { ChatMessage } from '../../types';

interface Props {
  message: ChatMessage;
  avatarUrl?: string;
}

export const ChatBubble: React.FC<Props> = ({ message, avatarUrl }) => {
  const borderColor = message.mood === 'angry' ? 'border-red-400' : 
                     message.mood === 'happy' ? 'border-green-400' : 
                     message.mood === 'concerned' ? 'border-amber-400' : 'border-blue-200';
  
  return (
    <div className={`flex gap-2 mb-3 sm:mb-4 animate-fade-in-up max-w-[95%] sm:max-w-[85%] ${message.isPlayer ? 'self-end flex-row-reverse' : ''}`}>
      
      {/* Avatar - Compact */}
      <div className="flex-shrink-0 flex flex-col items-center gap-1">
        <div className={`w-9 h-9 rounded-full border-2 ${borderColor} shadow-md overflow-hidden bg-gray-100 flex items-center justify-center`}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={message.speaker} className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm">👤</span>
          )}
        </div>
      </div>

      {/* Bubble - Compact */}
      <div className="flex flex-col gap-1 max-w-[85%]">
        {/* Improved Speaker Label readability */}
        <span className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-black/40 text-white shadow-sm backdrop-blur-sm w-fit ${message.isPlayer ? 'ml-auto' : 'mr-auto'}`}>
          {message.speaker}
        </span>
        
        <div className={`py-2 px-3 rounded-xl bg-white/95 border ${borderColor} shadow-md backdrop-blur-sm ${message.isPlayer ? 'rounded-tl-none' : 'rounded-tr-none'}`}>
          <p className="text-gray-900 leading-relaxed text-xs sm:text-sm font-medium">{message.text}</p>
        </div>
      </div>
    </div>
  );
};
