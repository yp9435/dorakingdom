'use client'
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { db } from '../../../firebase/firebaseinit';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, addDoc, query, where, orderBy, getDocs, serverTimestamp } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import Popup from '@/components/Popup';
import Timer from '@/components/Timer';

const cleanText = (text) => {
  if (!text) return '';
  return text.replace(/["']/g, '');
};

const MissionPage = () => {
  const [mission, setMission] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [userQuests, setUserQuests] = useState({});
  const [showPopup, setShowPopup] = useState(false);
  const [completedQuest, setCompletedQuest] = useState(null);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTimer, setShowTimer] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);
  const params = useParams();
  const id = params.id;
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthInitialized(true);
      if (user) {
        fetchMissionAndUserStatus(user);
      } else {
        setIsLoading(false);
        fetchMissionData();
      }
    });

    return () => unsubscribe();
  }, [auth, id]);

  const fetchMissionData = async () => {
    try {
      const missionDoc = await getDoc(doc(db, 'missions', id));
      if (missionDoc.exists()) {
        setMission(missionDoc.data());
      }
      await fetchComments();
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching mission:", error);
      setIsLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const commentsRef = collection(db, 'comments');
      const q = query(
        commentsRef,
        where('missionId', '==', id),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const commentsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setComments(commentsData);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const fetchMissionAndUserStatus = async (user) => {
    try {
      const missionDoc = await getDoc(doc(db, 'missions', id));
      if (missionDoc.exists()) {
        console.log("Mission data from DB:", missionDoc.data());
        console.log("Mission quests:", missionDoc.data().quests);
        setMission(missionDoc.data());
      }

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log("User data from DB:", userData);
        setIsEnrolled(userData.missions?.includes(id) || false);
        
        if (userData.quests?.[missionDoc.data()?.title]) {
          console.log("Found existing quests:", userData.quests[missionDoc.data().title]);
          setUserQuests(userData.quests[missionDoc.data().title]);
        } else if (isEnrolled) {
          console.log("Initializing quests from mission data");
          const initialQuests = Object.entries(missionDoc.data().quests).reduce((acc, [key, quest]) => {
            acc[key] = {
              ...quest,
              order: quest.order,
              completed: 0
            };
            return acc;
          }, {});
          console.log("Initialized quests:", initialQuests);
          setUserQuests(initialQuests);
        }
      }

      await fetchComments();
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setIsLoading(false);
    }
  };

  if (!authInitialized || isLoading) {
    return (
      <div className="min-h-screen py-20 px-4 md:px-8 flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">
          Loading mission...
        </div>
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="min-h-screen py-20 px-4 md:px-8">
        <div className="max-w-4xl mx-auto text-center text-white">
          Mission not found
        </div>
      </div>
    );
  }

  console.log("Current mission state:", mission);
  console.log("Current userQuests state:", userQuests);
  console.log("isEnrolled:", isEnrolled);

  const handleEnrollment = async () => {
    if (!auth.currentUser) return;

    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      
      // Add mission to user's missions array
      await updateDoc(userRef, {
        missions: arrayUnion(id)
      });

      // Initialize quest progress in user's document
      const questsObject = Object.entries(mission.quests).reduce((acc, [key, quest]) => {
        acc[key] = {
          ...quest,
          completed: 0
        };
        return acc;
      }, {});

      await updateDoc(userRef, {
        [`quests.${mission.title}`]: questsObject
      });

      setIsEnrolled(true);
      setUserQuests(questsObject);
    } catch (error) {
      console.error("Error enrolling in mission:", error);
    }
  };

  const handleQuestCompletion = async (questKey) => {
    if (!auth.currentUser || !isEnrolled) return;

    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const newCompletionStatus = userQuests[questKey]?.completed === 1 ? 0 : 1;

      // Update the specific quest's completion status
      await updateDoc(userRef, {
        [`quests.${mission.title}.${questKey}.completed`]: newCompletionStatus
      });

      // Update local state
      setUserQuests(prev => ({
        ...prev,
        [questKey]: {
          ...prev[questKey],
          completed: newCompletionStatus
        }
      }));

      // Show completion popup only when marking as complete
      if (newCompletionStatus === 1) {
        setCompletedQuest(mission.quests[questKey].questName);
        setShowPopup(true);
      }

    } catch (error) {
      console.error("Error updating quest completion:", error);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim() || !auth.currentUser) return;

    try {
      setIsLoading(true);
      const commentData = {
        missionId: id,
        text: comment,
        createdAt: serverTimestamp(),
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'Anonymous',
        userPhoto: auth.currentUser.photoURL || null
      };

      await addDoc(collection(db, 'comments'), commentData);
      
      // Refresh comments
      const commentsRef = collection(db, 'comments');
      const q = query(
        commentsRef,
        where('missionId', '==', id),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const commentsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setComments(commentsData);
      
      setComment('');
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setIsLoading(false);
    }
  };

  console.log("Rendering mission quests:", mission?.quests);
  console.log("Current userQuests:", userQuests);

  return (
    <div className="min-h-screen py-20 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="bg-purple-900/80 backdrop-blur-sm rounded-2xl p-8 mb-8 
                      border border-purple-700/50 shadow-lg">
          <div className="flex items-center gap-6 mb-6">
            <div className="p-4 rounded-xl shadow-inner">
              <span className="text-5xl">{cleanText(mission?.emoji)}</span>
            </div>
            <h1 className="heading text-5xl md:text-6xl lg:text-7xl text-white 
                          tracking-tight leading-tight animate-fadeIn">
              {cleanText(mission?.title)}
            </h1>
          </div>
          <p className="text-xl text-purple-200 leading-relaxed mb-6">
            {cleanText(mission?.description)}
          </p>
          <div className="text-sm text-purple-300">
            Created by <span className="font-medium text-white">
              {cleanText(mission?.createdBy?.username) || 'Anonymous'}
            </span>
          </div>
        </div>

        {/* Quests Section */}
        <div className="bg-purple-900/60 backdrop-blur-sm rounded-2xl p-8 
                      border border-purple-700/50 shadow-lg">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="text-purple-400">📋</span> Quests
            <span className="text-sm font-normal text-purple-300">
              ({Object.keys(mission?.quests || {}).length} steps)
            </span>
          </h2>
          
          <div className="space-y-4">
            {mission?.quests && Object.entries(mission.quests)
              .sort(([, a], [, b]) => a.order - b.order)
              .map(([key, quest]) => {
              console.log("Rendering quest:", key, quest);
              return (
                <div key={key} 
                     className="bg-purple-800/40 rounded-xl p-4 border border-purple-600/30
                              hover:border-purple-500/50 transition-all duration-200
                              hover:shadow-lg hover:shadow-purple-500/10">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 mr-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded border-2 flex items-center justify-center
                                      ${userQuests[key]?.completed === 1 
                                        ? 'border-green-500 bg-green-500/20' 
                                        : 'border-purple-500 bg-purple-800/30'}`}>
                          {userQuests[key]?.completed === 1 && (
                            <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-purple-400 text-sm font-medium">{key}.</span>
                          <h3 className="text-lg text-white">{cleanText(quest.questName)}</h3>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleQuestCompletion(key)}
                      disabled={!isEnrolled}
                      className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2
                              ${!isEnrolled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                              ${userQuests[key]?.completed === 1 ? 
                                'text-green-300 hover:text-green-200' : 
                                'text-purple-300 hover:text-purple-200'}`}>
                      {userQuests[key]?.completed === 1 ? (
                        'Uncheck'
                      ) : (
                        'Check'
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
            {Object.keys(mission?.quests || {}).length === 0 && (
              <div className="text-center text-purple-300 py-4">
                No quests found for this mission
              </div>
            )}
          </div>
        </div>

        {/* Progress Section */}
        <div className="mt-8 text-center">
          {!isEnrolled ? (
            <button 
              onClick={handleEnrollment}
              className="bg-purple-600 hover:bg-purple-500 text-white 
                       px-8 py-3 rounded-xl font-medium
                       transition-all duration-200 ease-in-out
                       hover:shadow-lg hover:shadow-purple-500/20
                       active:transform active:scale-95
                       flex items-center gap-2 mx-auto">
              Start Mission <span className="text-xl">→</span>
            </button>
          ) : (
            <p className="text-purple-200 text-lg">
              Mission in progress - Complete the quests above!
            </p>
          )}
        </div>

        {/* Add Comments Section */}
        <div className="mt-12">
          <div className="bg-purple-900/80 backdrop-blur-sm rounded-2xl p-8 
                      border border-purple-700/50 shadow-lg">
            <h3 className="text-2xl font-bold text-white mb-6">Mission Discussion</h3>

            {/* Comment Form */}
            <form onSubmit={handleCommentSubmit} className="mb-8">
              <div className="flex gap-4">
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your thoughts or ask questions..."
                  className="flex-1 bg-purple-800/30 text-white rounded-lg 
                           border border-purple-600/30 p-4
                           focus:outline-none focus:ring-2 focus:ring-purple-500/50
                           placeholder-purple-400/50"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !comment.trim() || !auth.currentUser}
                  className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 
                           rounded-lg transition-colors duration-200 disabled:opacity-50"
                >
                  Post
                </button>
              </div>
              {!auth.currentUser && (
                <p className="text-purple-300 text-sm mt-2">
                  Please sign in to post comments
                </p>
              )}
            </form>

            {/* Comments List */}
            <div className="space-y-4">
              {comments.map((comment) => (
                <div 
                  key={comment.id}
                  className="bg-purple-800/30 rounded-lg p-4 border border-purple-600/30"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {comment.userPhoto ? (
                      <img 
                        src={comment.userPhoto} 
                        alt={comment.userName}
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center">
                        {comment.userName[0]}
                      </div>
                    )}
                    <span className="text-purple-200 font-medium">{comment.userName}</span>
                    <span className="text-purple-400 text-sm">
                      {comment.createdAt?.toDate().toLocaleDateString() || 'Just now'}
                    </span>
                  </div>
                  <p className="text-white">{comment.text}</p>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-purple-300 text-center">
                  No comments yet. Be the first to share your thoughts!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Popup Component */}
      {showPopup && (
        <Popup
          title="Quest Completed! 🎉"
          message={`Congratulations! You've completed "${completedQuest}" and earned a badge!`}
          onClose={() => setShowPopup(false)}
        />
      )}

      {/* Timer Button */}
      <div className="fixed bottom-8 right-8 z-[60]">
        <button
          onClick={() => setShowTimer(true)}
          className="group relative flex items-center justify-center w-14 h-14
                   bg-gradient-to-br from-purple-600 to-purple-700
                   hover:from-purple-500 hover:to-purple-600
                   text-white rounded-full
                   shadow-[0_0_15px_rgba(168,85,247,0.5)]
                   hover:shadow-[0_0_25px_rgba(168,85,247,0.7)]
                   transition-all duration-300 ease-out
                   border border-purple-500/30
                   hover:border-purple-400/50
                   hover:scale-110"
        >
          <span className="text-2xl transform group-hover:scale-110 transition-transform duration-200">⏱️</span>
          <div className="absolute -top-12 bg-purple-900/90 px-3 py-1.5 rounded-lg
                      text-sm font-medium text-white opacity-0 group-hover:opacity-100
                      transition-opacity duration-200 whitespace-nowrap
                      border border-purple-500/30 backdrop-blur-sm
                      shadow-lg">
            Focus Timer
          </div>
        </button>
      </div>

      {/* Timer Component */}
      <Timer isOpen={showTimer} onClose={() => setShowTimer(false)} className="z-[70]" />
    </div>
  );
};

export default MissionPage;
