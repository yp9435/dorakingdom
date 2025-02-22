import React from 'react';
import { useRouter } from 'next/navigation'; 
const Mission = ({ title, description, emoji, createdBy, id }) => {
  const router = useRouter(); 
  const handleNavigate = () => {
    router.push(`/mission/${id}`); 
  };


  const cleanText = (text) => {
    if (typeof text === 'string') {
      return text.replace(/['"]+/g, '');
    }
    return text;
  };

  return (
    <div className="bg-purple-900/80 backdrop-blur-sm rounded-lg shadow-lg p-6 max-w-md 
                    border border-purple-700/50 hover:border-purple-500 
                    transition-all duration-300 ease-in-out
                    hover:scale-[1.02] hover:shadow-purple-500/25 hover:shadow-xl"
         onClick={handleNavigate} 
    >
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl transform hover:scale-110 transition-transform duration-200">
          {cleanText(emoji)}
        </span>
        <h2 className="text-xl font-semibold text-white/90 hover:text-white transition-colors">
          {cleanText(title)}
        </h2>
      </div>
      
      <p className="text-purple-200/90 mb-4 hover:text-purple-100 transition-colors">
        {cleanText(description)}
      </p>
      
      <div className="flex justify-between items-center mt-6">
        <div className="text-sm text-purple-300/80">
          Posted by <span className="font-medium text-white/90 hover:text-white transition-colors">
            {cleanText(createdBy?.username) || 'Anonymous'}
          </span>
        </div>
        
        <button onClick={handleNavigate}
                className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg
                         transition-all duration-200 ease-in-out
                         hover:shadow-lg hover:shadow-purple-500/20
                         active:transform active:scale-95">
          Start →
        </button>
      </div>
    </div>
  );
};

export default Mission;

