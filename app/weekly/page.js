'use client'
import React, { useEffect, useState } from 'react';
import { db } from '../../firebase/firebaseinit';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import Popup from '@/components/Popup';
import Link from 'next/link';

const WeeklyPage = () => {
  const [weeklyQuests, setWeeklyQuests] = useState(null);
  const [userProgress, setUserProgress] = useState({});
  const [showPopup, setShowPopup] = useState(false);
  const [completedQuest, setCompletedQuest] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const auth = getAuth();
  const WEEKLY_MISSION_ID = 'weeklychallenge27-12-14';

  useEffect(() => {
    const fetchWeeklyQuests = async () => {
      if (!auth.currentUser) {
        console.log("No auth user");
        return;
      }

      try {
        // Fetch weekly mission data
        console.log("Fetching mission:", WEEKLY_MISSION_ID);
        const weeklyDoc = await getDoc(doc(db, 'missions', WEEKLY_MISSION_ID));
        console.log("Weekly doc data:", weeklyDoc.data());
        
        if (weeklyDoc.exists()) {
          setWeeklyQuests(weeklyDoc.data());
        } else {
          console.log("Weekly mission document doesn't exist");
        }

        // Fetch user's data
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        console.log("User data:", userDoc.data());
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIsEnrolled(userData.missions?.includes(WEEKLY_MISSION_ID) || false);
          
          // Get user's quest progress
          if (userData.quests && userData.quests[weeklyDoc.data()?.title]) {
            setUserProgress(userData.quests[weeklyDoc.data().title]);
          }
        }
      } catch (error) {
        console.error("Error fetching weekly quests:", error);
      }
    };

    fetchWeeklyQuests();
  }, [auth.currentUser]);

  // Add debug logs for state
  console.log("Current weeklyQuests state:", weeklyQuests);
  console.log("Current userProgress state:", userProgress);
  console.log("isEnrolled:", isEnrolled);

  const handleEnrollment = async () => {
    if (!auth.currentUser) return;

    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      
      // Add mission to user's missions array
      await updateDoc(userRef, {
        missions: arrayUnion(WEEKLY_MISSION_ID)
      });

      // Initialize quest progress
      const questsObject = {};
      Object.entries(weeklyQuests.quests).forEach(([key, quest]) => {
        questsObject[key] = {
          id: quest.id,
          questName: quest.questName,
          completed: 0
        };
      });

      await updateDoc(userRef, {
        [`quests.${weeklyQuests.title}`]: questsObject
      });

      setIsEnrolled(true);
      setUserProgress(questsObject);
    } catch (error) {
      console.error("Error enrolling in weekly challenge:", error);
    }
  };

  const handleQuestCompletion = async (questId) => {
    if (!auth.currentUser || !isEnrolled) return;

    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const newStatus = userProgress[questId]?.completed === 1 ? 0 : 1;
      
      // Update quest completion status
      await updateDoc(userRef, {
        [`quests.${weeklyQuests.title}.${questId}.completed`]: newStatus
      });

      if (newStatus === 1) {
        // Get current user data to check badges and quest progress
        const userDoc = await getDoc(userRef);
        const currentBadges = userDoc.data()?.badges || { bronze: 0, gold: 0 };
        
        // Award bronze badge for individual quest completion
        await updateDoc(userRef, {
          'badges.bronze': (currentBadges.bronze || 0) + 1
        });

        // Check if all quests are completed after this one
        const updatedProgress = {
          ...userProgress,
          [questId]: { ...userProgress[questId], completed: 1 }
        };
        
        const allQuestsCompleted = Object.keys(weeklyQuests.quests).every(
          qId => qId === questId ? true : updatedProgress[qId]?.completed === 1
        );

        // Award gold badge if all quests are completed
        if (allQuestsCompleted) {
          await updateDoc(userRef, {
            'badges.gold': (currentBadges.gold || 0) + 1
          });
          setCompletedQuest('all weekly challenges');
        } else {
          setCompletedQuest(weeklyQuests.quests[questId].questName);
        }

        setShowPopup(true);
      }

      setUserProgress(prev => ({
        ...prev,
        [questId]: {
          ...prev[questId],
          completed: newStatus
        }
      }));
    } catch (error) {
      console.error("Error updating quest status:", error);
    }
  };

  if (!weeklyQuests) {
    return (
      <div className="min-h-screen py-20 px-4 md:px-8">
        <div className="max-w-4xl mx-auto text-center text-white">
          Loading weekly challenges...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20 px-4 md:px-8 relative">
      {/* Background Image */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0">
          <div 
            className="w-full h-full opacity-75"
            style={{
              backgroundImage: `url('/assets/weekly.jpg')`,
              backgroundSize: '200px 200px',
              backgroundRepeat: 'repeat',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/90 to-purple-800/90 backdrop-blur-sm" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link 
          href="/main-home" 
          className="inline-flex items-center gap-2 mb-6 px-4 py-2 
                   bg-purple-900/60 hover:bg-purple-800/60
                   text-purple-100 rounded-lg
                   border border-purple-500/30 backdrop-blur-sm
                   transition-all duration-200 group">
          <span className="transform group-hover:-translate-x-1 transition-transform duration-200">←</span>
          Back to Dashboard
        </Link>

        {/* Header Section */}
        <div className="bg-purple-900/80 backdrop-blur-sm rounded-2xl p-8 mb-8 
                      border-2 border-purple-500/50 shadow-lg">
          <div className="flex items-center gap-6 mb-6">
            <div className="p-4 rounded-xl shadow-inner">
              <span className="text-5xl">{weeklyQuests?.emoji || '🎯'}</span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl text-white 
                          tracking-tight leading-tight font-bold">
              {weeklyQuests?.title || 'Weekly Challenge'}
            </h1>
          </div>
          <p className="text-xl text-purple-200 leading-relaxed mb-6">
            {weeklyQuests?.description}
          </p>
          <div className="text-sm text-purple-300">
            Created by <span className="font-medium text-white">
              {weeklyQuests?.createdBy?.username || 'Anonymous'}
            </span>
          </div>
        </div>

        {/* Quests Section */}
        <div className="bg-purple-900/60 backdrop-blur-sm rounded-2xl p-8 
                      border-2 border-purple-500/50 shadow-lg">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="text-purple-400">📋</span> This Week's Challenges
          </h2>
          
          {!isEnrolled ? (
            <div className="text-center py-8">
              <button 
                onClick={handleEnrollment}
                className="bg-purple-600 hover:bg-purple-500 text-white 
                         px-8 py-3 rounded-xl font-medium
                         transition-all duration-200 ease-in-out
                         hover:shadow-lg hover:shadow-purple-500/20
                         active:transform active:scale-95
                         flex items-center gap-2 mx-auto">
                Start Weekly Challenge <span className="text-xl">→</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(weeklyQuests?.quests || {}).map(([id, quest]) => (
                <div key={id} 
                     className="bg-purple-800/40 rounded-xl p-6 border border-purple-600/30
                              hover:border-purple-500/50 transition-all duration-200
                              hover:shadow-lg hover:shadow-purple-500/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        {quest.questName}
                      </h3>
                    </div>
                    <button 
                      onClick={() => handleQuestCompletion(id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2
                                ${userProgress[id]?.completed === 1 ? 
                                  'bg-green-500/20 text-green-300 border border-green-500/30' : 
                                  'bg-purple-700/30 text-purple-300 border border-purple-600/30'}`}>
                      {userProgress[id]?.completed === 1 ? (
                        <>
                          <span>✓</span>
                          Completed
                        </>
                      ) : (
                        <>
                          <span>□</span>
                          Mark Complete
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Popup Component */}
      {showPopup && (
        <Popup
          title="Challenge Completed! 🎉"
          message={completedQuest === 'all weekly challenges' 
            ? "Congratulations! You've completed all weekly challenges and earned a gold badge! 🏆"
            : `Congratulations! You've completed "${completedQuest}" and earned a bronze badge! 🥉`}
          onClose={() => setShowPopup(false)}
        />
      )}
    </div>
  );
};

export default WeeklyPage;