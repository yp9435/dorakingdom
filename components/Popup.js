'use client'
import React, { useEffect } from 'react';

const Popup = ({ title, message, onClose }) => {
  useEffect(() => {
    // Close on escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 animate-fadeIn">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Popup Content */}
      <div className="relative bg-gradient-to-b from-purple-900 to-purple-800 
                    rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl
                    border border-purple-700/50
                    animate-scaleIn">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-purple-300 hover:text-white
                   transition-colors duration-200">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="text-center space-y-4">
          {/* Trophy Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center
                          animate-bounce">
              <span className="text-4xl">🏆</span>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-white tracking-tight">
            {title}
          </h2>

          {/* Message */}
          <p className="text-lg text-purple-200">
            {message}
          </p>

          {/* Continue Button */}
          <button
            onClick={onClose}
            className="mt-6 bg-purple-600 hover:bg-purple-500 text-white 
                     px-6 py-3 rounded-xl font-medium
                     transition-all duration-200 ease-in-out
                     hover:shadow-lg hover:shadow-purple-500/20
                     active:transform active:scale-95">
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default Popup;