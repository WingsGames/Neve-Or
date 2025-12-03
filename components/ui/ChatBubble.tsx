







import React from 'react';
import { ChatMessage } from '../../types';

interface Props {
  message: ChatMessage;
  avatarUrl?: string;
}

export const ChatBubble: React.FC<Props> = ({ message, avatarUrl }) => {
  // Use background tints and soft shadows instead of borders
  const moodStyle = message.mood === 'angry' ? 'bg-red-50 shadow-sm' : 
                   message.mood === 'happy' ? 'bg-green-50 shadow-sm' : 
                   message.mood === 'concerned' ? 'bg-amber-50 shadow-sm' : 'bg-white shadow-sm';
  
  return (
    <div className={`flex gap-2 sm:gap-3 mb-2 sm:mb-4 animate-fade-in-up max-w-[98%] sm:max-w-[85%] ${message.isPlayer ? 'self-end flex-row-reverse' : ''}`}>
      
      {/* Avatar - Compact & Clean */}
      <div className="flex-shrink-0 flex flex-col items-center gap-1">
        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full shadow-md overflow-hidden bg-gray-100 flex items-center justify-center border-2 border-white`}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={message.speaker} className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm">👤</span>
          )}
        </div>
      </div>

      {/* Bubble - Compact & Soft */}
      <div className="flex flex-col gap-1 max-w-[85%]">
        {/* Speaker Label */}
        <span className={`text-[9px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-black/20 text-white/90 shadow-sm backdrop-blur-sm w-fit ${message.isPlayer ? 'ml-auto' : 'mr-auto'}`}>
          {message.speaker}
        </span>
        
        <div className={`py-2 px-3 sm:py-3 sm:px-4 rounded-2xl ${moodStyle} ${message.isPlayer ? 'rounded-tl-none' : 'rounded-tr-none'}`}>
          <p className="text-gray-900 leading-relaxed text-xs sm:text-sm font-medium">{message.text}</p>
        </div>
      </div>
    </div>
  );
};
