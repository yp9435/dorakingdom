'use client';
import React, { useState, useEffect, useRef } from 'react';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/firebaseinit';
import Image from 'next/image';

const Checkin = () => {
  const [showAnimation, setShowAnimation] = useState(false);
  const [hasCheckedIn, setHasCheckedIn] = useState(false); // Changed initial state to false
  const [points, setPoints] = useState(0);
  const auth = getAuth();
  const audioRef = useRef(null);

  useEffect(() => {
    audioRef.current = new Audio('/assets/point.mp3');
    audioRef.current.volume = 0.5;
  }, []);

  useEffect(() => {
    const checkDailyStatus = async () => {
      if (!auth.currentUser) return;

      try {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data();
        
        if (!userData) {
          // Initialize user document if it doesn't exist
          await updateDoc(userRef, {
            points: 0,
            badges: { bronze: 0, silver: 0, gold: 0 },
            lastLogin: null
          });
          setHasCheckedIn(false);
          return;
        }
        
        // Get last login date and current date
        const lastLogin = userData?.lastLogin?.toDate();
        const today = new Date();
        
        // Check if last login was today (compare dates only)
        const hasCheckedInToday = lastLogin && 
          lastLogin.getDate() === today.getDate() &&
          lastLogin.getMonth() === today.getMonth() &&
          lastLogin.getFullYear() === today.getFullYear();
        
        setHasCheckedIn(hasCheckedInToday);
        setPoints(userData?.points || 0);
      } catch (error) {
        console.error('Error checking daily status:', error);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        checkDailyStatus();
      }
    });

    return () => unsubscribe();
  }, [auth]); // Added auth dependency

  const handleCheckin = async () => {
    if (!auth.currentUser || hasCheckedIn) return;

    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      
      // Get current user data to get current badge count
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      const currentBadges = userData?.badges || { bronze: 0, silver: 0, gold: 0 };
      
      // Update user document
      await updateDoc(userRef, {
        points: increment(1),
        badges: {
          ...currentBadges,
          bronze: (currentBadges.bronze || 0) + 1,
          silver: currentBadges.silver || 0,
          gold: currentBadges.gold || 0
        },
        lastLogin: serverTimestamp(),
      });

      // Play sound
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(error => console.error('Error playing audio:', error));
      }

      // Show animation
      setShowAnimation(true);
      setPoints(prev => prev + 1);
      setHasCheckedIn(true);
      
      setTimeout(() => {
        setShowAnimation(false);
      }, 2000);

    } catch (error) {
      console.error('Error updating checkin:', error);
    }
  };

  return (
    <div className="relative">
      <div className="fixed top-25 right-8 flex items-center gap-2 z-50">
        {/* Added points display */}
        <div className="flex items-center gap-2">
          <Image
            src="/assets/coin.gif"
            alt="Points"
            width={24}
            height={24}
            className="w-6 h-6"
          />
        </div>
        
        {/* Added check-in button */}
        <button
          onClick={handleCheckin}
          disabled={hasCheckedIn}
          className={`px-4 py-2 rounded-lg ${
            hasCheckedIn 
              ? 'bg-purple-100 text-purple-900 cursor-not-allowed' 
              : 'bg-purple-700 text-white hover:bg-purple-500'
          } font-medium transition-colors`}
        >
          {hasCheckedIn ? 'Checked In' : 'Check In'}
        </button>

        {showAnimation && (
          <div className="absolute -bottom-16 -left-4 
                       animate-floatUp pointer-events-none
                       flex items-center gap-2">
            <Image
              src="/assets/coin.gif"
              alt="Coin"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <span className="text-yellow-400 font-bold text-2xl">+</span>
            <span className="text-yellow-400 font-bold text-2xl">1</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkin;