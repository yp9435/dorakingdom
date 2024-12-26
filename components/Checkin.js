'use client';
import React, { useState, useEffect, useRef } from 'react';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/firebaseinit';
import Image from 'next/image';

const Checkin = () => {
  const [showAnimation, setShowAnimation] = useState(false);
  const [hasCheckedIn, setHasCheckedIn] = useState(true);
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
        
        if (!userDoc.exists()) {
          console.log("Creating new user document");
          await setDoc(userRef, {
            points: 0,
            badges: { bronze: 0, silver: 0, gold: 0 },
            lastLogin: serverTimestamp(),
            email: auth.currentUser.email,
            image: auth.currentUser.photoURL,
            username: auth.currentUser.displayName || 'Anonymous',
            missions: [],
            userMissions: {},
            quests: {}
          });
          // Fetch the document again after creation
          const newUserDoc = await getDoc(userRef);
          const userData = newUserDoc.data();
          setPoints(userData?.points || 0);
          handleCheckin();
          return;
        }

        const userData = userDoc.data();
        console.log("User data:", userData);
        
        const lastLogin = userData?.lastLogin?.toDate();
        const today = new Date();
        console.log("Last login:", lastLogin);
        console.log("Today:", today);
        
        const hasCheckedInToday = lastLogin && 
          lastLogin.toDateString() === today.toDateString();
        
        console.log("Has checked in today?", hasCheckedInToday);
        setHasCheckedIn(hasCheckedInToday);
        setPoints(userData?.points || 0);

        if (!hasCheckedInToday) {
          console.log("Triggering check-in");
          handleCheckin();
        }
      } catch (error) {
        console.error('Error checking daily status:', error);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        console.log("User logged in:", user.uid);
        checkDailyStatus();
      }
    });

    return () => unsubscribe();
  }, []);

  const handleCheckin = async () => {
    if (!auth.currentUser || hasCheckedIn) {
      console.log("Check-in blocked:", { isAuthed: !!auth.currentUser, hasCheckedIn });
      return;
    }

    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      
      // Get current user data to get current badge count
      const userDoc = await getDoc(userRef);
      const currentBadges = userDoc.data()?.badges || { bronze: 0, silver: 0, gold: 0 };
      console.log("Current badges:", currentBadges);
      
      // Update user document
      await updateDoc(userRef, {
        points: increment(1),
        'badges': {
          ...currentBadges,
          bronze: (currentBadges.bronze || 0) + 1,
          silver: currentBadges.silver || 0,
          gold: currentBadges.gold || 0
        },
        lastLogin: serverTimestamp(),
      });
      console.log("Updated user document");

      // Play sound
      audioRef.current.currentTime = 0;
      audioRef.current.play();

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
      <div className="fixed bottom-50 right-40 flex items-center gap-2 z-50">
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
            <span className="text-green-400 font-bold text-2xl">1</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkin;