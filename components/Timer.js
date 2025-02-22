'use client'
import React, { useState, useEffect } from 'react';
import Popup from './Popup';

const Timer = ({ isOpen, onClose, className = "" }) => {
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [time, setTime] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState('work');

  // Load saved durations from localStorage after component mounts
  useEffect(() => {
    const savedWorkDuration = localStorage.getItem('workDuration');
    const savedBreakDuration = localStorage.getItem('breakDuration');
    
    if (savedWorkDuration) {
      setWorkDuration(Number(savedWorkDuration));
      if (mode === 'work') setTime(Number(savedWorkDuration) * 60);
    }
    
    if (savedBreakDuration) {
      setBreakDuration(Number(savedBreakDuration));
      if (mode === 'break') setTime(Number(savedBreakDuration) * 60);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('workDuration', workDuration.toString());
  }, [workDuration]);

  useEffect(() => {
    localStorage.setItem('breakDuration', breakDuration.toString());
  }, [breakDuration]);

  useEffect(() => {
    let interval;
    if (isActive && time > 0) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime - 1);
      }, 1000);
    } else if (time === 0) {
      setIsActive(false);
      new Audio('/notification.mp3').play().catch(e => console.log(e));
      // Switch modes
      if (mode === 'work') {
        setMode('break');
        setTime(breakDuration * 60);
      } else {
        setMode('work');
        setTime(workDuration * 60);
      }
    }
    return () => clearInterval(interval);
  }, [isActive, time, mode, workDuration, breakDuration]);

  const startTimer = () => setIsActive(true);
  const pauseTimer = () => setIsActive(false);
  const resetTimer = () => {
    setIsActive(false);
    setTime(workDuration * 60);
    setMode('work');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 flex items-center justify-center z-[70] ${className}`}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-gradient-to-b from-purple-900 to-purple-800 
                    rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl
                    border border-purple-700/50">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-purple-300 hover:text-white
                   transition-colors duration-200">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Timer Content */}
        <div className="text-center space-y-6">
          <h2 className="text-2xl font-bold text-white">
            {mode === 'work' ? 'Work Time' : 'Break Time'}
          </h2>
          
          <div className="text-4xl font-mono text-white">
            {formatTime(time)}
          </div>

          {/* Duration Settings */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <label className="text-purple-200 text-sm">Work Duration (min)</label>
              <input 
                type="number" 
                value={workDuration}
                onChange={(e) => {
                  setWorkDuration(Number(e.target.value));
                  if (mode === 'work') setTime(Number(e.target.value) * 60);
                }}
                className="w-full bg-purple-800/50 border border-purple-600 rounded-lg px-3 py-2 text-white"
                min="1"
                max="60"
              />
            </div>
            <div className="space-y-2">
              <label className="text-purple-200 text-sm">Break Duration (min)</label>
              <input 
                type="number" 
                value={breakDuration}
                onChange={(e) => {
                  setBreakDuration(Number(e.target.value));
                  if (mode === 'break') setTime(Number(e.target.value) * 60);
                }}
                className="w-full bg-purple-800/50 border border-purple-600 rounded-lg px-3 py-2 text-white"
                min="1"
                max="30"
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-4">
            <button
              onClick={isActive ? pauseTimer : startTimer}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl
                       transition-all duration-200 flex items-center gap-2"
            >
              {isActive ? 
                <><span>⏸️</span> Pause</> : 
                <><span>▶️</span> Start</>
              }
            </button>
            <button
              onClick={resetTimer}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl
                       transition-all duration-200 flex items-center gap-2"
            >
              <span>🔄</span> Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timer; 
