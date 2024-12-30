'use client';
import React, { useState, useEffect } from "react";
import EmojiPicker from 'emoji-picker-react';
import { db } from '@/firebase/firebaseinit';
import { doc, setDoc, updateDoc, arrayUnion, serverTimestamp, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Popup from '@/components/Popup';

function Create({ user }) {
  const router = useRouter();
  const auth = getAuth();
  const [mission, setMission] = useState({
    title: "",
    description: "",
    emoji: "",
    isPrivate: false,
    quests: {
      Q1: { id: "q1", questName: "", completed: 0 },
      Q2: { id: "q2", questName: "", completed: 0 },
      Q3: { id: "q3", questName: "", completed: 0 },
    },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showEmojiPicker && !event.target.closest('.emoji-picker-container')) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setMission((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleQuestChange = (questKey, value) => {
    setMission((prev) => ({
      ...prev,
      quests: {
        ...prev.quests,
        [questKey]: { ...prev.quests[questKey], questName: value },
      },
    }));
  };

  const generateQuests = async () => {
    if (!mission.description) return;

    try {
      setIsLoading(true);
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Based on this mission description: "${mission.description}", 
          create 3 specific, actionable quest steps.
          Return ONLY a JSON object with exactly 3-5 quests following this structure:
          {
            "Q1": {"questName": "[First step/task]"},
            "Q2": {"questName": "[Second step/task]"},
            "Q3": {"questName": "[Third step/task]"}
          }`
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      const questData = JSON.parse(data.text);
      setMission(prev => ({
        ...prev,
        quests: {
          Q1: { ...prev.quests.Q1, questName: questData.Q1.questName },
          Q2: { ...prev.quests.Q2, questName: questData.Q2.questName },
          Q3: { ...prev.quests.Q3, questName: questData.Q3.questName },
        },
      }));
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to generate quests. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submit clicked");
    
    if (!auth.currentUser) {
      console.log("No auth user");
      alert('Please sign in to create a mission');
      return;
    }

    try {
      setIsLoading(true);
      console.log("Starting mission creation...");

      // Generate a new mission ID
      const missionId = crypto.randomUUID();
      console.log("Generated missionId:", missionId);

      // 1. Add to missions collection (public missions database)
      const missionData = {
        title: mission.title,
        description: mission.description,
        emoji: mission.emoji || '🎯',
        isPrivate: mission.isPrivate,
        createdBy: {
          userId: auth.currentUser.uid,
          username: auth.currentUser.displayName || 'Anonymous',
          email: auth.currentUser.email
        },
        quests: {
          Q1: { ...mission.quests.Q1, completed: 0 },
          Q2: { ...mission.quests.Q2, completed: 0 },
          Q3: { ...mission.quests.Q3, completed: 0 }
        },
        createdAt: serverTimestamp()
      };
      console.log("Mission data:", missionData);

      // Add to missions collection
      console.log("Adding to missions collection...");
      await setDoc(doc(db, 'missions', missionId), missionData);
      console.log("Added to missions collection");

      // 2. Add to user's personal database
      const userRef = doc(db, 'users', auth.currentUser.uid);
      console.log("Getting user data...");
      
      // Get current user data to check badges
      const userDoc = await getDoc(userRef);
      const currentBadges = userDoc.data()?.badges || { silver: 0 };
      console.log("Current badges:", currentBadges);
      
      // Add mission ID to user's missions array and award silver badge
      console.log("Updating user data...");
      await updateDoc(userRef, {
        missions: arrayUnion(missionId),
        'badges.silver': (currentBadges.silver || 0) + 1
      });
      console.log("Updated user missions and badges");

      // Add quest progress to user's personal quests tracking
      await updateDoc(userRef, {
        [`userMissions.${missionId}`]: {
          title: mission.title,
          emoji: mission.emoji || '🎯',
          startedAt: serverTimestamp(),
          quests: {
            Q1: { questName: mission.quests.Q1.questName, completed: 0 },
            Q2: { questName: mission.quests.Q2.questName, completed: 0 },
            Q3: { questName: mission.quests.Q3.questName, completed: 0 }
          }
        }
      });
      console.log("Updated user mission progress");

      // Show success popup first
      console.log("About to show popup");
      setShowPopup(true);
      console.log("Popup state set to:", true);
      
      // Navigate to the mission page after a longer delay
      setTimeout(() => {
        console.log("Navigating to mission page...");
        setShowPopup(false); // Close popup before navigation
        router.push(`/mission/${missionId}`);
      }, 3000); // Increased to 3 seconds to ensure popup is visible
      
    } catch (error) {
      console.error('Error creating mission:', error);
      alert('Failed to create mission. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onEmojiClick = (emojiObject) => {
    setMission(prev => ({
      ...prev,
      emoji: emojiObject.emoji
    }));
    setShowEmojiPicker(false);
  };

  return (
    <div className="min-h-screen py-12 px-4 md:px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4
                       bg-gradient-to-r from-purple-200 via-purple-100 to-white 
                       bg-clip-text text-transparent mt-20">
            Create Your Mission
          </h1>
          <p className="text-purple-200 text-lg">
            Design a mission that inspires others to join your cause
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Mission Details */}
          <div className="bg-purple-900/80 backdrop-blur-sm rounded-xl p-6
                       border border-purple-700/50 shadow-xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-4 bg-gradient-to-br from-purple-800/50 to-purple-900/50 
                            rounded-lg shadow-inner border border-purple-700/30
                            hover:border-purple-500/50 transition-all duration-200
                            focus:outline-none focus:ring-2 focus:ring-purple-500/50">
                  <span className="text-4xl">{mission.emoji || '🎯'}</span>
                </button>
                
                {showEmojiPicker && (
                  <div className="absolute bottom-full left-0 mb-2 z-[100] emoji-picker-container">
                    <div className="relative">
                      <div className="absolute inset-0 bg-purple-900/80 backdrop-blur-sm rounded-lg" 
                           style={{ transform: 'scale(1.02)', zIndex: -1 }} />
                      <EmojiPicker
                        onEmojiClick={(emojiObject) => {
                          setMission(prev => ({
                            ...prev,
                            emoji: emojiObject.emoji
                          }));
                          setShowEmojiPicker(false);
                        }}
                        theme="dark"
                        searchPlaceholder="Search emoji..."
                        width={280}
                        height={250}
                        previewConfig={{
                          showPreview: false
                        }}
                        skinTonesDisabled
                        categories={['suggested', 'smileys_people', 'animals_nature', 'food_drink', 'travel_places', 'activities', 'objects', 'symbols']}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <input
                type="text"
                name="title"
                placeholder="Mission Title"
                value={mission.title}
                onChange={handleChange}
                className="text-2xl font-bold text-white bg-transparent 
                         border-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 
                         rounded-lg p-2 w-full placeholder-purple-400/50"
              />
            </div>
            
            <textarea
              name="description"
              placeholder="Describe your mission's purpose and goals..."
              value={mission.description}
              onChange={handleChange}
              className="w-full bg-purple-800/30 text-white rounded-lg border border-purple-600/30
                       p-4 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-purple-500/50
                       placeholder-purple-400/50 text-base resize-none"
            />
            
            <div className="mt-4">
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox"
                  checked={mission.isPrivate}
                  onChange={(e) => setMission(prev => ({
                    ...prev,
                    isPrivate: e.target.checked
                  }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 
                  peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer 
                  dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white 
                  after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white 
                  after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 
                  after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"
                />
                <span className="ml-3 text-sm font-medium text-purple-200">
                  {mission.isPrivate ? '🔒 Private Mission' : '🌎 Public Mission'}
                </span>
              </label>
              <p className="mt-1 text-xs text-purple-300">
                {mission.isPrivate 
                  ? 'Only visible on your profile' 
                  : 'Visible to everyone'}
              </p>
            </div>
          </div>

          {/* AI Quest Generation Section - Highlighted */}
          <div className="bg-gradient-to-br from-purple-900/90 to-purple-800/90 
                       backdrop-blur-sm rounded-xl p-6
                       border border-purple-500/30 shadow-2xl">
            <div className="text-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2
                          bg-gradient-to-r from-purple-200 to-white bg-clip-text text-transparent">
                Generate Quests with AI! ✨
              </h2>
              <p className="text-purple-200 text-base">
                Let AI help you break down your mission into achievable steps
              </p>
            </div>

            <button
              type="button"
              onClick={generateQuests}
              disabled={isLoading || !mission.description}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-500 
                       text-white py-4 rounded-lg font-medium text-lg
                       transition-all duration-200 ease-in-out
                       hover:shadow-lg hover:shadow-purple-500/20
                       disabled:opacity-50 disabled:cursor-not-allowed
                       border border-purple-400/20 hover:border-purple-400/40
                       group flex items-center justify-center gap-3">
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  <span>Generating your quest steps...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                          d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Generate with AI</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </>
              )}
            </button>

            <div className="mt-6 space-y-3">
              {Object.keys(mission.quests).map((key) => (
                <div key={key} className="group relative">
                  <input
                    type="text"
                    placeholder="Add a specific, actionable step"
                    value={mission.quests[key].questName}
                    onChange={(e) => handleQuestChange(key, e.target.value)}
                    className="w-full bg-purple-800/30 text-white rounded-lg
                             border border-purple-600/30 p-4 pl-12
                             focus:outline-none focus:ring-2 focus:ring-purple-500/50
                             placeholder-purple-400/50 group-hover:border-purple-500/50
                             transition-all duration-200 text-base"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2
                               text-purple-400/50 text-sm font-medium">
                    {key}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!mission.title || !mission.description || Object.values(mission.quests).some(q => !q.questName)}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-500 
                     text-white py-4 rounded-lg font-medium text-lg
                     transition-all duration-200 ease-in-out
                     hover:shadow-lg hover:shadow-purple-500/20
                     disabled:opacity-50 disabled:cursor-not-allowed
                     border border-purple-400/20 hover:border-purple-400/40
                     group">
            Create Mission
            <span className="inline-block ml-2 transform group-hover:translate-x-1 transition-transform">
              →
            </span>
          </button>
        </form>
      </div>

      {showPopup && (
        <Popup
          title="Mission Created! 🎉"
          message={`Congratulations! You've created "${mission.title}" and earned a silver badge! 🥈`}
          onClose={() => setShowPopup(false)}
        />
      )}
    </div>
  );
}

export default Create;
  
  
